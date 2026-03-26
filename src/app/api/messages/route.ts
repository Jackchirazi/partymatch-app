import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId");

    if (!guestId) {
      return NextResponse.json({ error: "guestId required" }, { status: 400 });
    }

    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest || !guest.matchedWith) {
      return NextResponse.json({ messages: [], partner: null });
    }

    // matchedWith can be "id" or "id1,id2" for trios — use first ID for 1-on-1 chat
    const partnerId = guest.matchedWith.split(",")[0];
    const partner = await prisma.guest.findUnique({ where: { id: partnerId } });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: guestId, receiverId: partnerId },
          { senderId: partnerId, receiverId: guestId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt,
      })),
      partner: partner ? { id: partner.id, name: partner.name, photoUrl: partner.photoUrl } : null,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { senderId, content } = await req.json();

    if (!senderId || !content?.trim()) {
      return NextResponse.json({ error: "senderId and content required" }, { status: 400 });
    }

    const sender = await prisma.guest.findUnique({ where: { id: senderId } });
    if (!sender || !sender.matchedWith) {
      return NextResponse.json({ error: "No match found" }, { status: 400 });
    }

    const receiverId = sender.matchedWith.split(",")[0];

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
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
