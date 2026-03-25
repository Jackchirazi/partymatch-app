import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { defaultSettings } from "@/lib/themes";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");
    const code = searchParams.get("code");

    let party;
    if (partyId) {
      party = await prisma.party.findUnique({ where: { id: partyId } });
    } else if (code) {
      party = await prisma.party.findUnique({ where: { code } });
    } else {
      return NextResponse.json({ settings: defaultSettings });
    }

    if (!party) return NextResponse.json({ settings: defaultSettings });
    const settings = party.settings ? JSON.parse(party.settings) : defaultSettings;
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json({ settings: defaultSettings });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { partyId, adminPassword, settings } = await req.json();
    if (!partyId || !adminPassword || !settings) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const valid = await bcrypt.compare(adminPassword, party.adminPassword);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.party.update({
      where: { id: partyId },
      data: { settings: JSON.stringify(settings) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
