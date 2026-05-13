import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

async function getSellerAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    if (payload.role !== "SELLER" && payload.role !== "ADMIN") return null;
    const shop = await prisma.shop.findUnique({ where: { userId: payload.userId } });
    if (!shop) return null;
    return { userId: payload.userId, shop };
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await getSellerAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { shopId: auth.shop.id },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = await Promise.all(
    conversations.map(async (conv) => ({
      ...conv,
      unreadCount: await prisma.message.count({
        where: {
          conversationId: conv.id,
          isRead: false,
          senderId: { not: auth.userId },
        },
      }),
    }))
  );

  return NextResponse.json(result);
}
