"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Store, Package, ShoppingBag,
  Tag, Image as ImageIcon, Settings, ChevronRight, LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

async function doLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
}

const navGroups = [
  {
    label: "ภาพรวม",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "แดชบอร์ด" },
    ],
  },
  {
    label: "จัดการระบบ",
    items: [
      { href: "/admin/users",      icon: Users,       label: "ผู้ใช้งาน" },
      { href: "/admin/shops",      icon: Store,       label: "ร้านค้า" },
      { href: "/admin/products",   icon: Package,     label: "สินค้า" },
      { href: "/admin/orders",     icon: ShoppingBag, label: "คำสั่งซื้อ" },
    ],
  },
  {
    label: "เนื้อหา",
    items: [
      { href: "/admin/categories", icon: Tag,         label: "หมวดหมู่" },
      { href: "/admin/banners",    icon: ImageIcon,   label: "แบนเนอร์" },
    ],
  },
  {
    label: "ตั้งค่า",
    items: [
      { href: "/admin/settings",   icon: Settings,    label: "ชำระเงิน & ขนส่ง" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-gray-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">RTShop Admin</p>
            <p className="text-[11px] text-gray-400">Control Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "bg-orange-500 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800">
        <button onClick={doLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors">
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
