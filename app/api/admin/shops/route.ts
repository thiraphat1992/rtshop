import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { ShopStatus } from "@prisma/client";
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

const VALID_STATUSES = Object.values(ShopStatus);

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
    statusParam && VALID_STATUSES.includes(statusParam as ShopStatus)
      ? (statusParam as ShopStatus)
      : undefined;

  const where = {
    ...(q ? { OR: [{ name: { contains: q } }, { user: { name: { contains: q } } }] } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.shop.count({ where }),
  ]);

  return NextResponse.json({ shops, total, page, totalPages: Math.ceil(total / limit) });
}
