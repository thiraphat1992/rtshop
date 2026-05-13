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

export async function GET(_req: NextRequest) {
  const shop = await getSellerShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [allDeliveredItems, pendingItems, recentOrders] = await Promise.all([
    prisma.orderItem.findMany({
      where: { product: { shopId: shop.id }, order: { status: "DELIVERED" } },
      select: {
        price: true,
        quantity: true,
        order: { select: { createdAt: true } },
      },
    }),
    prisma.orderItem.findMany({
      where: {
        product: { shopId: shop.id },
        order: { status: { in: ["PAID", "PROCESSING"] } },
      },
      select: { price: true, quantity: true },
    }),
    prisma.order.findMany({
      where: { items: { some: { product: { shopId: shop.id } } } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        items: {
          where: { product: { shopId: shop.id } },
          select: { price: true, quantity: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const itemRevenue = (items: { price: any; quantity: number }[]) =>
    items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  const totalRevenue = itemRevenue(allDeliveredItems);
  const monthRevenue = itemRevenue(
    allDeliveredItems.filter((i) => i.order.createdAt >= startOfMonth)
  );
  const prevMonthRevenue = itemRevenue(
    allDeliveredItems.filter(
      (i) => i.order.createdAt >= startOfPrevMonth && i.order.createdAt <= endOfPrevMonth
    )
  );
  const pendingPayout = itemRevenue(pendingItems);

  // 7-day chart
  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const item of allDeliveredItems) {
    const day = item.order.createdAt.toISOString().slice(0, 10);
    if (day in dailyMap) dailyMap[day] += Number(item.price) * item.quantity;
  }

  const transactions = recentOrders.map((o) => {
    const num = o.orderNumber ?? o.id.slice(-8).toUpperCase();
    return {
      id: num,
      orderId: o.id,
      type: "income" as const,
      label: `คำสั่งซื้อ #${num}`,
      amount: itemRevenue(o.items),
      date: o.createdAt.toLocaleDateString("th-TH"),
      status: o.status === "DELIVERED" ? "settled" : "pending",
      orderStatus: o.status,
    };
  });

  return NextResponse.json({
    monthRevenue,
    prevMonthRevenue,
    pendingPayout,
    balance: monthRevenue,
    totalRevenue,
    weeklyData: Object.entries(dailyMap).map(([date, total]) => ({ date, total })),
    transactions,
    bank: {
      bankName: shop.bankName ?? "",
      bankAccount: shop.bankAccount ?? "",
    },
  });
}
