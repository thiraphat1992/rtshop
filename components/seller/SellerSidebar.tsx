"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, Wallet, Settings,
  Store, ChevronRight, LogOut, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

async function doLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
}

const navItems = [
  { href: "/seller/dashboard", icon: LayoutDashboard, label: "แดชบอร์ด" },
  { href: "/seller/products",  icon: Package,         label: "จัดการสินค้า" },
  { href: "/seller/orders",    icon: ShoppingBag,     label: "คำสั่งซื้อ" },
  { href: "/seller/chat",      icon: MessageCircle,   label: "แชท" },
  { href: "/seller/finance",   icon: Wallet,          label: "การเงิน" },
  { href: "/seller/settings",  icon: Settings,        label: "ตั้งค่าร้าน" },
];

interface SellerSidebarProps {
  shopName?: string;
  shopLogo?: string | null;
}

export default function SellerSidebar({ shopName = "ร้านค้าของฉัน", shopLogo }: SellerSidebarProps) {
  const pathname = usePathname();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);

  useEffect(() => {
    fetch("/api/seller/orders?status=PAID&limit=1")
      .then((r) => r.json())
      .then((d) => setPendingOrders(d.total ?? 0))
      .catch(() => {});

    fetch("/api/chat/unread")
      .then((r) => r.json())
      .then((d) => setUnreadChat(d.count ?? 0))
      .catch(() => {});
  }, []);

  const getBadge = (href: string) => {
    if (href === "/seller/orders") return pendingOrders > 0 ? pendingOrders : 0;
    if (href === "/seller/chat")   return unreadChat   > 0 ? unreadChat   : 0;
    return 0;
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      {/* Shop branding */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {shopLogo ? (
              <img src={shopLogo} alt={shopName} className="w-full h-full object-cover" />
            ) : (
              <Store className="h-5 w-5 text-orange-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{shopName}</p>
            <p className="text-xs text-green-500 font-medium">● ออนไลน์</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">เมนูหลัก</p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const badge = getBadge(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-orange-500" : "text-gray-400")} />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                  {active && <ChevronRight className="h-3.5 w-3.5 text-orange-400" />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">อื่นๆ</p>
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <Store className="h-5 w-5 text-gray-400" />
            <span>ไปที่หน้าร้าน</span>
          </Link>
          <button onClick={doLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50">
            <LogOut className="h-5 w-5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </nav>

      {/* Bottom RTShop branding */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">RT</span>
          </div>
          <span className="text-xs text-gray-400">RTShop Seller Center</span>
        </div>
      </div>
    </aside>
  );
}
