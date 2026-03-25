import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { improveQuestion } from "@/lib/anthropic";
import type { Question } from "@/lib/questions";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { partyId, adminPassword, currentQuestions, history } = await req.json();

    if (!partyId || !adminPassword || !history?.length) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const valid = await bcrypt.compare(adminPassword, party.adminPassword);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await improveQuestion(currentQuestions as Question[], history);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI questions error:", error);
    return NextResponse.json({ error: "AI request failed: " + String(error) }, { status: 500 });
  }
}
