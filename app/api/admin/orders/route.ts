import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { OrderStatus } from "@prisma/client";
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

const VALID_STATUSES = Object.values(OrderStatus);

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const statusParam = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const statusFilter =
    statusParam && VALID_STATUSES.includes(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined;

  const where = {
    ...(q ? { OR: [{ id: { contains: q } }, { user: { name: { contains: q } } }] } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [orders, total, revenue] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true } },
        items: {
          take: 1,
          include: { product: { select: { shop: { select: { name: true } } } } },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED" } }),
  ]);

  const ordersFormatted = orders.map((o) => ({
    id: o.orderNumber ?? o.id.slice(-8).toUpperCase(),
    rawId: o.id,
    status: o.status,
    total: Number(o.total),
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt.toLocaleDateString("th-TH"),
    customer: o.user.name,
    shopName: o.items[0]?.product?.shop?.name ?? "",
    itemCount: o._count.items,
  }));

  return NextResponse.json({
    orders: ordersFormatted,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    totalRevenue: Number(revenue._sum.total ?? 0),
  });
}
