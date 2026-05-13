"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Printer, ChevronRight, Truck,
  Clock, CheckCircle, XCircle, Package, RefreshCw, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SellerTopbar from "@/components/seller/SellerTopbar";
import { formatPrice, formatOrderNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { key: "all",        label: "ทั้งหมด"     },
  { key: "PAID",       label: "รอเตรียมของ" },
  { key: "PROCESSING", label: "กำลังเตรียม" },
  { key: "SHIPPED",    label: "จัดส่งแล้ว"  },
  { key: "DELIVERED",  label: "สำเร็จ"      },
  { key: "CANCELLED",  label: "ยกเลิก"      },
];

const statusCfg: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING_PAYMENT: { label: "รอชำระ",      color: "text-yellow-700 bg-yellow-50",  icon: Clock       },
  PAID:            { label: "รอเตรียมของ", color: "text-blue-700 bg-blue-50",      icon: Package     },
  PROCESSING:      { label: "กำลังเตรียม", color: "text-purple-700 bg-purple-50",  icon: RefreshCw   },
  SHIPPED:         { label: "จัดส่งแล้ว",  color: "text-orange-700 bg-orange-50",  icon: Truck       },
  DELIVERED:       { label: "สำเร็จ",      color: "text-green-700 bg-green-50",    icon: CheckCircle },
  CANCELLED:       { label: "ยกเลิก",      color: "text-red-700 bg-red-50",        icon: XCircle     },
};

const SHIPPING_LABELS: Record<string, string> = {
  standard: "จัดส่งปกติ (Kerry)",
  express:  "จัดส่งด่วน (Flash)",
  free:     "ไปรษณีย์ไทย (ฟรี)",
};

const PAYMENT_LABELS: Record<string, string> = {
  promptpay:    "พร้อมเพย์ (QR)",
  credit_card:  "บัตรเครดิต",
  bank_transfer:"โอนเงินธนาคาร",
  cod:          "เก็บเงินปลายทาง",
};

const CARRIERS = ["Flash Express", "Kerry Express", "J&T Express", "ไปรษณีย์ไทย", "DHL", "Grab Express", "Ninja Van"];

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; images: { url: string }[] };
}

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  total: number;
  carrier: string | null;
  trackingNumber: string | null;
  shippingMethod: string | null;
  paymentMethod: string | null;
  createdAt: string;
  user: { name: string; email: string; phone: string | null };
  address: {
    recipientName: string;
    phone: string;
    addressLine: string;
    district: string;
    province: string;
  };
  items: OrderItem[];
}

interface ShipModal {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  isCod: boolean;
}

