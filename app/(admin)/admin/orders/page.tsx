"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronLeft, ChevronRight as ChevronRightIcon, Download,
} from "lucide-react";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface Order {
  id:            string;
  customer:      string;
  shopName:      string;
  itemCount:     number;
  total:         number;
  paymentMethod: string;
  status:        OrderStatus;
  createdAt:     string;
}

const statusCfg: Record<OrderStatus, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "รอชำระ",     color: "bg-yellow-50 text-yellow-700" },
  PAID:            { label: "รอเตรียม",   color: "bg-blue-50 text-blue-700"    },
  PROCESSING:      { label: "เตรียมของ",  color: "bg-purple-50 text-purple-700" },
  SHIPPED:         { label: "จัดส่งแล้ว", color: "bg-orange-50 text-orange-700" },
  DELIVERED:       { label: "สำเร็จ",     color: "bg-green-50 text-green-700"  },
  CANCELLED:       { label: "ยกเลิก",     color: "bg-red-50 text-red-700"      },
};

const paymentLabel: Record<string, string> = {
  promptpay:   "พร้อมเพย์",
  credit_card: "บัตรเครดิต",
  cod:         "เก็บปลายทาง",
};

export default function AdminOrdersPage() {
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [total,        setTotal]        = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [page,         setPage]         = useState(1);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)               params.set("q",      search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("page",  String(page));
    params.set("limit", "10");

    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        if (data.totalRevenue !== undefined) setTotalRevenue(data.totalRevenue);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [search, statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const processing = orders.filter((o) => ["PAID", "PROCESSING"].includes(o.status)).length;
  const delivered  = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="จัดการคำสั่งซื้อ" />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "ออเดอร์ทั้งหมด", value: total,                     color: "text-gray-800"   },
            { label: "รอดำเนินการ",    value: processing,                 color: "text-blue-600"   },
            { label: "สำเร็จ",          value: delivered,                  color: "text-green-600"  },
            { label: "รายได้รวม",      value: formatPrice(totalRevenue),  color: "text-orange-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
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
              placeholder="ค้นหาเลขออเดอร์, ลูกค้า..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
          >
            <option value="all">ทุกสถานะ</option>
            {(Object.keys(statusCfg) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>{statusCfg[s].label}</option>
            ))}
          </select>
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
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">เลขออเดอร์</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">ลูกค้า / ร้านค้า</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 hidden lg:table-cell">ชำระเงิน</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 hidden lg:table-cell">สินค้า</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">ยอดรวม</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">สถานะ</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 hidden md:table-cell">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-mono font-semibold text-gray-800">#{order.id}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-gray-800">{order.customer}</p>
                      <p className="text-xs text-gray-400">{order.shopName}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        order.paymentMethod === "cod"
                          ? "bg-orange-50 text-orange-700"
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {paymentLabel[order.paymentMethod] ?? order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm text-gray-500 hidden lg:table-cell">
                      {order.itemCount} ชิ้น
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-bold text-gray-800">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", statusCfg[order.status]?.color ?? "bg-gray-100 text-gray-600")}>
                        {statusCfg[order.status]?.label ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs text-gray-400 hidden md:table-cell">
                      {order.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && orders.length === 0 && (
            <div className="py-12 text-center text-gray-400">ไม่พบคำสั่งซื้อ</div>
          )}

          {/* Pagination */}
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
    </div>
  );
}
