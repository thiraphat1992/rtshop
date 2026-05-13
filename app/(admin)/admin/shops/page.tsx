"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Store, CheckCircle, XCircle, Eye,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  AlertTriangle, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

type ShopStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

interface Shop {
  id:        string;
  name:      string;
  status:    ShopStatus;
  rating:    number;
  totalSales: number;
  createdAt: string;
  user:      { name: string; email: string | null };
  _count:    { products: number };
  bankName:  string | null;
  bankAccount: string | null;
}

const statusCfg: Record<ShopStatus, { label: string; color: string }> = {
  PENDING:   { label: "รอตรวจสอบ", color: "bg-amber-50 text-amber-700" },
  ACTIVE:    { label: "เปิดใช้งาน", color: "bg-green-50 text-green-700" },
  SUSPENDED: { label: "ระงับ",      color: "bg-red-50 text-red-700" },
};

export default function AdminShopsPage() {
  const [shops,       setShops]       = useState<Shop[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ShopStatus>("all");
  const [page,        setPage]        = useState(1);
  const [detailShop,  setDetailShop]  = useState<Shop | null>(null);

  const fetchShops = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)                      params.set("q",      search);
    if (statusFilter !== "all")      params.set("status", statusFilter);
    params.set("page",  String(page));
    params.set("limit", "20");

    fetch(`/api/admin/shops?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setShops(data.shops ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, [search, statusFilter, page]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const updateStatus = async (id: string, status: ShopStatus) => {
    const res = await fetch(`/api/admin/shops/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setShops((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
      if (detailShop?.id === id) setDetailShop((d) => d ? { ...d, status } : d);
    }
  };

  const pending  = shops.filter((s) => s.status === "PENDING").length;
  const active   = shops.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="จัดการร้านค้า" />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "ร้านทั้งหมด",  value: total,   color: "text-gray-800" },
            { label: "รอตรวจสอบ",    value: pending, color: "text-amber-600" },
            { label: "เปิดใช้งาน",   value: active,  color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
              placeholder="ค้นหาชื่อร้าน หรือ ผู้ขาย..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "PENDING", "ACTIVE", "SUSPENDED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg font-medium border transition-colors",
                  statusFilter === s ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:border-orange-300"
                )}
              >
                {s === "all" ? "ทั้งหมด" : statusCfg[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">ร้านค้า</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 hidden md:table-cell">สินค้า</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 hidden lg:table-cell">ยอดขายรวม</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 hidden md:table-cell">เรตติ้ง</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">สถานะ</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shops.map((shop) => (
                  <tr key={shop.id} className={cn(
                    "hover:bg-gray-50/50 transition-colors",
                    shop.status === "PENDING" && "bg-amber-50/30"
                  )}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800">{shop.name}</p>
                            {shop.status === "PENDING" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                          </div>
                          <p className="text-xs text-gray-400">
                            {shop.user.name} · {new Date(shop.createdAt).toLocaleDateString("th-TH")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm text-gray-600 hidden md:table-cell">
                      {shop._count.products}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-700 hidden lg:table-cell">
                      {formatPrice(shop.totalSales)}
                    </td>
                    <td className="px-5 py-3.5 text-center hidden md:table-cell">
                      <span className="flex items-center justify-center gap-1 text-sm text-amber-500 font-medium">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />{shop.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", statusCfg[shop.status].color)}>
                        {statusCfg[shop.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {shop.status === "PENDING" && (
                          <>
                            <button onClick={() => updateStatus(shop.id, "ACTIVE")} title="อนุมัติ"
                              className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button onClick={() => updateStatus(shop.id, "SUSPENDED")} title="ปฏิเสธ"
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {shop.status === "ACTIVE" && (
                          <button onClick={() => updateStatus(shop.id, "SUSPENDED")} title="ระงับ"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {shop.status === "SUSPENDED" && (
                          <button onClick={() => updateStatus(shop.id, "ACTIVE")} title="ปลดระงับ"
                            className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => setDetailShop(shop)} title="ดูรายละเอียด"
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && shops.length === 0 && (
            <div className="py-12 text-center text-gray-400">ไม่พบร้านค้า</div>
          )}

          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">ทั้งหมด {total} รายการ · หน้า {page}/{totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn("w-8 h-8 text-xs rounded-lg transition-colors",
                    p === page ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100")}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detailShop && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailShop(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500">
                <Store className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{detailShop.name}</h3>
                <p className="text-sm text-gray-500">{detailShop.user.name}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: "อีเมล",      value: detailShop.user.email ?? "–" },
                { label: "ธนาคาร",    value: detailShop.bankName ?? "ยังไม่ตั้งค่า" },
                { label: "เลขบัญชี",  value: detailShop.bankAccount ?? "–" },
                { label: "สินค้า",    value: `${detailShop._count.products} รายการ` },
                { label: "ยอดขายรวม", value: formatPrice(detailShop.totalSales) },
                { label: "สมัครเมื่อ", value: new Date(detailShop.createdAt).toLocaleDateString("th-TH") },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              {detailShop.status === "PENDING" && (
                <Button className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={() => { updateStatus(detailShop.id, "ACTIVE"); setDetailShop(null); }}>
                  <CheckCircle className="h-4 w-4 mr-2" /> อนุมัติร้านค้า
                </Button>
              )}
              {detailShop.status !== "SUSPENDED" && (
                <Button variant="destructive" className="flex-1"
                  onClick={() => { updateStatus(detailShop.id, "SUSPENDED"); setDetailShop(null); }}>
                  <XCircle className="h-4 w-4 mr-2" /> ระงับ
                </Button>
              )}
              <Button variant="outline" onClick={() => setDetailShop(null)}>ปิด</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