export default function SellerOrdersPage() {
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("all");
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [counts,      setCounts]      = useState<Record<string, number>>({});
  const [shipModal,   setShipModal]   = useState<ShipModal | null>(null);
  const [saving,      setSaving]      = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("status", activeTab);
    if (search) params.set("q", search);
    params.set("limit", "50");

    fetch(`/api/seller/orders?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [activeTab, search]);

  useEffect(() => {
    Promise.all(
      STATUS_TABS.filter((t) => t.key !== "all").map((t) =>
        fetch(`/api/seller/orders?status=${t.key}&limit=1`)
          .then((r) => r.json())
          .then((d) => ({ key: t.key, count: d.total ?? 0 }))
          .catch(() => ({ key: t.key, count: 0 }))
      )
    ).then((results) => {
      const map: Record<string, number> = {};
      results.forEach((r) => { map[r.key] = r.count; });
      setCounts(map);
    });
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const toggleSelect = (id: string) =>
    setSelectedOrders((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedOrders(selectedOrders.length === orders.length ? [] : orders.map((o) => o.id));

  const openShipModal = (order: Order) => {
    setShipModal({
      orderId: order.id,
      carrier: order.carrier ?? "",
      trackingNumber: order.trackingNumber ?? "",
      isCod: order.paymentMethod === "cod",
    });
  };

  const handleConfirmShip = async () => {
    if (!shipModal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/seller/orders/${shipModal.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SHIPPED",
          ...(shipModal.carrier ? { carrier: shipModal.carrier } : {}),
          ...(shipModal.trackingNumber ? { trackingNumber: shipModal.trackingNumber } : {}),
          ...(shipModal.isCod ? { paymentVerified: true } : {}),
        }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === shipModal.orderId
              ? { ...o, status: "SHIPPED", carrier: shipModal.carrier, trackingNumber: shipModal.trackingNumber }
              : o
          )
        );
        setShipModal(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const totalAll = Object.values(counts).reduce((s, v) => s + v, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <SellerTopbar title="จัดการออเดอร์" />

      {/* Ship modal */}
      {shipModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-500" />
                <h2 className="font-bold text-gray-800">ยืนยันการจัดส่ง</h2>
              </div>
              <button onClick={() => setShipModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {shipModal.isCod && (
                <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                  <Truck className="h-4 w-4 flex-shrink-0" />
                  ออเดอร์เก็บเงินปลายทาง — ลูกค้าจะชำระเมื่อได้รับสินค้า
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">บริษัทขนส่ง</label>
                <select
                  value={shipModal.carrier}
                  onChange={(e) => setShipModal((m) => m ? { ...m, carrier: e.target.value } : m)}
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                >
                  <option value="">เลือกขนส่ง</option>
                  {CARRIERS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">เลข Tracking</label>
                <Input
                  value={shipModal.trackingNumber}
                  onChange={(e) => setShipModal((m) => m ? { ...m, trackingNumber: e.target.value } : m)}
                  placeholder="กรอกเลข Tracking Number..."
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <Button
                className="flex-1 gap-2"
                onClick={handleConfirmShip}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                ยืนยันจัดส่ง
              </Button>
              <Button variant="outline" onClick={() => setShipModal(null)}>ยกเลิก</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-6 space-y-4">
        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-white rounded-xl p-1.5 shadow-sm">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === "all" ? totalAll : (counts[tab.key] ?? 0);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  activeTab === tab.key ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {tab.label}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + bulk actions */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput); }}
              placeholder="ค้นหาเลขออเดอร์หรือชื่อลูกค้า..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
            />
          </div>
          {selectedOrders.length > 0 && (
            <Button size="sm" variant="outline" className="text-xs gap-1.5">
              <Printer className="h-3.5 w-3.5" /> พิมพ์ใบปะหน้า ({selectedOrders.length})
            </Button>
          )}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl shadow-sm">
            <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">ไม่มีออเดอร์</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
              <input
                type="checkbox"
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onChange={toggleAll}
                className="rounded accent-orange-500"
              />
              <span className="text-sm text-gray-500">เลือกทั้งหมด {orders.length} ออเดอร์</span>
            </div>

            {orders.map((order) => {
              const cfg = statusCfg[order.status] ?? statusCfg["PAID"];
              const StatusIcon = cfg.icon;
              const isCod = order.paymentMethod === "cod";
              const canShip = order.status === "PAID" || order.status === "PROCESSING" ||
                              (isCod && order.status === "PENDING_PAYMENT");
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="rounded accent-orange-500"
                    />
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">#{formatOrderNumber(order.orderNumber, order.id)}</span>
                      <span className={cn("flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full", cfg.color)}>
                        <StatusIcon className="h-3 w-3" /> {cfg.label}
                      </span>
                      {order.shippingMethod && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          🚚 {SHIPPING_LABELS[order.shippingMethod] ?? order.shippingMethod}
                        </span>
                      )}
                      {order.paymentMethod && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          isCod ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
                        )}>
                          💳 {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                    <Link href={`/seller/orders/${order.id}`} className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5 flex-shrink-0">
                      ดูรายละเอียด <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="p-5 flex flex-col md:flex-row gap-5">
                    {/* Items */}
                    <div className="flex-1 space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                            {item.product.images[0] ? (
                              <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" sizes="56px" />
                            ) : (
                              <Package className="h-6 w-6 text-gray-300 m-auto mt-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-gray-400">x{item.quantity} · {formatPrice(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Customer + tracking */}
                    <div className="md:w-60 space-y-1.5 text-sm">
                      <p className="font-medium text-gray-700">👤 {order.address.recipientName}</p>
                      <p className="text-gray-500 text-xs">📞 {order.address.phone}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        📍 {order.address.addressLine} {order.address.district} {order.address.province}
                      </p>
                      {order.trackingNumber && (
                        <div className="bg-blue-50 rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-500">{order.carrier}</p>
                          <p className="text-xs font-mono text-blue-700 font-semibold">{order.trackingNumber}</p>
                        </div>
                      )}
                    </div>

                    {/* Total + actions */}
                    <div className="md:w-40 flex flex-col justify-between">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">ยอดรวม</p>
                        <p className="text-lg font-bold text-orange-500">{formatPrice(order.total)}</p>
                      </div>
                      <div className="flex flex-col gap-2 mt-3">
                        {canShip && (
                          <Button size="sm" className="text-xs w-full gap-1.5" onClick={() => openShipModal(order)}>
                            <Truck className="h-3.5 w-3.5" /> ยืนยันจัดส่ง
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-xs w-full gap-1.5" asChild>
                          <Link href={`/seller/orders/${order.id}?print=true`}>
                            <Printer className="h-3.5 w-3.5" /> ใบปะหน้า
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
