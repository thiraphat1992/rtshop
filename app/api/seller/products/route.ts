import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { z } from "zod";
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

const productSchema = z.object({
  name: z.string().min(1).max(140),
  description: z.string().min(1),
  categoryId: z.string(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  weight: z.number().min(0).optional(),
  width:  z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  depth:  z.number().min(0).optional(),
  images: z.array(z.string().min(1)).optional(),
  variants: z.array(z.object({
    name: z.string(),
    value: z.string(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0),
    sku: z.string().optional(),
  })).optional(),
});

export async function GET(req: NextRequest) {
  const shop = await getSellerShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {
    shopId: shop.id,
    ...(q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { take: 1 }, category: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const shop = await getSellerShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { name, description, categoryId, price, comparePrice, stock, sku, weight, width, height, depth, images, variants } = parsed.data;
  const slug = `${name.toLowerCase().replace(/[^a-z0-9฀-๿]+/g, "-")}-${Date.now()}`;

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      comparePrice,
      stock,
      sku,
      weight,
      width,
      height,
      depth,
      shopId: shop.id,
      categoryId,
      ...(images?.length
        ? { images: { create: images.map((url, i) => ({ url, sortOrder: i })) } }
        : {}),
      ...(variants?.length
        ? { variants: { create: variants.map((v) => ({ name: v.name, value: v.value, price: v.price, stock: v.stock, sku: v.sku })) } }
        : {}),
    },
    include: { images: true, variants: true },
  });

  return NextResponse.json(product, { status: 201 });
}
