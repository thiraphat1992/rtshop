import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.userId },
    include: {
      shop: { select: { id: true, name: true, logo: true, slug: true } },
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
          senderId: { not: user.userId },
        },
      }),
    }))
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shopId } = await req.json();
  if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

  const conversation = await prisma.conversation.upsert({
    where: { userId_shopId: { userId: user.userId, shopId } },
    update: {},
    create: { userId: user.userId, shopId },
    include: {
      shop: { select: { id: true, name: true, logo: true, slug: true } },
    },
  });

  return NextResponse.json(conversation);
}
