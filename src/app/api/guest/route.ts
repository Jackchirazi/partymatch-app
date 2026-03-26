import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { partyId, name, pin, gender, photoUrl, answers } = await req.json();

    if (!partyId || !name || !answers) {
      return NextResponse.json(
        { error: "Party ID, name, and answers are required" },
        { status: 400 }
      );
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "A 4-digit PIN is required" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const guest = await prisma.guest.create({
      data: {
        partyId,
        name,
        pin: hashedPin,
        gender: gender || null,
        photoUrl: photoUrl || null,
        answers: JSON.stringify(answers),
      },
    });

    return NextResponse.json({ id: guest.id, name: guest.name });
  } catch (error) {
    console.error("Create guest error:", error);
    return NextResponse.json({ error: "Failed to save your answers" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Guest ID required" }, { status: 400 });
    }

    const guest = await prisma.guest.findUnique({ where: { id } });
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: guest.id,
      name: guest.name,
      matchedWith: guest.matchedWith,
      matchNote: guest.matchNote,
    });
  } catch (error) {
    console.error("Get guest error:", error);
    return NextResponse.json({ error: "Failed to get guest" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const adminPassword = req.headers.get("x-admin-password");

    if (!id || !adminPassword) {
      return NextResponse.json({ error: "Missing guest ID or password" }, { status: 400 });
    }

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: { party: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(adminPassword, guest.party.adminPassword);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.guest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete guest error:", error);
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 });
  }
}
