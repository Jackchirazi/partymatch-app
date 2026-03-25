import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Party code is required" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found. Check your code!" }, { status: 404 });
    }

    const settings = party.settings ? JSON.parse(party.settings) : null;
    return NextResponse.json({ id: party.id, name: party.name, code: party.code, settings });
  } catch (error) {
    console.error("Join party error:", error);
    return NextResponse.json({ error: "Failed to join party" }, { status: 500 });
  }
}
