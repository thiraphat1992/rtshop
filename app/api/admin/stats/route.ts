import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    if (payload.role !== "ADMIN") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, newUsersToday, totalShops, pendingShops,
    totalOrders, todayOrders, totalRevenue, monthRevenue,
    totalProducts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.shop.count(),
    prisma.shop.count({ where: { status: "PENDING" } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", createdAt: { gte: startOfMonth } } }),
    prisma.product.count(),
  ]);

  // Order status breakdown
  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  // 7-day daily revenue
  const recentOrders = await prisma.order.findMany({
    where: { createdAt: { gte: sevenDaysAgo }, status: "DELIVERED" },
    select: { total: true, createdAt: true },
  });

  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  recentOrders.forEach((o) => {
    const day = o.createdAt.toISOString().slice(0, 10);
    if (day in dailyMap) dailyMap[day] += Number(o.total);
  });

  return NextResponse.json({
    totalUsers,
    newUsersToday,
    totalShops,
    pendingShops,
    totalOrders,
    todayOrders,
    totalRevenue: Number(totalRevenue._sum.total ?? 0),
    monthRevenue: Number(monthRevenue._sum.total ?? 0),
    totalProducts,
    statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count.status })),
    dailySales: Object.entries(dailyMap).map(([date, total]) => ({ date, total })),
  });
}
