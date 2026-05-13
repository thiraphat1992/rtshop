import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const adminExists = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  return NextResponse.json({ setupDone: !!adminExists });
}

export async function POST(req: NextRequest) {
  const adminExists = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (adminExists) {
    return NextResponse.json({ error: "ตั้งค่าแอดมินแล้ว" }, { status: 403 });
  }

  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Promote existing user to ADMIN
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    return NextResponse.json({ message: "อัปเกรดบัญชีเป็นแอดมินสำเร็จ" });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, password: hashed, role: "ADMIN" },
  });

  return NextResponse.json({ message: "สร้างบัญชีแอดมินสำเร็จ" }, { status: 201 });
}
