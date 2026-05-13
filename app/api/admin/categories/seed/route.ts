import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    return payload.role === "ADMIN" ? payload : null;
  } catch {
    return null;
  }
}

const DEFAULT_CATEGORIES = [
  { name: "แฟชั่น",              slug: "fashion",      icon: "👗", sortOrder: 1 },
  { name: "อิเล็กทรอนิกส์",      slug: "electronics",  icon: "📱", sortOrder: 2 },
  { name: "บ้านและครัว",          slug: "home-kitchen", icon: "🏠", sortOrder: 3 },
  { name: "กีฬา",                slug: "sports",       icon: "⚽", sortOrder: 4 },
  { name: "ความงาม",             slug: "beauty",       icon: "💄", sortOrder: 5 },
  { name: "หนังสือ",             slug: "books",        icon: "📚", sortOrder: 6 },
  { name: "อาหารและเครื่องดื่ม", slug: "food-drink",   icon: "🍜", sortOrder: 7 },
  { name: "ยานยนต์",             slug: "automotive",   icon: "🚗", sortOrder: 8 },
  { name: "สุขภาพ",              slug: "health",       icon: "🏥", sortOrder: 9 },
  { name: "ของเล่น",             slug: "toys",         icon: "🧸", sortOrder: 10 },
  { name: "สัตว์เลี้ยง",         slug: "pets",         icon: "🐾", sortOrder: 11 },
];

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let created = 0;
  let skipped = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    try {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: { ...cat, isActive: true },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ message: `เพิ่ม ${created} หมวดหมู่, ข้าม ${skipped} รายการ (มีอยู่แล้ว)`, created, skipped });
}
