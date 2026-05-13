import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return NextResponse.json({ shop: null });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const shop = await prisma.shop.findUnique({
      where: { userId: payload.userId },
      select: { id: true, name: true, slug: true, logo: true, status: true, rating: true, totalSales: true },
    });
    return NextResponse.json({ shop });
  } catch {
    return NextResponse.json({ shop: null });
  }
}
