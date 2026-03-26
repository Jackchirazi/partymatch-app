import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { code, name, pin } = await req.json();

    if (!code || !name || !pin) {
      return NextResponse.json({ error: "Party code, name, and PIN required" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { code: code.toUpperCase() } });
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    // Find guest by partyId + name (case-insensitive)
    const guests = await prisma.guest.findMany({
      where: {
        partyId: party.id,
        name: { equals: name.trim(), mode: "insensitive" },
      },
    });

    if (guests.length === 0) {
      return NextResponse.json({ error: "Name not found in this party" }, { status: 401 });
    }

    // Try each match (shouldn't be multiple, but handle gracefully)
    for (const guest of guests) {
      if (!guest.pin) continue;
      const valid = await bcrypt.compare(pin, guest.pin);
      if (valid) {
        const settings = party.settings ? JSON.parse(party.settings) : null;
        return NextResponse.json({
          guestId: guest.id,
          guestName: guest.name,
          partyId: party.id,
          partyCode: party.code,
          partyName: party.name,
          settings,
        });
      }
    }

    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
