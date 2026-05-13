import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const category = searchParams.get("category") ?? "";
    const minPrice = parseFloat(searchParams.get("minPrice") ?? "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "999999");
    const sort = searchParams.get("sort") ?? "recommended";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const ids = searchParams.get("ids");

    const where = {
      isActive: true,
      ...(ids && { id: { in: ids.split(",").filter(Boolean) } }),
      ...(q && {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      }),
      ...(category && { category: { slug: category } }),
      price: { gte: minPrice, lte: maxPrice },
    };

    const orderBy =
      sort === "price_asc" ? { price: "asc" as const } :
      sort === "price_desc" ? { price: "desc" as const } :
      sort === "newest" ? { createdAt: "desc" as const } :
      sort === "best_selling" ? { sold: "desc" as const } :
      sort === "rating" ? { rating: "desc" as const } :
      { sold: "desc" as const };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          shop: { select: { id: true, name: true, slug: true, rating: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
