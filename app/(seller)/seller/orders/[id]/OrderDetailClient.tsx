"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Printer, Package, Truck, CheckCircle,
  MapPin, Phone, User, XCircle, Clock, RefreshCw,
  Copy, Check, Loader2, X, Receipt, ZoomIn, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SellerTopbar from "@/components/seller/SellerTopbar";
import { formatPrice, formatOrderNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusCfg: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING_PAYMENT: { label: "รอชำระ",      color: "text-yellow-700 bg-yellow-50 border-yellow-200",  icon: Clock       },
  PAID:            { label: "รอเตรียมของ", color: "text-blue-700 bg-blue-50 border-blue-200",        icon: Package     },
  PROCESSING:      { label: "กำลังเตรียม", color: "text-purple-700 bg-purple-50 border-purple-200",  icon: RefreshCw   },
  SHIPPED:         { label: "จัดส่งแล้ว",  color: "text-orange-700 bg-orange-50 border-orange-200",  icon: Truck       },
  DELIVERED:       { label: "สำเร็จ",      color: "text-green-700 bg-green-50 border-green-200",     icon: CheckCircle },
  CANCELLED:       { label: "ยกเลิก",      color: "text-red-700 bg-red-50 border-red-200",           icon: XCircle     },
};

const statusSteps = [
  { key: "PAID",       label: "ชำระแล้ว",    icon: CheckCircle },
  { key: "PROCESSING", label: "เตรียมพัสดุ", icon: Package },
  { key: "SHIPPED",    label: "จัดส่งแล้ว",  icon: Truck },
  { key: "DELIVERED",  label: "ได้รับสินค้า", icon: CheckCircle },
];

const SHIPPING_LABELS: Record<string, string> = {
  standard: "จัดส่งปกติ (Kerry Express)",
  express:  "จัดส่งด่วน (Flash Express)",
  free:     "ไปรษณีย์ไทย (ฟรี)",
};

const PAYMENT_LABELS: Record<string, string> = {
  promptpay:    "พร้อมเพย์ (QR Code)",
  credit_card:  "บัตรเครดิต/เดบิต",
  bank_transfer:"โอนเงินผ่านธนาคาร",
  cod:          "เก็บเงินปลายทาง",
};

interface OrderDetail {
  id: string;
  orderNumber: string | null;
  status: string;
  paymentMethod: string | null;
  shippingMethod: string | null;
  total: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  carrier: string | null;
  trackingNumber: string | null;
  note: string | null;
  slipUrl: string | null;
  slipUploadedAt: string | null;
  paymentVerified: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
  address: {
    recipientName: string;
    phone: string;
    addressLine: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { name: string; sku: string | null; images: { url: string }[] };
  }[];
}

/* ── QR code generator (pure client-side, no extra lib needed for display) ── */
function QRCodeImg({ value, size = 120 }: { value: string; size?: number }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) return;
    import("qrcode").then((QR) => {
      QR.toDataURL(value, { width: size, margin: 1 })
        .then((url) => setSrc(url))
        .catch(() => {});
    });
  }, [value, size]);

  if (!src) return <div style={{ width: size, height: size }} className="bg-gray-100 flex items-center justify-center text-xs text-gray-400">QR</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="QR" width={size} height={size} />;
}

