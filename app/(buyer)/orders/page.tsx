"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Truck, CheckCircle, XCircle, Clock, Star, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatOrderNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const carrierTrackingUrls: Record<string, string> = {
  "Flash Express":    "https://www.flashexpress.co.th/tracking/?se=",
  "Kerry Express":    "https://th.kerryexpress.com/th/track/?track=",
  "ไปรษณีย์ไทย":      "https://track.thailandpost.co.th/?trackNumber=",
  "J&T Express":      "https://www.jtexpress.co.th/index/query/gzquery.html?bills=",
  "Ninja Van":        "https://www.ninjavan.co/th-th/tracking?id=",
  "DHL":              "https://www.dhl.com/th-en/home/tracking.html?tracking-id=",
  "Best Express":     "https://www.best-inc.co.th/track?",
  "SCG Express":      "https://scgexpress.co.th/tracking?barcode=",
  "Lalamove":         "https://www.lalamove.com/",
};

function getTrackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
  if (!carrier || !trackingNumber) return null;
  const base = carrierTrackingUrls[carrier];
  if (!base) return null;
  return base + encodeURIComponent(trackingNumber);
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING_PAYMENT: { label: "รอชำระเงิน",     icon: Clock,        color: "bg-yellow-100 text-yellow-700" },
  PAID:            { label: "ชำระเงินแล้ว",    icon: CheckCircle,  color: "bg-blue-100 text-blue-700" },
  PROCESSING:      { label: "กำลังเตรียมสินค้า", icon: Package,     color: "bg-purple-100 text-purple-700" },
  SHIPPED:         { label: "กำลังจัดส่ง",     icon: Truck,        color: "bg-orange-100 text-orange-700" },
  DELIVERED:       { label: "ได้รับสินค้าแล้ว", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  CANCELLED:       { label: "ยกเลิกแล้ว",      icon: XCircle,      color: "bg-red-100 text-red-700" },
  REFUNDED:        { label: "คืนเงินแล้ว",      icon: XCircle,      color: "bg-gray-100 text-gray-600" },
};

const tabs = [
  { key: "all",             label: "ทั้งหมด" },
  { key: "PENDING_PAYMENT", label: "รอชำระ" },
  { key: "SHIPPED",         label: "กำลังจัดส่ง" },
  { key: "DELIVERED",       label: "ได้รับแล้ว" },
  { key: "CANCELLED",       label: "ยกเลิก" },
];

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: { url: string }[];
  };
}

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  paymentMethod: string | null;
  slipUrl: string | null;
  total: number;
  createdAt: string;
  trackingNumber: string | null;
  carrier: string | null;
  items: OrderItem[];
}

