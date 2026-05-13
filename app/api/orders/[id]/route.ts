import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      address: true,
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              shop: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!order) return NextResponse.json({ message: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
  });

  if (!order) return NextResponse.json({ message: "ไม่พบคำสั่งซื้อ" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as { action?: string };

  if (body?.action === "confirm_receipt") {
    if (order.status !== "SHIPPED") {
      return NextResponse.json({ message: "ไม่สามารถยืนยันรับสินค้าได้" }, { status: 400 });
    }
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "DELIVERED" },
    });
    return NextResponse.json(updated);
  }

  // Default: cancel
  const cancellableStatuses = ["PENDING_PAYMENT", "PAID"];
  if (!cancellableStatuses.includes(order.status)) {
    return NextResponse.json({ message: "ไม่สามารถยกเลิกออเดอร์นี้ได้" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  // Restore stock
  const items = await prisma.orderItem.findMany({ where: { orderId: id } });
  await Promise.all(
    items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          sold: { decrement: item.quantity },
        },
      })
    )
  );

  return NextResponse.json(updated);
}
