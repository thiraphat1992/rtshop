import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/product/ProductCard";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  href?: string;
  accentColor?: string;
  sortBy?: "newest" | "best_selling";
}

export default async function ProductSection({
  title,
  subtitle,
  href = "/products",
  accentColor = "text-orange-500",
  sortBy = "newest",
}: ProductSectionProps) {
  let products: {
    id: string; name: string; slug: string;
    price: number; comparePrice?: number;
    rating: number; sold: number; stock: number;
    images: { url: string; altText?: string }[];
    shop: { name: string };
    category?: { name: string };
  }[] = [];

  try {
    const raw = await prisma.product.findMany({
      where: { isActive: true, shop: { status: { not: "SUSPENDED" } } },
      include: {
        images:   { take: 1, orderBy: { sortOrder: "asc" } },
        shop:     { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: sortBy === "best_selling" ? { sold: "desc" } : { createdAt: "desc" },
      take: 6,
    });

    products = raw.map((p) => ({
      id:           p.id,
      name:         p.name,
      slug:         p.slug,
      price:        Number(p.price),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
      rating:       p.rating,
      sold:         p.sold,
      stock:        p.stock,
      images:       p.images.map((img) => ({ url: img.url, altText: img.altText ?? undefined })),
      shop:         { name: p.shop.name },
      category:     p.category ? { name: p.category.name } : undefined,
    }));
  } catch {
    // DB not available — render empty section
  }

  return (
    <section className="py-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <Link href={href} className={`text-sm font-medium ${accentColor} hover:opacity-80`}>
          ดูทั้งหมด →
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-2xl">
          <span className="text-4xl mb-3">🛍️</span>
          <p className="text-sm">ยังไม่มีสินค้า</p>
          <Link href="/seller/register" className="mt-2 text-xs text-orange-500 hover:underline">
            เปิดร้านและเพิ่มสินค้าแรกของคุณ →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} priority={false} />
          ))}
        </div>
      )}
    </section>
  );
}
