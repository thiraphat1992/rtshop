import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { z } from "zod";

const schema = z.object({
  shopName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const existing = await prisma.shop.findUnique({ where: { userId: user.id } });
  if (existing) return NextResponse.json({ message: "คุณมีร้านค้าอยู่แล้ว" }, { status: 400 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const slug = parsed.data.shopName
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿]+/g, "-")
    .replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

  const [shop] = await prisma.$transaction([
    prisma.shop.create({
      data: {
        userId: user.id,
        name: parsed.data.shopName,
        slug,
        description: parsed.data.description,
        status: "ACTIVE",
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { role: "SELLER" },
    }),
  ]);

  // Issue new JWT with updated role
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: "SELLER" },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  const res = NextResponse.json({ message: "สร้างร้านค้าสำเร็จ", shopId: shop.id }, { status: 201 });
  res.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
