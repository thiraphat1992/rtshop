"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SellerSidebar from "@/components/seller/SellerSidebar";
import { cn } from "@/lib/utils";

interface ShopInfo {
  name: string;
  logo: string | null;
  status: string;
}

export default function SellerCenterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/seller/shop")
      .then((r) => r.json())
      .then((data) => setShop(data.shop ?? null))
      .catch(() => {});
  }, []);

  // Register page: no sidebar
  if (pathname === "/seller/register") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 transition-transform lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SellerSidebar shopName={shop?.name ?? "ร้านค้าของฉัน"} shopLogo={shop?.logo} />
      </div>

      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
