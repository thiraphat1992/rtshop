"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, ShoppingBag, Package, Wallet,
  Star, ChevronRight, Truck, Clock, CheckCircle,
  BarChart3, ArrowUpRight, Store, AlertCircle,
} from "lucide-react";
import SellerTopbar from "@/components/seller/SellerTopbar";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Stats {
  totalOrders: number;
  monthOrders: number;
  lastMonthOrders: number;
  pendingOrders: number;
  totalProducts: number;
  activeProducts: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  dailySales: { date: string; total: number }[];
}

const orderStatusCfg: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PAID:       { label: "ชำระแล้ว",    color: "text-blue-600 bg-blue-50",    icon: CheckCircle },
  PROCESSING: { label: "กำลังเตรียม", color: "text-purple-600 bg-purple-50", icon: Clock },
  SHIPPED:    { label: "จัดส่งแล้ว",  color: "text-orange-600 bg-orange-50", icon: Truck },
};

const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/seller/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const revenueChange = stats
    ? stats.revenueLastMonth > 0
      ? (((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100).toFixed(1)
      : null
    : null;

  const salesData = stats?.dailySales ?? [];
  const maxSales = Math.max(...salesData.map((d) => d.total), 1);

  if (fetching || authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SellerTopbar title="แดชบอร์ด" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SellerTopbar title="แดชบอร์ด" />

      <div className="flex-1 p-6 space-y-6">
        {/* Pending orders alert */}
        {stats && stats.pendingOrders > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            มีออเดอร์ใหม่ <strong>{stats.pendingOrders}</strong> รายการรอการจัดส่ง
            <Link href="/seller/orders" className="ml-auto text-amber-700 underline text-xs">ดูออเดอร์</Link>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "รายได้เดือนนี้",
              value: formatPrice(stats?.revenueThisMonth ?? 0),
              change: revenueChange ? `${Number(revenueChange) >= 0 ? "+" : ""}${revenueChange}%` : "เดือนแรก",
              positive: !revenueChange || Number(revenueChange) >= 0,
              icon: Wallet,
              color: "bg-orange-50 text-orange-500",
            },
            {
              label: "ออเดอร์เดือนนี้",
              value: String(stats?.monthOrders ?? 0),
              change: `${stats?.pendingOrders ?? 0} รอจัดส่ง`,
              positive: true,
              icon: ShoppingBag,
              color: "bg-blue-50 text-blue-500",
            },
            {
              label: "สินค้าทั้งหมด",
              value: String(stats?.totalProducts ?? 0),
              change: `${stats?.activeProducts ?? 0} กำลังขาย`,
              positive: true,
              icon: Package,
              color: "bg-purple-50 text-purple-500",
            },
            {
              label: "ออเดอร์รวม",
              value: String(stats?.totalOrders ?? 0),
              change: "ตลอดเวลา",
              positive: true,
              icon: Star,
              color: "bg-yellow-50 text-yellow-500",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-xs font-medium flex items-center gap-0.5",
                  stat.positive ? "text-green-600" : "text-red-500"
                )}>
                  {stat.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-gray-800">ยอดขาย 7 วันล่าสุด</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  รายได้รวม <span className="font-semibold text-orange-500">
                    {formatPrice(salesData.reduce((s, d) => s + d.total, 0))}
                  </span>
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-gray-300" />
            </div>
            {salesData.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                ยังไม่มีข้อมูลยอดขาย
              </div>
            ) : (
              <div className="flex items-end justify-between gap-2 h-32">
                {salesData.map((d, idx) => {
                  const pct = (d.total / maxSales) * 100;
                  const date = new Date(d.date);
                  const dayLabel = DAYS_TH[date.getDay()];
                  const isToday = idx === salesData.length - 1;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">{d.total > 0 ? formatNumber(d.total) : ""}</span>
                      <div
                        className={cn("w-full rounded-t-lg transition-all", isToday ? "bg-orange-500" : "bg-orange-100")}
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                      <span className="text-xs text-gray-500">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">สรุปออเดอร์</h3>
            {!stats || stats.totalOrders === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">ยังไม่มีออเดอร์</div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "รอจัดส่ง",    count: stats.pendingOrders,                              color: "bg-orange-500" },
                  { label: "เดือนนี้",     count: stats.monthOrders,                               color: "bg-blue-500" },
                  { label: "ทั้งหมด",      count: stats.totalOrders,                               color: "bg-green-500" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">{s.label}</span>
                      <span className="font-semibold text-gray-800">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", s.color)}
                        style={{ width: `${Math.min((s.count / stats.totalOrders) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/seller/orders" className="mt-5 flex items-center justify-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
              ดูออเดอร์ทั้งหมด <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/seller/products/new", icon: Package, label: "เพิ่มสินค้า",   color: "bg-orange-500 hover:bg-orange-600" },
            { href: "/seller/orders",       icon: Truck,   label: "จัดการออเดอร์", color: "bg-blue-500 hover:bg-blue-600" },
            { href: "/seller/finance",      icon: Wallet,  label: "การเงิน",        color: "bg-green-500 hover:bg-green-600" },
            { href: "/seller/settings",     icon: Store,   label: "ตั้งค่าร้าน",    color: "bg-purple-500 hover:bg-purple-600" },
          ].map((action) => (
            <Link key={action.href} href={action.href}
              className={cn("flex flex-col items-center gap-2 p-4 rounded-xl text-white transition-colors text-sm font-medium", action.color)}
            >
              <action.icon className="h-6 w-6" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
