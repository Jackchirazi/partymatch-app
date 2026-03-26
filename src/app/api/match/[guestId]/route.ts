import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const { guestId } = await params;

    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Always fetch fresh party settings so clients stay in sync
    const party = await prisma.party.findUnique({ where: { id: guest.partyId } });
    const settings = party?.settings ? JSON.parse(party.settings) : null;

    if (!guest.matchedWith) {
      return NextResponse.json({ matched: false, settings });
    }

    // Handle possible trio (comma-separated IDs)
    const matchedIds = guest.matchedWith.split(",");
    const matchedGuests = await prisma.guest.findMany({
      where: { id: { in: matchedIds } },
    });

    return NextResponse.json({
      matched: true,
      matches: matchedGuests.map((m) => ({
        id: m.id,
        name: m.name,
        photoUrl: m.photoUrl,
      })),
      matchNote: guest.matchNote,
      settings,
    });
  } catch (error) {
    console.error("Get match error:", error);
    return NextResponse.json({ error: "Failed to get match" }, { status: 500 });
  }
}
