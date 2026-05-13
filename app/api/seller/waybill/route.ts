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
    if (payload.role !== "SELLER") return null;
    return prisma.shop.findUnique({
      where: { userId: payload.userId },
      include: { user: { select: { phone: true } } },
    });
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const shop = await getSellerShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      items: { some: { product: { shopId: shop.id } } },
    },
    include: {
      user: { select: { name: true, phone: true } },
      items: {
        where: { product: { shopId: shop.id } },
        include: { product: { select: { name: true, weight: true } } },
      },
      address: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalWeight = order.items.reduce((sum, item) => {
    return sum + (Number(item.product.weight ?? 0) * item.quantity);
  }, 0);

  const waybill = {
    orderId: order.id,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    sender: {
      name: shop.name,
      phone: (shop as typeof shop & { user: { phone: string | null } }).user?.phone ?? "",
      address: shop.description ?? "",
    },
    receiver: {
      name: order.address?.recipientName ?? order.user.name ?? "",
      phone: order.address?.phone ?? order.user.phone ?? "",
      address: order.address
        ? `${order.address.addressLine} ${order.address.subDistrict} ${order.address.district} ${order.address.province} ${order.address.postalCode}`
        : "",
    },
    items: order.items.map((item) => ({
      name: item.product.name,
      variantId: item.variantId,
      quantity: item.quantity,
      price: Number(item.price),
    })),
    totalWeight: totalWeight.toFixed(2),
    totalAmount: Number(order.total),
    shippingFee: Number(order.shippingFee),
    createdAt: order.createdAt,
  };

  return NextResponse.json(waybill);
}
