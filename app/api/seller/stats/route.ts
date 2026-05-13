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
    return prisma.shop.findUnique({ where: { userId: payload.userId } });
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest) {
  const shop = await getSellerShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalOrders,
    monthOrders,
    lastMonthOrders,
    pendingOrders,
    totalProducts,
    activeProducts,
    revenueThisMonth,
    revenueLastMonth,
  ] = await Promise.all([
    prisma.order.count({ where: { items: { some: { product: { shopId: shop.id } } } } }),
    prisma.order.count({
      where: {
        items: { some: { product: { shopId: shop.id } } },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.order.count({
      where: {
        items: { some: { product: { shopId: shop.id } } },
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
    prisma.order.count({
      where: {
        status: { in: ["PAID", "PROCESSING"] },
        items: { some: { product: { shopId: shop.id } } },
      },
    }),
    prisma.product.count({ where: { shopId: shop.id } }),
    prisma.product.count({ where: { shopId: shop.id, isActive: true } }),
    prisma.orderItem.aggregate({
      _sum: { price: true },
      where: {
        product: { shopId: shop.id },
        order: { createdAt: { gte: startOfMonth }, status: { in: ["DELIVERED", "SHIPPED"] } },
      },
    }),
    prisma.orderItem.aggregate({
      _sum: { price: true },
      where: {
        product: { shopId: shop.id },
        order: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { in: ["DELIVERED", "SHIPPED"] },
        },
      },
    }),
  ]);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dailySales = await prisma.orderItem.findMany({
    where: {
      product: { shopId: shop.id },
      order: { createdAt: { gte: sevenDaysAgo }, status: { in: ["DELIVERED", "SHIPPED"] } },
    },
    select: { price: true, quantity: true, order: { select: { createdAt: true } } },
  });

  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  dailySales.forEach((item) => {
    const day = (item.order as { createdAt: Date }).createdAt.toISOString().slice(0, 10);
    if (day in dailyMap) dailyMap[day] += Number(item.price) * item.quantity;
  });

  return NextResponse.json({
    totalOrders,
    monthOrders,
    lastMonthOrders,
    pendingOrders,
    totalProducts,
    activeProducts,
    revenueThisMonth: Number(revenueThisMonth._sum.price ?? 0),
    revenueLastMonth: Number(revenueLastMonth._sum.price ?? 0),
    dailySales: Object.entries(dailyMap).map(([date, total]) => ({ date, total })),
  });
}