/* ── Barcode renderer using jsbarcode ── */
function BarcodeImg({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    import("jsbarcode").then((mod) => {
      const JsBarcode = mod.default;
      try {
        JsBarcode(canvasRef.current, value, {
          format: "CODE128",
          displayValue: true,
          fontSize: 12,
          height: 60,
          margin: 4,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch {
        // invalid barcode value
      }
    });
  }, [value]);

  return <canvas ref={canvasRef} className="max-w-full" />;
}

/* ── Print dialog ── */
function PrintDialog({
  order,
  initialCarrier,
  initialTracking,
  onClose,
  onConfirm,
}: {
  order: OrderDetail;
  initialCarrier: string;
  initialTracking: string;
  onClose: () => void;
  onConfirm: (carrier: string, tracking: string) => void;
}) {
  const [carrier,  setCarrier]  = useState(initialCarrier);
  const [tracking, setTracking] = useState(initialTracking);

  const orderLabel = formatOrderNumber(order.orderNumber, order.id);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        {/* Dialog header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-orange-500" />
            <h2 className="font-bold text-gray-800">ใบปะหน้าพัสดุ</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Tracking input */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <p className="text-sm font-medium text-gray-700 mb-3">กรอกข้อมูลการจัดส่ง (ก่อนพิมพ์)</p>
          <div className="flex gap-3 flex-wrap">
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
            >
              <option value="">เลือกขนส่ง</option>
              {["Flash Express", "Kerry Express", "J&T Express", "ไปรษณีย์ไทย", "DHL", "Grab Express", "Ninja Van"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <Input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="เลขพัสดุ / Tracking Number..."
              className="flex-1 min-w-48 font-mono"
            />
          </div>
        </div>

        {/* Label preview */}
        <div className="px-6 py-4 overflow-x-auto">
          <p className="text-xs text-gray-400 mb-3">ตัวอย่างใบปะหน้า</p>

          {/* ── Label ── */}
          <div id="print-label-content" className="border-2 border-black rounded-sm font-sans text-sm bg-white" style={{ minWidth: 520 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black bg-orange-500">
              <div>
                <p className="text-xl font-black text-white tracking-wider">RTShop</p>
                <p className="text-xs text-orange-100">ใบปะหน้าพัสดุ</p>
              </div>
              <div className="text-right">
                {carrier && <div className="bg-white text-orange-600 font-bold px-3 py-1 rounded text-sm mb-1">{carrier}</div>}
                <p className="text-white text-xs font-mono">{new Date(order.createdAt).toLocaleDateString("th-TH")}</p>
              </div>
            </div>

            {/* Order number bar */}
            <div className="bg-gray-900 text-white px-5 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">เลขคำสั่งซื้อ</span>
              <span className="font-mono font-bold text-base tracking-widest">#{orderLabel}</span>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-2 border-b border-black">
              <div className="px-5 py-4 border-r border-black">
                <p className="text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">ผู้ส่ง</p>
                <p className="font-bold text-gray-800">RTShop Marketplace</p>
                <p className="text-xs text-gray-500 mt-1">support@rtshop.th</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">ผู้รับ</p>
                <p className="font-black text-lg text-gray-900 leading-tight">{order.address.recipientName}</p>
                <p className="text-gray-700 mt-1 font-medium">📞 {order.address.phone}</p>
                <p className="text-gray-600 mt-1 text-xs leading-relaxed">
                  {order.address.addressLine}<br />
                  ต.{order.address.subDistrict} อ.{order.address.district}<br />
                  จ.{order.address.province} {order.address.postalCode}
                </p>
              </div>
            </div>

            {/* QR + Barcode */}
            <div className="px-5 py-4 border-b border-black flex items-center gap-6">
              <div className="flex-shrink-0">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1 tracking-widest">QR Code</p>
                {tracking
                  ? <QRCodeImg value={tracking} size={100} />
                  : <div className="w-24 h-24 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-[10px] text-center">ใส่เลข<br/>Tracking</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1 tracking-widest">Barcode</p>
                {tracking
                  ? <BarcodeImg value={tracking} />
                  : <div className="h-16 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xs">ใส่เลข Tracking เพื่อแสดง Barcode</div>
                }
              </div>
            </div>

            {/* Items */}
            <div className="px-5 py-3">
              <p className="text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">รายการสินค้า</p>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0 text-xs">
                  <span className="text-gray-700">{item.product.name} × {item.quantity}</span>
                  <span className="font-medium text-gray-800">{formatPrice(Number(item.price) * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold text-sm">
                <span>ยอดรวม</span>
                <span className="text-orange-600">{formatPrice(Number(order.total))}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">RTShop Seller Center · {new Date().toLocaleString("th-TH")}</p>
              {tracking && (
                <p className="text-[10px] font-mono text-gray-500">{tracking}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5 pt-2">
          <Button className="flex-1 gap-2" onClick={() => onConfirm(carrier, tracking)}>
            <Printer className="h-4 w-4" /> พิมพ์ใบปะหน้า
          </Button>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const printTriggered = useRef(false);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [slipZoomed, setSlipZoomed] = useState(false);

  useEffect(() => {
    fetch(`/api/seller/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setOrder(data);
        setCarrier(data.carrier ?? "");
        setTrackingNumber(data.trackingNumber ?? "");

        if (searchParams.get("print") === "true" && !printTriggered.current) {
          printTriggered.current = true;
          setTimeout(() => setShowPrintDialog(true), 600);
        }
      })
      .catch(() => setError("โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [orderId, searchParams]);

  const confirmShip = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SHIPPED",
          ...(carrier ? { carrier } : {}),
          ...(trackingNumber ? { trackingNumber } : {}),
          ...(isCod ? { paymentVerified: true } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "บันทึกไม่สำเร็จ"); return; }
      setOrder((prev) => prev ? { ...prev, status: "SHIPPED", carrier, trackingNumber } : prev);
    } finally {
      setSaving(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm("ยืนยันการยกเลิกออเดอร์นี้?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) setOrder((prev) => prev ? { ...prev, status: "CANCELLED" } : prev);
    } finally {
      setCancelling(false);
    }
  };

  const handleChat = async () => {
    if (!order || chatting) return;
    setChatting(true);
    try {
      const res = await fetch("/api/seller/chat/with-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: order.user.id }),
      });
      if (!res.ok) { alert("เปิดแชทไม่สำเร็จ"); return; }
      const { conversationId } = await res.json();
      router.push(`/seller/chat?conv=${conversationId}`);
    } finally {
      setChatting(false);
    }
  };

  const copyTracking = () => {
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyPayment = async (verified: boolean) => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentVerified: verified }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "ไม่สำเร็จ"); return; }
      setOrder((prev) => prev ? {
        ...prev,
        paymentVerified: verified,
        status: data.status ?? prev.status,
      } : prev);
    } finally {
      setVerifying(false);
    }
  };

  const handlePrint = useCallback((dlgCarrier: string, dlgTracking: string) => {
    setCarrier(dlgCarrier);
    setTrackingNumber(dlgTracking);
    setShowPrintDialog(false);
    setTimeout(() => window.print(), 200);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SellerTopbar title="รายละเอียดออเดอร์" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col min-h-screen">
        <SellerTopbar title="รายละเอียดออเดอร์" />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-gray-400">{error || "ไม่พบออเดอร์"}</p>
          <Button variant="outline" onClick={() => router.push("/seller/orders")}>กลับ</Button>
        </div>
      </div>
    );
  }

  const cfg = statusCfg[order.status] ?? statusCfg["PAID"];
  const StatusIcon = cfg.icon;
  const currentStepIdx = statusSteps.findIndex((s) => s.key === order.status);
  const isCod = order.paymentMethod === "cod";
  const canShip = order.status === "PAID" || order.status === "PROCESSING" ||
                  (isCod && order.status === "PENDING_PAYMENT");
  const canCancel = order.status !== "CANCELLED" && order.status !== "DELIVERED" && order.status !== "SHIPPED";
  const orderLabel = formatOrderNumber(order.orderNumber, order.id);

  return (
    <>
      {/* ── Print dialog modal ── */}
      {showPrintDialog && (
        <PrintDialog
          order={order}
          initialCarrier={carrier}
          initialTracking={trackingNumber}
          onClose={() => setShowPrintDialog(false)}
          onConfirm={handlePrint}
        />
      )}

      {/* ── Screen view ── */}
      <div className="flex flex-col min-h-screen no-print">
        <SellerTopbar title={`ออเดอร์ #${orderLabel}`} />

        <div className="flex-1 p-6 space-y-5 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/seller/orders" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h2 className="text-lg font-bold text-gray-800">#{orderLabel}</h2>
                <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString("th-TH")}</p>
              </div>
              <span className={cn("flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border", cfg.color)}>
                <StatusIcon className="h-3.5 w-3.5" /> {cfg.label}
              </span>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowPrintDialog(true)}>
              <Printer className="h-4 w-4" /> พิมพ์ใบปะหน้า
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* Status steps */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {/* Shipping & payment method badges */}
            {(order.shippingMethod || order.paymentMethod) && (
              <div className="flex flex-wrap gap-2 mb-5">
                {order.shippingMethod && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">
                    <Truck className="h-3.5 w-3.5 text-gray-500" />
                    {SHIPPING_LABELS[order.shippingMethod] ?? order.shippingMethod}
                  </span>
                )}
                {order.paymentMethod && (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium",
                    isCod ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
                  )}>
                    💳 {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center">
              {statusSteps.map((step, idx) => {
                const done = idx <= currentStepIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", done ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={cn("text-xs mt-1.5 text-center whitespace-nowrap", done ? "text-orange-500 font-medium" : "text-gray-400")}>
                        {step.label}
                      </span>
                    </div>
                    {idx < statusSteps.length - 1 && (
                      <div className={cn("flex-1 h-0.5 mx-2 mb-5", idx < currentStepIdx ? "bg-orange-500" : "bg-gray-100")} />
                    )}
                  </div>
                );
              })}
            </div>

            {canShip && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  กรอกข้อมูลการจัดส่ง
                  {isCod && <span className="ml-2 text-xs font-normal text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">เก็บเงินปลายทาง</span>}
                </p>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                  >
                    <option value="">เลือกขนส่ง</option>
                    {["Flash Express", "Kerry Express", "J&T Express", "ไปรษณีย์ไทย", "DHL", "Grab Express", "Ninja Van"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="เลข Tracking..."
                    className="flex-1 min-w-48 font-mono"
                  />
                  <Button onClick={confirmShip} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    ยืนยันจัดส่ง
                  </Button>
                  {canCancel && (
                    <Button variant="outline" onClick={cancelOrder} disabled={cancelling} className="gap-2 text-red-500 border-red-200 hover:bg-red-50">
                      {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      ยกเลิก
                    </Button>
                  )}
                </div>
              </div>
            )}

            {order.trackingNumber && (
              <div className="mt-4 flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3">
                <Truck className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{order.carrier}</p>
                  <p className="font-mono text-sm font-bold text-blue-700">{order.trackingNumber}</p>
                </div>
                <button onClick={copyTracking} className="p-1.5 hover:bg-blue-100 rounded-lg">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-blue-400" />}
                </button>
              </div>
            )}
          </div>

          {/* ── Payment Slip section ── */}
          {(order.slipUrl || order.status === "PENDING_PAYMENT") && (
            <div className={cn(
              "bg-white rounded-2xl p-6 shadow-sm border-2",
              order.paymentVerified ? "border-green-200" : order.slipUrl ? "border-orange-200" : "border-gray-100"
            )}>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-orange-500" /> หลักฐานการชำระเงิน
                {order.paymentVerified && (
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> ยืนยันแล้ว
                  </span>
                )}
              </h3>

              {order.slipUrl ? (
                <div className="space-y-4">
                  {/* Slip image */}
                  <div className="relative">
                    <div
                      className="relative rounded-xl overflow-hidden bg-gray-50 cursor-zoom-in border border-gray-100 max-w-xs"
                      onClick={() => setSlipZoomed(true)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={order.slipUrl} alt="สลิป" className="w-full object-contain max-h-64" />
                      <div className="absolute bottom-2 right-2 bg-black/40 rounded-lg p-1">
                        <ZoomIn className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    {order.slipUploadedAt && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        อัพโหลดเมื่อ {new Date(order.slipUploadedAt).toLocaleString("th-TH")}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {!order.paymentVerified && (
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => verifyPayment(true)}
                        disabled={verifying}
                      >
                        {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        ยืนยันการชำระเงิน
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => verifyPayment(false)}
                        disabled={verifying}
                      >
                        <XCircle className="h-4 w-4" /> ปฏิเสธ
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-400 py-2">รอลูกค้าอัพโหลดสลิป...</div>
              )}
            </div>
          )}

          {/* Slip zoom modal */}
          {slipZoomed && order.slipUrl && (
            <div
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setSlipZoomed(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.slipUrl} alt="สลิป" className="max-w-full max-h-full rounded-xl shadow-2xl" />
              <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Customer info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-500" /> ผู้ซื้อ
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleChat}
                  disabled={chatting}
                  className="gap-1.5 text-orange-500 border-orange-200 hover:bg-orange-50 text-xs h-8"
                >
                  {chatting
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <MessageCircle className="h-3.5 w-3.5" />
                  }
                  แชทกับลูกค้า
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-800">{order.user.name}</p>
                <p className="text-gray-500">{order.user.email}</p>
                {order.user.phone && <p className="text-gray-500">{order.user.phone}</p>}
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" /> ที่อยู่จัดส่ง
              </h3>
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-gray-800">{order.address.recipientName}</p>
                <p className="text-gray-500 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {order.address.phone}
                </p>
                <p className="text-gray-500 leading-relaxed">
                  {order.address.addressLine} ต.{order.address.subDistrict} อ.{order.address.district} จ.{order.address.province} {order.address.postalCode}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-800">รายการสินค้า</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                    {item.product.images[0] ? (
                      <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <Package className="h-6 w-6 text-gray-300 m-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.product.name}</p>
                    {item.product.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.product.sku}</p>}
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{formatPrice(Number(item.price) * item.quantity)}</p>
                    <p className="text-xs text-gray-400">{formatPrice(Number(item.price))}/ชิ้น</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50/50 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>ราคาสินค้า</span><span>{formatPrice(Number(order.subtotal))}</span></div>
              <div className="flex justify-between text-gray-600"><span>ค่าจัดส่ง</span><span>{formatPrice(Number(order.shippingFee))}</span></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600"><span>ส่วนลด</span><span>-{formatPrice(Number(order.discount))}</span></div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>รวมทั้งหมด</span>
                <span className="text-orange-500">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {order.note && (
            <div className="bg-yellow-50 rounded-2xl p-5 text-sm text-yellow-800">
              <p className="font-medium mb-1">หมายเหตุจากผู้ซื้อ</p>
              <p>{order.note}</p>
            </div>
          )}

          {!canShip && canCancel && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={cancelOrder} disabled={cancelling} className="gap-2 text-red-500 border-red-200 hover:bg-red-50">
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                ยกเลิกออเดอร์
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Print waybill (shown only when printing) ── */}
      <div className="print-only">
        <div className="border-2 border-black font-sans text-sm bg-white" style={{ minWidth: 520 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black bg-orange-500">
            <div>
              <p className="text-xl font-black text-white tracking-wider">RTShop</p>
              <p className="text-xs text-orange-100">ใบปะหน้าพัสดุ</p>
            </div>
            <div className="text-right">
              {carrier && <div className="bg-white text-orange-600 font-bold px-3 py-1 rounded text-sm mb-1">{carrier}</div>}
              <p className="text-white text-xs font-mono">{new Date(order.createdAt).toLocaleDateString("th-TH")}</p>
            </div>
          </div>

          {/* Order number */}
          <div className="bg-gray-900 text-white px-5 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">เลขคำสั่งซื้อ</span>
            <span className="font-mono font-bold text-base tracking-widest">#{orderLabel}</span>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 border-b border-black">
            <div className="px-5 py-4 border-r border-black">
              <p className="text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">ผู้ส่ง</p>
              <p className="font-bold text-gray-800">RTShop Marketplace</p>
              <p className="text-xs text-gray-500 mt-1">support@rtshop.th</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">ผู้รับ</p>
              <p className="font-black text-lg text-gray-900 leading-tight">{order.address.recipientName}</p>
              <p className="text-gray-700 mt-1 font-medium">📞 {order.address.phone}</p>
              <p className="text-gray-600 mt-1 text-xs leading-relaxed">
                {order.address.addressLine}<br />
                ต.{order.address.subDistrict} อ.{order.address.district}<br />
                จ.{order.address.province} {order.address.postalCode}
              </p>
            </div>
          </div>

          {/* QR + Barcode */}
          {trackingNumber && (
            <div className="px-5 py-4 border-b border-black flex items-center gap-6">
              <div className="flex-shrink-0">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1 tracking-widest">QR Code</p>
                <QRCodeImg value={trackingNumber} size={100} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1 tracking-widest">Barcode</p>
                <BarcodeImg value={trackingNumber} />
              </div>
            </div>
          )}

          {/* Items */}
          <div className="px-5 py-3">
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">รายการสินค้า</p>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0 text-xs">
                <span className="text-gray-700">{item.product.name} × {item.quantity}</span>
                <span className="font-medium">{formatPrice(Number(item.price) * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-bold text-sm">
              <span>ยอดรวม</span>
              <span className="text-orange-600">{formatPrice(Number(order.total))}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-[10px] text-gray-400">RTShop Seller Center · {new Date().toLocaleString("th-TH")}</p>
            {trackingNumber && <p className="text-[10px] font-mono text-gray-500">{trackingNumber}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
