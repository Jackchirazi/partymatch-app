import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET — fetch all message threads for a party
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");
    const adminPassword = req.headers.get("x-admin-password");

    if (!partyId || !adminPassword) {
      return NextResponse.json({ error: "Missing partyId or password" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const valid = await bcrypt.compare(adminPassword, party.adminPassword);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all matched guests
    const guests = await prisma.guest.findMany({
      where: { partyId, matchedWith: { not: null } },
    });

    // Build unique pairs (avoid duplicates)
    const seen = new Set<string>();
    const pairs: { guest1Id: string; guest2Id: string }[] = [];

    for (const g of guests) {
      if (!g.matchedWith) continue;
      const partnerId = g.matchedWith.split(",")[0];
      const key = [g.id, partnerId].sort().join(":");
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({ guest1Id: g.id, guest2Id: partnerId });
      }
    }

    // For each pair, fetch messages and guest info
    const guestMap = new Map(guests.map((g) => [g.id, g]));

    // Also fetch any partner guests not in the matched list (edge case)
    const missingIds = pairs
      .flatMap((p) => [p.guest1Id, p.guest2Id])
      .filter((id) => !guestMap.has(id));

    if (missingIds.length > 0) {
      const extra = await prisma.guest.findMany({ where: { id: { in: missingIds } } });
      for (const g of extra) guestMap.set(g.id, g);
    }

    const threads = await Promise.all(
      pairs.map(async ({ guest1Id, guest2Id }) => {
        const messages = await prisma.message.findMany({
          where: {
            OR: [
              { senderId: guest1Id, receiverId: guest2Id },
              { senderId: guest2Id, receiverId: guest1Id },
            ],
          },
          orderBy: { createdAt: "asc" },
        });

        const g1 = guestMap.get(guest1Id);
        const g2 = guestMap.get(guest2Id);

        return {
          guest1: g1 ? { id: g1.id, name: g1.name, photoUrl: g1.photoUrl } : { id: guest1Id, name: "Unknown", photoUrl: null },
          guest2: g2 ? { id: g2.id, name: g2.name, photoUrl: g2.photoUrl } : { id: guest2Id, name: "Unknown", photoUrl: null },
          messages: messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            content: m.content,
            createdAt: m.createdAt,
          })),
          messageCount: messages.length,
          lastMessage: messages.length > 0 ? {
            content: messages[messages.length - 1].content,
            senderId: messages[messages.length - 1].senderId,
            createdAt: messages[messages.length - 1].createdAt,
          } : null,
        };
      })
    );

    return NextResponse.json({ threads });
  } catch (error) {
    console.error("Admin messages GET error:", error);
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
  }
}

// DELETE — admin silently deletes a message by ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const partyId = searchParams.get("partyId");
    const adminPassword = req.headers.get("x-admin-password");

    if (!messageId || !partyId || !adminPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const valid = await bcrypt.compare(adminPassword, party.adminPassword);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.message.delete({ where: { id: messageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin message DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}

// POST — admin sends a message as one of the guests in a thread
export async function POST(req: NextRequest) {
  try {
    const { partyId, adminPassword, senderId, receiverId, content } = await req.json();

    if (!partyId || !adminPassword || !senderId || !receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const valid = await bcrypt.compare(adminPassword, party.adminPassword);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const message = await prisma.message.create({
      data: { senderId, receiverId, content: content.trim() },
    });

    return NextResponse.json({
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
    });
  } catch (error) {
    console.error("Admin messages POST error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
