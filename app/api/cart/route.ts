import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getUserId(req: NextRequest): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          shop: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { productId, quantity = 1, variantId } = await req.json();
  if (!productId) return NextResponse.json({ message: "กรุณาระบุสินค้า" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return NextResponse.json({ message: "ไม่พบสินค้า" }, { status: 404 });
  }
  if (product.stock < quantity) {
    return NextResponse.json({ message: "สินค้าไม่เพียงพอ" }, { status: 400 });
  }

  const item = await prisma.cartItem.upsert({
    where: { userId_productId_variantId: { userId, productId, variantId: variantId ?? "" } },
    update: { quantity: { increment: quantity } },
    create: { userId, productId, quantity, variantId: variantId ?? null },
  });

  return NextResponse.json({ message: "เพิ่มสินค้าในตะกร้าแล้ว", item }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { productId, variantId } = await req.json();
  await prisma.cartItem.deleteMany({
    where: { userId, productId, variantId: variantId ?? null },
  });

  return NextResponse.json({ message: "ลบสินค้าออกจากตะกร้าแล้ว" });
}
