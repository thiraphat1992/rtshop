import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      banner: true,
      rating: true,
      totalSales: true,
      createdAt: true,
      _count: { select: { products: true } },
    },
  });

  if (!shop) return NextResponse.json({ message: "ไม่พบร้านค้า" }, { status: 404 });

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { shopId: shop.id, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { name: true } },
        shop: { select: { name: true, slug: true } },
      },
      orderBy: { sold: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where: { shopId: shop.id, isActive: true } }),
  ]);

  return NextResponse.json({
    shop,
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
