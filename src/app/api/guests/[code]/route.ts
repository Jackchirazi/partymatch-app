import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const adminPassword = req.headers.get("x-admin-password");

    if (!adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const party = await prisma.party.findUnique({ where: { code } });
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(adminPassword, party.adminPassword);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guests = await prisma.guest.findMany({
      where: { partyId: party.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      party: { id: party.id, name: party.name, code: party.code, matchingDone: party.matchingDone, customQuestions: party.customQuestions },
      guests: guests.map((g) => ({
        id: g.id,
        name: g.name,
        gender: g.gender,
        photoUrl: g.photoUrl,
        answers: JSON.parse(g.answers),
        matchedWith: g.matchedWith,
        matchNote: g.matchNote,
        createdAt: g.createdAt,
      })),
    });
  } catch (error) {
    console.error("List guests error:", error);
    return NextResponse.json({ error: "Failed to get guests" }, { status: 500 });
  }
}
