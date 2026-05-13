import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 เริ่มต้น seed database...");

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "fashion" },      update: {}, create: { name: "แฟชั่น",              slug: "fashion",      icon: "👗", sortOrder: 1 } }),
    prisma.category.upsert({ where: { slug: "electronics" },  update: {}, create: { name: "อิเล็กทรอนิกส์",      slug: "electronics",  icon: "📱", sortOrder: 2 } }),
    prisma.category.upsert({ where: { slug: "home-kitchen" }, update: {}, create: { name: "บ้านและครัว",          slug: "home-kitchen", icon: "🏠", sortOrder: 3 } }),
    prisma.category.upsert({ where: { slug: "sports" },       update: {}, create: { name: "กีฬา",                slug: "sports",       icon: "⚽", sortOrder: 4 } }),
    prisma.category.upsert({ where: { slug: "beauty" },       update: {}, create: { name: "ความงาม",             slug: "beauty",       icon: "💄", sortOrder: 5 } }),
    prisma.category.upsert({ where: { slug: "books" },        update: {}, create: { name: "หนังสือ",             slug: "books",        icon: "📚", sortOrder: 6 } }),
    prisma.category.upsert({ where: { slug: "food-drink" },   update: {}, create: { name: "อาหารและเครื่องดื่ม", slug: "food-drink",   icon: "🍜", sortOrder: 7 } }),
    prisma.category.upsert({ where: { slug: "automotive" },   update: {}, create: { name: "ยานยนต์",             slug: "automotive",   icon: "🚗", sortOrder: 8 } }),
  ]);
  console.log(`✅ สร้าง ${categories.length} หมวดหมู่`);

  // Admin user only — no example sellers/buyers
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  await prisma.user.upsert({
    where: { email: "admin@rtshop.com" },
    update: {},
    create: {
      email: "admin@rtshop.com",
      name: "ผู้ดูแลระบบ",
      password: adminPassword,
      role: "ADMIN",
      phone: "020000000",
    },
  });
  console.log("✅ สร้าง Admin: admin@rtshop.com / Admin@123456");

  // Banners
  await prisma.banner.createMany({
    skipDuplicates: true,
    data: [
      { title: "Flash Sale ลดสูงสุด 70%",   imageUrl: "https://picsum.photos/seed/banner1/1200/400", linkUrl: "/products?flash=true",   sortOrder: 1 },
      { title: "สินค้ามาใหม่ประจำสัปดาห์",  imageUrl: "https://picsum.photos/seed/banner2/1200/400", linkUrl: "/products?sort=newest",  sortOrder: 2 },
      { title: "ส่งฟรีทั่วไทยเมื่อซื้อครบ 299", imageUrl: "https://picsum.photos/seed/banner3/1200/400", linkUrl: "/products",           sortOrder: 3 },
    ],
  });
  console.log("✅ สร้าง Banners");

  console.log("\n🎉 Seed เสร็จสมบูรณ์!");
  console.log("📧 Admin: admin@rtshop.com / Admin@123456");
  console.log("ℹ️  ผู้ขายและลูกค้าสมัครผ่านหน้าเว็บได้เลย");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
