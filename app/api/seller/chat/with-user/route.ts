import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

async function getSellerShop() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    if (payload.role !== "SELLER" && payload.role !== "ADMIN") return null;
    return prisma.shop.findUnique({ where: { userId: payload.userId } });
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const shop = await getSellerShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const buyer = await prisma.user.findUnique({ where: { id: userId } });
  if (!buyer) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const conv = await prisma.conversation.upsert({
    where: { userId_shopId: { userId, shopId: shop.id } },
    update: { updatedAt: new Date() },
    create: { userId, shopId: shop.id },
  });

  return NextResponse.json({ conversationId: conv.id });
}
