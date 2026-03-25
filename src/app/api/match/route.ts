import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { matchGuests } from "@/lib/anthropic";

export const maxDuration = 60; // Allow up to 60 seconds for Claude API call

export async function POST(req: NextRequest) {
  try {
    const { partyId, adminPassword } = await req.json();

    if (!partyId || !adminPassword) {
      return NextResponse.json({ error: "Party ID and password required" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(adminPassword, party.adminPassword);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guests = await prisma.guest.findMany({ where: { partyId } });
    if (guests.length < 2) {
      return NextResponse.json({ error: "Need at least 2 guests to match!" }, { status: 400 });
    }

    // Clear any existing matches first (allows re-matching)
    await prisma.guest.updateMany({
      where: { partyId },
      data: { matchedWith: null, matchNote: null },
    });

    // Parse custom questions if party has them
    const customQuestions = party.customQuestions
      ? JSON.parse(party.customQuestions)
      : undefined;

    // Call Claude to do the matching
    const result = await matchGuests(
      guests.map((g) => ({ id: g.id, name: g.name, gender: g.gender, answers: g.answers })),
      customQuestions
    );

    // Validate all IDs returned by Claude exist in our guest list
    const validIds = new Set(guests.map((g) => g.id));
    const matchedIds = new Set<string>();

    const validMatches = result.matches.filter((match) => {
      const ids = [match.guest1_id, match.guest2_id, match.guest3_id].filter(Boolean) as string[];
      return ids.every((id) => validIds.has(id));
    });

    // Write valid matches to DB
    for (const match of validMatches) {
      // Skip if any guest in this match was already matched (Claude sometimes duplicates)
      if (matchedIds.has(match.guest1_id) || matchedIds.has(match.guest2_id)) continue;
      if (match.guest3_id && matchedIds.has(match.guest3_id)) continue;

      matchedIds.add(match.guest1_id);
      matchedIds.add(match.guest2_id);

      if (match.guest3_id) {
        matchedIds.add(match.guest3_id);
        await prisma.guest.update({
          where: { id: match.guest1_id },
          data: { matchedWith: `${match.guest2_id},${match.guest3_id}`, matchNote: match.reason },
        });
        await prisma.guest.update({
          where: { id: match.guest2_id },
          data: { matchedWith: `${match.guest1_id},${match.guest3_id}`, matchNote: match.reason },
        });
        await prisma.guest.update({
          where: { id: match.guest3_id },
          data: { matchedWith: match.guest1_id, matchNote: match.reason },
        });
      } else {
        await prisma.guest.update({
          where: { id: match.guest1_id },
          data: { matchedWith: match.guest2_id, matchNote: match.reason },
        });
        await prisma.guest.update({
          where: { id: match.guest2_id },
          data: { matchedWith: match.guest1_id, matchNote: match.reason },
        });
      }
    }

    // Fallback: pair any guests Claude missed
    const unmatchedGuests = guests.filter((g) => !matchedIds.has(g.id));
    const fallbackNote = "You both bring the fun — find out what you have in common! 🔥";
    while (unmatchedGuests.length >= 2) {
      const g1 = unmatchedGuests.shift()!;
      const g2 = unmatchedGuests.shift()!;
      if (unmatchedGuests.length === 1) {
        // trio
        const g3 = unmatchedGuests.shift()!;
        await prisma.guest.update({ where: { id: g1.id }, data: { matchedWith: `${g2.id},${g3.id}`, matchNote: fallbackNote } });
        await prisma.guest.update({ where: { id: g2.id }, data: { matchedWith: `${g1.id},${g3.id}`, matchNote: fallbackNote } });
        await prisma.guest.update({ where: { id: g3.id }, data: { matchedWith: g1.id, matchNote: fallbackNote } });
      } else {
        await prisma.guest.update({ where: { id: g1.id }, data: { matchedWith: g2.id, matchNote: fallbackNote } });
        await prisma.guest.update({ where: { id: g2.id }, data: { matchedWith: g1.id, matchNote: fallbackNote } });
      }
    }
    // If exactly 1 left (shouldn't happen with proper odd-number handling, but just in case)
    if (unmatchedGuests.length === 1) {
      // Match them with a random already-matched guest
      const solo = unmatchedGuests[0];
      const anyGuest = guests.find((g) => g.id !== solo.id);
      if (anyGuest) {
        await prisma.guest.update({ where: { id: solo.id }, data: { matchedWith: anyGuest.id, matchNote: fallbackNote } });
      }
    }

    const totalMatched = guests.length - unmatchedGuests.length;

    await prisma.party.update({
      where: { id: partyId },
      data: { matchingDone: true },
    });

    return NextResponse.json({ success: true, matchCount: Math.ceil(totalMatched / 2) });
  } catch (error) {
    console.error("Match error:", error);
    return NextResponse.json({ error: "Matching failed: " + String(error) }, { status: 500 });
  }
}