/* ── Confirm receipt + review modal ── */
function ConfirmReceiptModal({
  order,
  onDone,
  onClose,
}: {
  order: Order;
  onDone: (orderId: string) => void;
  onClose: () => void;
}) {
  const items = order.items.map((i) => ({
    id: i.product.id,
    name: i.product.name,
    image: i.product.images[0]?.url ?? "https://picsum.photos/seed/default/80/80",
  }));

  const [ratings, setRatings] = useState<Record<string, number>>(
    () => Object.fromEntries(items.map((i) => [i.id, 5]))
  );
  const [comments, setComments] = useState<Record<string, string>>(
    () => Object.fromEntries(items.map((i) => [i.id, ""]))
  );
  const [hover, setHover] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_receipt" }),
      });
      if (!res.ok) { alert("เกิดข้อผิดพลาด"); return; }

      await Promise.all(
        items.map((i) =>
          fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: i.id,
              rating: ratings[i.id] ?? 5,
              comment: comments[i.id] ?? "",
            }),
          })
        )
      );

      onDone(order.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">ยืนยันรับสินค้า</h3>
          <p className="text-sm text-gray-500 mt-1">รีวิวสินค้าที่คุณได้รับ (ไม่บังคับ)</p>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                <p className="text-sm font-medium text-gray-800 line-clamp-2 flex-1">{item.name}</p>
              </div>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onMouseEnter={() => setHover((h) => ({ ...h, [item.id]: s }))}
                    onMouseLeave={() => setHover((h) => ({ ...h, [item.id]: 0 }))}
                    onClick={() => setRatings((r) => ({ ...r, [item.id]: s }))}
                  >
                    <Star className={cn(
                      "h-7 w-7 transition-colors",
                      s <= ((hover[item.id] ?? 0) || (ratings[item.id] ?? 5))
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-100 text-gray-200"
                    )} />
                  </button>
                ))}
              </div>
              <textarea
                value={comments[item.id] ?? ""}
                onChange={(e) => setComments((c) => ({ ...c, [item.id]: e.target.value }))}
                placeholder="แชร์ประสบการณ์ (ไม่บังคับ)"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-orange-500"
              />
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-2">
          <Button onClick={handleConfirm} className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={submitting}>
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังบันทึก...</>
              : <><CheckCircle className="h-4 w-4 mr-2" />ยืนยันรับสินค้า</>
            }
          </Button>
          <Button variant="outline" onClick={onClose} disabled={submitting}>ยกเลิก</Button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/orders");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    fetch(`/api/orders?status=${activeTab}`)
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setFetching(false));
  }, [user, activeTab]);

  const handleConfirmDone = (orderId: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "DELIVERED" } : o));
    setConfirmOrder(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {confirmOrder && (
        <ConfirmReceiptModal
          order={confirmOrder}
          onDone={handleConfirmDone}
          onClose={() => setConfirmOrder(null)}
        />
      )}

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-xl font-bold text-gray-800 mb-4">คำสั่งซื้อของฉัน</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.key ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {fetching ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm h-40 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Package className="h-16 w-16 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">ไม่พบคำสั่งซื้อ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] ?? statusConfig["PENDING_PAYMENT"];
              const StatusIcon = status.icon;

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Order header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">#{formatOrderNumber(order.orderNumber, order.id)}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                    <span className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", status.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="p-5">
                    {order.items.map((item) => {
                      const img = item.product.images[0]?.url ?? "https://picsum.photos/seed/default/100/100";
                      return (
                        <div key={item.id} className="flex items-center gap-4 mb-3 last:mb-0">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                            <Image src={img} alt={item.product.name} fill className="object-cover" sizes="64px" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">x{item.quantity}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {formatPrice(Number(item.price) * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tracking */}
                  {order.trackingNumber && (
                    <div className="mx-5 mb-4 bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-3">
                      <Truck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">{order.carrier}</p>
                        <p className="text-xs text-blue-600 font-mono">{order.trackingNumber}</p>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50 bg-gray-50/50">
                    <div>
                      <span className="text-xs text-gray-500">ยอดรวม </span>
                      <span className="font-bold text-orange-500">{formatPrice(Number(order.total))}</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === "PENDING_PAYMENT" && order.paymentMethod !== "cod" && (
                        <Button size="sm" className="text-xs gap-1" asChild>
                          <Link href={`/orders/${order.id}`}>
                            <Upload className="h-3 w-3" />
                            {order.slipUrl ? "ดูสลิปที่ส่ง" : "ส่งหลักฐานการชำระเงิน"}
                          </Link>
                        </Button>
                      )}
                      {order.status === "DELIVERED" && (
                        <Button variant="outline" size="sm" className="text-xs">
                          <Star className="h-3 w-3 mr-1" /> รีวิวสินค้า
                        </Button>
                      )}
                      {order.status === "SHIPPED" && (
                        <>
                          {(() => {
                            const trackUrl = getTrackingUrl(order.carrier, order.trackingNumber);
                            return trackUrl ? (
                              <Button variant="outline" size="sm" className="text-xs" asChild>
                                <a href={trackUrl} target="_blank" rel="noopener noreferrer">
                                  <Truck className="h-3 w-3 mr-1" /> ติดตามพัสดุ
                                </a>
                              </Button>
                            ) : null;
                          })()}
                          <Button
                            size="sm"
                            className="text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                            onClick={() => setConfirmOrder(order)}
                          >
                            <CheckCircle className="h-3 w-3" /> ยืนยันรับสินค้า
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="text-xs" asChild>
                        <Link href={`/orders/${order.id}`}>รายละเอียด</Link>
                      </Button>
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
