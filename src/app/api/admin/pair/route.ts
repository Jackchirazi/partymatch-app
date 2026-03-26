import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateMatchReason } from "@/lib/anthropic";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { partyId, adminPassword, action, guest1Id, guest2Id, guestId } = await req.json();

    if (!partyId || !adminPassword || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const valid = await bcrypt.compare(adminPassword, party.adminPassword);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (action === "pair") {
      if (!guest1Id || !guest2Id) return NextResponse.json({ error: "Missing guest IDs" }, { status: 400 });

      const [guest1, guest2] = await Promise.all([
        prisma.guest.findUnique({ where: { id: guest1Id } }),
        prisma.guest.findUnique({ where: { id: guest2Id } }),
      ]);

      if (!guest1 || !guest2) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

      const customQuestions = party.customQuestions ? JSON.parse(party.customQuestions) : undefined;

      let note = "You two have a lot more in common than you think.";
      try {
        note = await generateMatchReason(
          { id: guest1.id, name: guest1.name, gender: guest1.gender, answers: guest1.answers },
          { id: guest2.id, name: guest2.name, gender: guest2.gender, answers: guest2.answers },
          customQuestions
        );
      } catch {
        // fallback silently — still pair them, just without AI reason
      }

      await prisma.guest.update({ where: { id: guest1Id }, data: { matchedWith: guest2Id, matchNote: note } });
      await prisma.guest.update({ where: { id: guest2Id }, data: { matchedWith: guest1Id, matchNote: note } });
      return NextResponse.json({ success: true });
    }

    if (action === "unpair") {
      if (!guestId) return NextResponse.json({ error: "Missing guestId" }, { status: 400 });
      const guest = await prisma.guest.findUnique({ where: { id: guestId } });
      if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
      // Clear this guest and their partner(s)
      const partnerIds = guest.matchedWith ? guest.matchedWith.split(",") : [];
      await prisma.guest.update({ where: { id: guestId }, data: { matchedWith: null, matchNote: null } });
      for (const pid of partnerIds) {
        await prisma.guest.updateMany({
          where: { id: pid, partyId },
          data: { matchedWith: null, matchNote: null },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "finalize") {
      await prisma.party.update({ where: { id: partyId }, data: { matchingDone: true } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Pair error:", error);
    return NextResponse.json({ error: "Failed: " + String(error) }, { status: 500 });
  }
}
