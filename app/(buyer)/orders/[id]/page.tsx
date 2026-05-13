"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock,
  MapPin, CreditCard, Star, AlertTriangle, Upload, ImageIcon, Check, ExternalLink, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatOrderNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; step: number }> = {
  PENDING_PAYMENT: { label: "รอชำระเงิน",       icon: Clock,        color: "text-yellow-600 bg-yellow-50", step: 0 },
  PAID:            { label: "ชำระเงินแล้ว",      icon: CheckCircle,  color: "text-blue-600 bg-blue-50",    step: 1 },
  PROCESSING:      { label: "กำลังเตรียมสินค้า", icon: Package,      color: "text-purple-600 bg-purple-50", step: 2 },
  SHIPPED:         { label: "กำลังจัดส่ง",       icon: Truck,        color: "text-orange-600 bg-orange-50", step: 3 },
  DELIVERED:       { label: "ได้รับสินค้าแล้ว",  icon: CheckCircle,  color: "text-green-600 bg-green-50",  step: 4 },
  CANCELLED:       { label: "ยกเลิกแล้ว",        icon: XCircle,      color: "text-red-600 bg-red-50",      step: -1 },
};

const carrierTrackingUrls: Record<string, string> = {
  "Flash Express":    "https://www.flashexpress.co.th/tracking/?se=",
  "Kerry Express":    "https://th.kerryexpress.com/th/track/?track=",
  "ไปรษณีย์ไทย":      "https://track.thailandpost.co.th/?trackNumber=",
  "J&T Express":      "https://www.jtexpress.co.th/index/query/gzquery.html?bills=",
  "Ninja Van":        "https://www.ninjavan.co/th-th/tracking?id=",
  "DHL":              "https://www.dhl.com/th-en/home/tracking.html?tracking-id=",
  "Best Express":     "https://www.best-inc.co.th/track?",
  "SCG Express":      "https://scgexpress.co.th/tracking?barcode=",
};

function getTrackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
  if (!carrier || !trackingNumber) return null;
  const base = carrierTrackingUrls[carrier];
  return base ? base + encodeURIComponent(trackingNumber) : null;
}

const paymentLabel: Record<string, string> = {
  promptpay:     "พร้อมเพย์ (QR Code)",
  credit_card:   "บัตรเครดิต/เดบิต",
  bank_transfer: "โอนเงินผ่านธนาคาร",
  cod:           "เก็บเงินปลายทาง",
};

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: { url: string }[];
    shop: { name: string; slug: string };
  };
}

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  note: string | null;
  slipUrl: string | null;
  slipUploadedAt: string | null;
  paymentVerified: boolean;
  createdAt: string;
  address: {
    recipientName: string;
    phone: string;
    addressLine: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
  };
  items: OrderItem[];
}

