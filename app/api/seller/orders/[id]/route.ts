import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { z } from "zod";
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

const updateSchema = z.object({
  status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  paymentVerified: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await getSellerShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: {
      id,
      items: { some: { product: { shopId: shop.id } } },
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: { product: { include: { images: { take: 1 } } } },
      },
      address: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await getSellerShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.order.findFirst({
    where: { id, items: { some: { product: { shopId: shop.id } } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "SHIPPED" && existing.paymentMethod === "cod" && existing.status === "PENDING_PAYMENT") {
    // COD orders: mark as paid when shipping is confirmed
    updateData.paymentStatus = "SUCCESS";
  } else if (parsed.data.paymentVerified === true && existing.status === "PENDING_PAYMENT") {
    updateData.status = "PAID";
    updateData.paymentStatus = "SUCCESS";
  } else if (parsed.data.paymentVerified === false) {
    // Reject payment proof — clear the slip so buyer can re-upload
    updateData.slipUrl = null;
    updateData.slipUploadedAt = null;
    updateData.paymentStatus = "PENDING";
  }

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(order);
}
