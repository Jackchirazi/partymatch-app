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

    // Write matches to DB
    for (const match of result.matches) {
      await prisma.guest.update({
        where: { id: match.guest1_id },
        data: { matchedWith: match.guest2_id, matchNote: match.reason },
      });
      await prisma.guest.update({
        where: { id: match.guest2_id },
        data: { matchedWith: match.guest1_id, matchNote: match.reason },
      });
      if (match.guest3_id) {
        await prisma.guest.update({
          where: { id: match.guest3_id },
          data: { matchedWith: match.guest1_id, matchNote: match.reason },
        });
        // Update guest1 to know about the trio
        await prisma.guest.update({
          where: { id: match.guest1_id },
          data: { matchedWith: `${match.guest2_id},${match.guest3_id}` },
        });
        await prisma.guest.update({
          where: { id: match.guest2_id },
          data: { matchedWith: `${match.guest1_id},${match.guest3_id}` },
        });
      }
    }

    await prisma.party.update({
      where: { id: partyId },
      data: { matchingDone: true },
    });

    return NextResponse.json({ success: true, matchCount: result.matches.length });
  } catch (error) {
    console.error("Match error:", error);
    return NextResponse.json({ error: "Matching failed: " + String(error) }, { status: 500 });
  }
}
