import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { OrderStatus } from "@prisma/client";
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

const VALID_STATUSES = Object.values(OrderStatus);

export async function GET(req: NextRequest) {
  const shop = await getSellerShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const statusFilter =
    statusParam && statusParam !== "all" && VALID_STATUSES.includes(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined;

  const where = {
    items: { some: { product: { shopId: shop.id } } },
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { orderNumber: { contains: q } },
            { user: { name: { contains: q } } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          where: { product: { shopId: shop.id } },
          include: { product: { include: { images: { take: 1 } } } },
        },
        address: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
}
