"use client";

import React, { useEffect, useState } from "react";
import {
  Users, Store, ShoppingBag, DollarSign, TrendingUp,
  TrendingDown, ChevronRight, ArrowUpRight, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  totalShops: number;
  pendingShops: number;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  totalProducts: number;
  statusCounts: { status: string; count: number }[];
  dailySales: { date: string; total: number }[];
}

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: "รอชำระ",
  PAID:            "รอเตรียม",
  PROCESSING:      "เตรียมของ",
  SHIPPED:         "จัดส่งแล้ว",
  DELIVERED:       "สำเร็จ",
  CANCELLED:       "ยกเลิก",
};
const statusColor: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700",
  PAID:            "bg-blue-100 text-blue-700",
  PROCESSING:      "bg-purple-100 text-purple-700",
  SHIPPED:         "bg-orange-100 text-orange-700",
  DELIVERED:       "bg-green-100 text-green-700",
  CANCELLED:       "bg-red-100 text-red-700",
};

const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingShopsList, setPendingShopsList] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/shops?status=PENDING&limit=5").then((r) => r.json()),
    ])
      .then(([statsData, shopsData]) => {
        setStats(statsData);
        setPendingShopsList(shopsData.shops ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approveShop = async (id: string) => {
    await fetch(`/api/admin/shops/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    setPendingShopsList((prev) => prev.filter((s) => s.id !== id));
    setStats((s) => s ? { ...s, pendingShops: s.pendingShops - 1 } : s);
  };

  const rejectShop = async (id: string) => {
    await fetch(`/api/admin/shops/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SUSPENDED" }),
    });
    setPendingShopsList((prev) => prev.filter((s) => s.id !== id));
    setStats((s) => s ? { ...s, pendingShops: s.pendingShops - 1 } : s);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminTopbar title="แดชบอร์ด" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxSales = Math.max(...stats.dailySales.map((d) => d.total), 1);

  const statsCards = [
    {
      label: "รายได้รวม",       value: formatPrice(stats.totalRevenue),
      change: `+${formatPrice(stats.monthRevenue)} เดือนนี้`, positive: true,
      icon: DollarSign, color: "bg-green-500", href: "/admin/orders",
    },
    {
      label: "ออเดอร์ทั้งหมด",  value: stats.totalOrders.toLocaleString(),
      change: `+${stats.todayOrders} วันนี้`, positive: true,
      icon: ShoppingBag, color: "bg-blue-500", href: "/admin/orders",
    },
    {
      label: "ผู้ใช้ทั้งหมด",   value: stats.totalUsers.toLocaleString(),
      change: `+${stats.newUsersToday} วันนี้`, positive: true,
      icon: Users, color: "bg-purple-500", href: "/admin/users",
    },
    {
      label: "ร้านค้ารอตรวจสอบ", value: String(stats.pendingShops),
      change: `${stats.totalShops} ร้านทั้งหมด`, positive: true,
      icon: Store, color: "bg-orange-500", href: "/admin/shops",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="แดชบอร์ด" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-2.5 rounded-xl text-white", card.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                <p className={cn("text-xs mt-1 flex items-center gap-1", card.positive ? "text-green-600" : "text-red-500")}>
                  {card.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {card.change}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Sales chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-800">ยอดขาย 7 วันล่าสุด</h3>
            </div>
            {stats.dailySales.every((d) => d.total === 0) ? (
              <div className="h-44 flex items-center justify-center text-gray-300 text-sm">ยังไม่มียอดขาย</div>
            ) : (
              <div className="flex items-end gap-3 h-44">
                {stats.dailySales.map((d) => {
                  const date = new Date(d.date);
                  const pct = (d.total / maxSales) * 100;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">{d.total > 0 ? `${(d.total / 1000).toFixed(0)}k` : ""}</span>
                      <div className="w-full rounded-t-lg overflow-hidden relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500 to-orange-400" />
                      </div>
                      <span className="text-[10px] text-gray-500">{DAYS_TH[date.getDay()]}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
              <span className="text-gray-500">รวม 7 วัน</span>
              <span className="font-bold text-orange-500">
                {formatPrice(stats.dailySales.reduce((s, d) => s + d.total, 0))}
              </span>
            </div>
          </div>

          {/* Order status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">สถานะออเดอร์</h3>
              <Link href="/admin/orders" className="text-xs text-orange-500 flex items-center gap-0.5 hover:text-orange-600">
                ดูทั้งหมด <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {stats.statusCounts.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium",
                    statusColor[item.status] ?? "bg-gray-100 text-gray-600")}>
                    {statusLabel[item.status] ?? item.status}
                  </span>
                  <span className="text-sm font-bold text-gray-700">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 text-sm flex items-center justify-between text-gray-500">
              <span>ออเดอร์ทั้งหมด</span>
              <span className="font-bold text-gray-800">{stats.totalOrders.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Pending shops */}
        {pendingShopsList.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                ร้านค้ารอตรวจสอบ ({pendingShopsList.length})
              </h3>
              <Link href="/admin/shops" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5">
                ดูทั้งหมด <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingShopsList.map((shop) => (
                <div key={shop.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{shop.name}</p>
                    <p className="text-xs text-gray-400">
                      {shop.user?.name} · {shop._count?.products ?? 0} สินค้า ·{" "}
                      {new Date(shop.createdAt).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => approveShop(shop.id)}
                      className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 font-medium"
                    >
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => rejectShop(shop.id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 font-medium"
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
