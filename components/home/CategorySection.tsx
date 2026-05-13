import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const FALLBACK_COLORS = [
  "bg-pink-50 hover:bg-pink-100",
  "bg-blue-50 hover:bg-blue-100",
  "bg-yellow-50 hover:bg-yellow-100",
  "bg-green-50 hover:bg-green-100",
  "bg-rose-50 hover:bg-rose-100",
  "bg-purple-50 hover:bg-purple-100",
  "bg-orange-50 hover:bg-orange-100",
  "bg-gray-50 hover:bg-gray-100",
  "bg-indigo-50 hover:bg-indigo-100",
  "bg-amber-50 hover:bg-amber-100",
  "bg-teal-50 hover:bg-teal-100",
];

const STATIC_CATEGORIES = [
  { id: "fashion",      name: "แฟชั่น",              slug: "fashion",      icon: "👗" },
  { id: "electronics",  name: "อิเล็กทรอนิกส์",      slug: "electronics",  icon: "📱" },
  { id: "home-kitchen", name: "บ้านและครัว",          slug: "home-kitchen", icon: "🏠" },
  { id: "sports",       name: "กีฬา",                slug: "sports",       icon: "⚽" },
  { id: "beauty",       name: "ความงาม",             slug: "beauty",       icon: "💄" },
  { id: "books",        name: "หนังสือ",             slug: "books",        icon: "📚" },
  { id: "food-drink",   name: "อาหารและเครื่องดื่ม", slug: "food-drink",   icon: "🍜" },
  { id: "automotive",   name: "ยานยนต์",             slug: "automotive",   icon: "🚗" },
];

export default async function CategorySection() {
  let categories: { id: string; name: string; slug: string; icon: string }[] = [];

  try {
    const raw = await prisma.category.findMany({
      where:   { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      take:    11,
    });
    categories = raw.map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon ?? "📦" }));
  } catch {
    // DB not available — use static list
  }

  if (categories.length === 0) categories = STATIC_CATEGORIES;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">หมวดหมู่สินค้า</h2>
        <Link href="/products" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
          ดูทั้งหมด →
        </Link>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className={`w-20 flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm ${FALLBACK_COLORS[i % FALLBACK_COLORS.length]}`}
          >
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-xs text-center font-medium leading-tight line-clamp-2">{cat.name}</span>
          </Link>
        ))}
        <Link
          href="/products"
          className="w-20 flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm bg-orange-500 hover:bg-orange-600 text-white"
        >
          <span className="text-2xl">🛍️</span>
          <span className="text-xs text-center font-medium leading-tight">ดูทั้งหมด</span>
        </Link>
      </div>
    </section>
  );
}