/* ── Confirm receipt + review all items ── */
function ConfirmReceiptModal({
  order,
  onDone,
  onClose,
}: {
  order: Order;
  onDone: () => void;
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

      onDone();
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

// Review modal
function ReviewModal({
  productId,
  productName,
  onClose,
  onSubmit,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(rating, comment);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-bold text-gray-800 mb-1">รีวิวสินค้า</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-1">{productName}</p>

        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="p-1"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  s <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"
                )}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="แชร์ประสบการณ์ของคุณ (ไม่บังคับ)"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-orange-500 mb-4"
        />

        <div className="flex gap-2">
          <Button onClick={handleSubmit} className="flex-1" disabled={submitting}>
            {submitting ? "กำลังส่ง..." : "ส่งรีวิว"}
          </Button>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reviewItem, setReviewItem] = useState<{ id: string; name: string } | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [slipUploaded, setSlipUploaded] = useState(false);
  const [slipError, setSlipError] = useState("");
  const slipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?redirect=/orders/${id}`);
  }, [authLoading, user, router, id]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/orders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => setOrder(data))
      .catch(() => router.replace("/orders"))
      .finally(() => setLoading(false));
  }, [user, id, router]);

  const handleCancel = async () => {
    if (!confirm("ยืนยันการยกเลิกออเดอร์?")) return;
    setCancelling(true);
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setOrder((o) => o ? { ...o, status: updated.status } : o);
    }
    setCancelling(false);
  };

  const handleSlipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
    setSlipError("");
  };

  const handleSlipUpload = async () => {
    if (!slipFile) return;
    setUploadingSlip(true);
    setSlipError("");
    try {
      const form = new FormData();
      form.append("file", slipFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("อัพโหลดไม่สำเร็จ");
      const { url } = await uploadRes.json();
      const slipRes = await fetch(`/api/orders/${id}/slip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slipUrl: url }),
      });
      if (!slipRes.ok) throw new Error("บันทึกสลิปไม่สำเร็จ");
      setSlipUploaded(true);
      setOrder((o) => o ? { ...o, slipUrl: url, slipUploadedAt: new Date().toISOString() } : o);
    } catch (err) {
      setSlipError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setUploadingSlip(false);
    }
  };

  const handleConfirmDone = () => {
    setOrder((o) => o ? { ...o, status: "DELIVERED" } : o);
    setShowConfirmModal(false);
    if (order) setReviewedIds(new Set(order.items.map((i) => i.product.id)));
  };

  const handleReview = async (rating: number, comment: string) => {
    if (!reviewItem) return;
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: reviewItem.id, rating, comment }),
    });
    setReviewedIds((prev) => new Set(prev).add(reviewItem.id));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const status = statusConfig[order.status] ?? statusConfig["PENDING_PAYMENT"];
  const StatusIcon = status.icon;
  const steps = ["รอชำระ", "ชำระแล้ว", "เตรียมของ", "จัดส่ง", "สำเร็จ"];
  const isCancelled = order.status === "CANCELLED";
  const canCancel = ["PENDING_PAYMENT", "PAID"].includes(order.status);
  const canConfirmReceipt = order.status === "SHIPPED";

  return (
    <div className="min-h-screen bg-gray-50">
      {showConfirmModal && order && (
        <ConfirmReceiptModal
          order={order}
          onDone={handleConfirmDone}
          onClose={() => setShowConfirmModal(false)}
        />
      )}

      {reviewItem && (
        <ReviewModal
          productId={reviewItem.id}
          productName={reviewItem.name}
          onClose={() => setReviewItem(null)}
          onSubmit={handleReview}
        />
      )}

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="h-4 w-4" /> กลับ
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">เลขคำสั่งซื้อ</p>
              <p className="font-mono font-bold text-gray-800">#{formatOrderNumber(order.orderNumber, order.id)}</p>
            </div>
            <span className={cn("flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full", status.color)}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleString("th-TH")}
          </p>

          {/* Progress stepper */}
          {!isCancelled && (
            <div className="mt-4 flex items-center">
              {steps.map((label, idx) => {
                const done = status.step > idx;
                const active = status.step === idx;
                return (
                  <React.Fragment key={label}>
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        done ? "bg-orange-500 text-white" : active ? "bg-orange-100 text-orange-600 ring-2 ring-orange-400" : "bg-gray-100 text-gray-400"
                      )}>
                        {done ? "✓" : idx + 1}
                      </div>
                      <span className={cn("text-[9px] mt-1 text-center w-10", active ? "text-orange-600 font-semibold" : done ? "text-gray-500" : "text-gray-300")}>
                        {label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={cn("flex-1 h-0.5 mb-4", done ? "bg-orange-400" : "bg-gray-100")} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {isCancelled && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              คำสั่งซื้อนี้ถูกยกเลิกแล้ว
            </div>
          )}

          {canConfirmReceipt && (
            <div className="mt-4 flex items-center justify-between bg-green-50 rounded-xl px-4 py-3 border border-green-200">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">ได้รับสินค้าแล้วใช่ไหม?</p>
              </div>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5 ml-3"
                onClick={() => setShowConfirmModal(true)}
              >
                <CheckCircle className="h-3.5 w-3.5" /> ยืนยันรับสินค้า
              </Button>
            </div>
          )}
        </div>

        {/* Payment slip section — for pending non-COD orders */}
        {order.status === "PENDING_PAYMENT" && order.paymentMethod !== "cod" && (
          <div className={cn(
            "bg-white rounded-2xl p-5 shadow-sm mb-4 border-2",
            order.paymentVerified ? "border-green-200" :
            (order.slipUrl || slipUploaded) ? "border-orange-200" : "border-dashed border-orange-300"
          )}>
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Upload className="h-4 w-4 text-orange-500" /> ส่งหลักฐานการชำระเงิน
            </h3>

            {order.paymentVerified ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <Check className="h-4 w-4" /> ร้านค้ายืนยันการชำระเงินแล้ว
              </div>
            ) : (order.slipUrl || slipUploaded) ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-orange-600 text-sm font-medium">
                  <Check className="h-4 w-4" /> ส่งสลิปแล้ว — รอร้านค้าตรวจสอบ
                </div>
                {order.slipUrl && (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={order.slipUrl} alt="สลิป" className="max-h-48 rounded-xl border border-gray-100 object-contain" />
                  </div>
                )}
                {order.slipUploadedAt && (
                  <p className="text-xs text-gray-400">อัพโหลดเมื่อ {new Date(order.slipUploadedAt).toLocaleString("th-TH")}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  กรุณาโอนเงินตามข้อมูลที่ได้รับ แล้วอัพโหลดสลิปเพื่อแจ้งร้านค้า
                </p>
                <input ref={slipInputRef} type="file" accept="image/*" className="hidden" onChange={handleSlipSelect} />
                {slipPreview ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slipPreview} alt="preview" className="max-h-48 rounded-xl border border-gray-100 object-contain" />
                      <button
                        onClick={() => { setSlipFile(null); setSlipPreview(null); }}
                        className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500 text-xs"
                      >✕</button>
                    </div>
                    {slipError && <p className="text-xs text-red-500">{slipError}</p>}
                    <Button size="sm" onClick={handleSlipUpload} disabled={uploadingSlip} className="w-full gap-2">
                      {uploadingSlip
                        ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังส่ง...</>
                        : <><Upload className="h-3.5 w-3.5" /> ส่งสลิปให้ร้านค้า</>}
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => slipInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm text-orange-500 border-2 border-dashed border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
                  >
                    <ImageIcon className="h-4 w-4" /> แนบรูปสลิปโอนเงิน
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tracking */}
        {order.trackingNumber && (() => {
          const trackUrl = getTrackingUrl(order.carrier, order.trackingNumber);
          return (
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 flex items-center gap-4">
              <div className="p-2.5 bg-orange-100 rounded-xl flex-shrink-0">
                <Truck className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">ติดตามพัสดุ</p>
                <p className="text-sm font-medium text-gray-700">{order.carrier}</p>
                <p className="text-sm font-mono font-bold text-orange-500 break-all">{order.trackingNumber}</p>
              </div>
              {trackUrl && (
                <a
                  href={trackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> ติดตาม
                </a>
              )}
            </div>
          );
        })()}

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">สินค้า</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item) => {
              const img = item.product.images[0]?.url ?? "https://picsum.photos/seed/default/100/100";
              const reviewed = reviewedIds.has(item.product.id);
              return (
                <div key={item.id} className="p-5 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                    <Image src={img} alt={item.product.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.product.shop.name} · x{item.quantity}</p>
                    <p className="text-sm font-bold text-orange-500 mt-1">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                  {order.status === "DELIVERED" && (
                    <button
                      onClick={() => !reviewed && setReviewItem({ id: item.product.id, name: item.product.name })}
                      className={cn(
                        "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors",
                        reviewed ? "bg-gray-100 text-gray-400 cursor-default" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                      )}
                    >
                      <Star className="h-3 w-3" />
                      {reviewed ? "รีวิวแล้ว" : "รีวิว"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-orange-500" /> ที่อยู่จัดส่ง
          </h3>
          <p className="text-sm font-medium text-gray-800">{order.address.recipientName}</p>
          <p className="text-sm text-gray-500">{order.address.phone}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {order.address.addressLine} {order.address.subDistrict} {order.address.district}{" "}
            {order.address.province} {order.address.postalCode}
          </p>
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-orange-500" /> สรุปการชำระเงิน
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>ยอดสินค้า</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>ค่าจัดส่ง</span>
              <span>{Number(order.shippingFee) === 0 ? "ฟรี" : formatPrice(Number(order.shippingFee))}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>ส่วนลด</span>
                <span>-{formatPrice(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t border-gray-100">
              <span>ยอดรวม</span>
              <span className="text-orange-500">{formatPrice(Number(order.total))}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs pt-1">
              <span>ช่องทางชำระเงิน</span>
              <span>{paymentLabel[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "-"}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        {order.note && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <p className="text-xs font-medium text-gray-500 mb-1">หมายเหตุ</p>
            <p className="text-sm text-gray-700">{order.note}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {canConfirmReceipt && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={() => setShowConfirmModal(true)}
            >
              <CheckCircle className="h-4 w-4" /> ยืนยันรับสินค้า
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-500 hover:bg-red-50"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "กำลังยกเลิก..." : "ยกเลิกคำสั่งซื้อ"}
            </Button>
          )}
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/orders">กลับหน้ารายการคำสั่งซื้อ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
