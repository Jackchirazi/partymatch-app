import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { questions as defaultQuestions } from "@/lib/questions";

// GET: fetch questions for a party (public — guests use this too)
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
      return NextResponse.json({ questions: defaultQuestions });
    }

    if (!party) return NextResponse.json({ questions: defaultQuestions });

    const questions = party.customQuestions
      ? JSON.parse(party.customQuestions)
      : defaultQuestions;

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json({ questions: defaultQuestions });
  }
}

// POST: save custom questions (admin only)
export async function POST(req: NextRequest) {
  try {
    const { partyId, adminPassword, questions } = await req.json();
    if (!partyId || !adminPassword || !questions) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const valid = await bcrypt.compare(adminPassword, party.adminPassword);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.party.update({
      where: { id: partyId },
      data: { customQuestions: JSON.stringify(questions) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save questions error:", error);
    return NextResponse.json({ error: "Failed to save questions" }, { status: 500 });
  }
}

// DELETE: reset to default questions
export async function DELETE(req: NextRequest) {
  try {
    const { partyId, adminPassword } = await req.json();
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const valid = await bcrypt.compare(adminPassword, party.adminPassword);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.party.update({ where: { id: partyId }, data: { customQuestions: null } });
    return NextResponse.json({ success: true, questions: defaultQuestions });
  } catch (error) {
    console.error("Reset questions error:", error);
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
