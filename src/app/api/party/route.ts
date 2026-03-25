import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const { name, adminPassword } = await req.json();

    if (!name || !adminPassword) {
      return NextResponse.json(
        { error: "Party name and password are required" },
        { status: 400 }
      );
    }

    // Generate a unique 6-char code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.party.findUnique({ where: { code } });
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const party = await prisma.party.create({
      data: { code, name, adminPassword: hashedPassword },
    });

    return NextResponse.json({ id: party.id, code: party.code, name: party.name });
  } catch (error) {
    console.error("Create party error:", error);
    return NextResponse.json({ error: "Failed to create party" }, { status: 500 });
  }
}
