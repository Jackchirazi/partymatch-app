import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const sets = await prisma.questionSet.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, questions: true, createdAt: true },
    });
    return NextResponse.json({ sets: sets.map((s) => ({ ...s, questions: JSON.parse(s.questions) })) });
  } catch (error) {
    console.error("Get question sets error:", error);
    return NextResponse.json({ sets: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, questions } = await req.json();
    if (!name?.trim() || !questions?.length) {
      return NextResponse.json({ error: "Name and questions required" }, { status: 400 });
    }
    const set = await prisma.questionSet.create({
      data: { name: name.trim(), questions: JSON.stringify(questions) },
    });
    return NextResponse.json({ id: set.id, name: set.name });
  } catch (error) {
    console.error("Save question set error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
