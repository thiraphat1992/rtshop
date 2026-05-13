import React from "react";
import Link from "next/link";

const promos = [
  {
    title: "Flash Sale",
    subtitle: "ลดสูงสุด 80%",
    desc: "ทุกวัน 12:00 - 14:00 น.",
    href: "/products?flash=true",
    bg: "from-red-500 to-orange-500",
    emoji: "⚡",
  },
  {
    title: "Free Shipping",
    subtitle: "ส่งฟรีทั่วไทย",
    desc: "เมื่อช้อปครบ 299 บาท",
    href: "/products",
    bg: "from-blue-500 to-purple-500",
    emoji: "🚚",
  },
  {
    title: "New Arrivals",
    subtitle: "สินค้ามาใหม่",
    desc: "อัพเดทสินค้าใหม่ทุกวัน",
    href: "/products?sort=newest",
    bg: "from-green-500 to-teal-500",
    emoji: "✨",
  },
];

export default function PromoBanner() {
  return (
    <section className="py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {promos.map((promo) => (
          <Link
            key={promo.title}
            href={promo.href}
            className={`bg-gradient-to-r ${promo.bg} rounded-xl p-5 text-white flex items-center justify-between hover:shadow-lg transition-all hover:-translate-y-0.5`}
          >
            <div>
              <div className="text-xs font-medium opacity-80 mb-0.5">{promo.title}</div>
              <div className="text-xl font-bold mb-1">{promo.subtitle}</div>
              <div className="text-xs opacity-80">{promo.desc}</div>
            </div>
            <div className="text-5xl opacity-30">{promo.emoji}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
