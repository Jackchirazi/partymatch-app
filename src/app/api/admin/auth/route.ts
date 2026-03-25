import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { code, password } = await req.json();

    if (!code || !password) {
      return NextResponse.json({ error: "Code and password required" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!party) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const valid = await bcrypt.compare(password, party.adminPassword);
    return NextResponse.json({ valid });
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
