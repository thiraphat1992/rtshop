import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return NextResponse.json({ count: 0 });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };

    if (payload.role === "SELLER" || payload.role === "ADMIN") {
      const shop = await prisma.shop.findUnique({ where: { userId: payload.userId } });
      if (!shop) return NextResponse.json({ count: 0 });
      const count = await prisma.message.count({
        where: {
          conversation: { shopId: shop.id },
          isRead: false,
          senderId: { not: payload.userId },
        },
      });
      return NextResponse.json({ count });
    } else {
      const count = await prisma.message.count({
        where: {
          conversation: { userId: payload.userId },
          isRead: false,
          senderId: { not: payload.userId },
        },
      });
      return NextResponse.json({ count });
    }
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
