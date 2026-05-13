"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Check, CreditCard, Smartphone, Building2, Wallet, ArrowLeft, MapPin, Copy, AlertCircle, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { buildPromptPayPayload } from "@/lib/promptpay";

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

const shippingMethods = [
  { id: "standard", name: "จัดส่งปกติ", carrier: "Kerry Express", duration: "2-3 วัน", price: 50, supportsCod: true },
  { id: "express", name: "จัดส่งด่วน", carrier: "Flash Express", duration: "1-2 วัน", price: 80, supportsCod: true },
  { id: "free", name: "จัดส่งฟรี", carrier: "ไปรษณีย์ไทย", duration: "3-5 วัน", price: 0, minOrder: 299, supportsCod: false },
];

const allPaymentMethods = [
  { id: "promptpay", name: "พร้อมเพย์ (QR Code)", icon: Smartphone, desc: "สแกน QR Code ผ่านแอปธนาคาร" },
  { id: "credit_card", name: "บัตรเครดิต/เดบิต", icon: CreditCard, desc: "Visa, Mastercard, JCB" },
  { id: "bank_transfer", name: "โอนเงินผ่านธนาคาร", icon: Building2, desc: "กรุงไทย, กสิกร, ไทยพาณิชย์" },
  { id: "cod", name: "เก็บเงินปลายทาง", icon: Wallet, desc: "ชำระเมื่อได้รับสินค้า (+30 บาท)" },
];

type Step = "address" | "shipping" | "payment" | "review";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: "บ้าน", recipientName: "", phone: "",
    addressLine: "", district: "", subDistrict: "", province: "", postalCode: "",
  });
  const [savingAddr, setSavingAddr] = useState(false);

  const [step, setStep] = useState<Step>("address");
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const [selectedPayment, setSelectedPayment] = useState("promptpay");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placeError, setPlaceError] = useState("");
  const [shopPayment, setShopPayment] = useState<{ name: string; bankName: string | null; bankAccount: string | null; bankAccountName: string | null; promptpayId: string | null } | null>(null);
  const [promptpayQR, setPromptpayQR] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [slipUploaded, setSlipUploaded] = useState(false);
  const [slipError, setSlipError] = useState("");
  const slipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const method = shippingMethods.find((s) => s.id === selectedShipping);
    if (!method?.supportsCod && selectedPayment === "cod") {
      setSelectedPayment("promptpay");
    }
  }, [selectedShipping, selectedPayment]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/addresses")
      .then((r) => r.json())
      .then((data) => {
        const list: Address[] = data.addresses ?? [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) setSelectedAddress(def.id);
        if (list.length === 0) setShowAddForm(true);
      })
      .finally(() => setAddrLoading(false));
  }, [user]);

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const shipping = shippingMethods.find((s) => s.id === selectedShipping);
  const shippingFee = shipping?.minOrder && subtotal >= shipping.minOrder ? 0 : (shipping?.price ?? 0);
  const codFee = selectedPayment === "cod" ? 30 : 0;
  const total = subtotal + shippingFee + codFee;

  const paymentMethods = allPaymentMethods.filter(
    (p) => p.id !== "cod" || (shipping?.supportsCod ?? true)
  );

  const steps: { key: Step; label: string }[] = [
    { key: "address", label: "ที่อยู่" },
    { key: "shipping", label: "จัดส่ง" },
    { key: "payment", label: "ชำระเงิน" },
    { key: "review", label: "ยืนยัน" },
  ];
  const stepOrder: Step[] = ["address", "shipping", "payment", "review"];
  const currentStepIdx = stepOrder.indexOf(step);

  const handleSaveAddress = async () => {
    setSavingAddr(true);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAddr, isDefault: addresses.length === 0 }),
    });
    if (res.ok) {
      const data = await res.json();
      const addr: Address = data.address;
      setAddresses((prev) => [...prev, addr]);
      setSelectedAddress(addr.id);
      setShowAddForm(false);
      setNewAddr({ label: "บ้าน", recipientName: "", phone: "", addressLine: "", district: "", subDistrict: "", province: "", postalCode: "" });
    }
    setSavingAddr(false);
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddress || items.length === 0) return;
    setPlaceError("");
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress,
          shippingMethod: selectedShipping,
          paymentMethod: selectedPayment,
          note: note || undefined,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            variantId: i.variantId,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPlaceError(data.message ?? "เกิดข้อผิดพลาด");
      } else {
        const finalTotal = total;
        const shopId = data.shopId ?? items[0]?.product.shopId;
        clearCart();
        setOrderTotal(finalTotal);
        setPlacedOrderId(data.orderId);

        // Fetch shop-specific payment info
        if (shopId && (selectedPayment === "promptpay" || selectedPayment === "bank_transfer")) {
          try {
            const shopData = await fetch(`/api/shops/${shopId}/payment`).then((r) => r.json());
            setShopPayment(shopData);
            if (selectedPayment === "promptpay" && shopData.promptpayId) {
              const payload = buildPromptPayPayload(shopData.promptpayId, finalTotal);
              const QRCode = await import("qrcode");
              const dataUrl = await QRCode.toDataURL(payload, {
                width: 260, margin: 2,
                color: { dark: "#000000", light: "#ffffff" },
              });
              setPromptpayQR(dataUrl);
            }
          } catch {}
        }
      }
    } catch {
      setPlaceError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setPlacing(false);
    }
  };

  const handleSlipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
    setSlipError("");
    setSlipUploaded(false);
  };

  const handleSlipUpload = async () => {
    if (!slipFile || !placedOrderId) return;
    setUploadingSlip(true);
    setSlipError("");
    try {
      const form = new FormData();
      form.append("file", slipFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("อัพโหลดไม่สำเร็จ");
      const { url } = await uploadRes.json();
      const slipRes = await fetch(`/api/orders/${placedOrderId}/slip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slipUrl: url }),
      });
      if (!slipRes.ok) throw new Error("บันทึกสลิปไม่สำเร็จ");
      setSlipUploaded(true);
    } catch (err) {
      setSlipError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setUploadingSlip(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (items.length === 0 && !placedOrderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
        <p className="text-gray-500">ตะกร้าว่างเปล่า</p>
        <Button asChild><Link href="/products">เลือกสินค้า</Link></Button>
      </div>
    );
  }

  if (placedOrderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">สั่งซื้อสำเร็จ!</h2>
          <p className="text-sm text-gray-500 mb-1">หมายเลขคำสั่งซื้อ</p>
          <p className="text-sm font-bold text-orange-500 mb-4 font-mono break-all">#{placedOrderId}</p>

          {/* Shop payment info */}
          {selectedPayment === "promptpay" && (
            <div className="mb-6 border border-gray-100 rounded-2xl p-5 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700 mb-1">ชำระเงินผ่าน PromptPay</p>
              <p className="text-xs text-gray-400 mb-3">สแกน QR Code ด้วยแอปธนาคารของคุณ</p>
              {promptpayQR ? (
                <div className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={promptpayQR} alt="PromptPay QR" className="rounded-xl border border-gray-100 shadow-sm" width={220} height={220} />
                  <div className="mt-3 text-center space-y-0.5">
                    {shopPayment?.bankAccountName && (
                      <p className="text-sm font-bold text-gray-800">{shopPayment.bankAccountName}</p>
                    )}
                    {shopPayment?.promptpayId && (
                      <p className="text-sm text-gray-500 font-mono">{shopPayment.promptpayId}</p>
                    )}
                    <p className="text-lg font-bold text-orange-500 mt-1">{formatPrice(orderTotal)}</p>
                    <p className="text-xs text-gray-400">สแกน QR ด้วยแอปธนาคารหรือ PromptPay</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>ร้านค้ายังไม่ได้ตั้งค่าเบอร์พร้อมเพย์ กรุณาติดต่อร้านค้าโดยตรง</span>
                </div>
              )}
            </div>
          )}

          {selectedPayment === "bank_transfer" && shopPayment && (
            <div className="mb-6 border border-gray-100 rounded-2xl p-5 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700 mb-3">โอนเงินเข้าบัญชีร้านค้า</p>
              <div className="space-y-1.5 text-sm text-left">
                {shopPayment.bankName && <p className="text-gray-500">ธนาคาร: <span className="text-gray-800 font-medium">{shopPayment.bankName}</span></p>}
                {shopPayment.bankAccountName && <p className="text-gray-500">ชื่อบัญชี: <span className="text-gray-800 font-semibold">{shopPayment.bankAccountName}</span></p>}
                {shopPayment.bankAccount && (
                  <p className="text-gray-500 flex items-center gap-2">
                    เลขบัญชี:
                    <span className="text-gray-800 font-mono font-bold tracking-wider">{shopPayment.bankAccount}</span>
                    <button onClick={() => navigator.clipboard?.writeText(shopPayment.bankAccount!)}
                      className="text-orange-400 hover:text-orange-500 flex-shrink-0">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </p>
                )}
                <p className="text-gray-500 mt-1">ยอดโอน: <span className="text-orange-500 font-bold text-base">{formatPrice(orderTotal)}</span></p>
              </div>
              {!shopPayment.bankName && !shopPayment.bankAccount && (
                <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>ร้านค้ายังไม่ได้ตั้งค่าบัญชีธนาคาร กรุณาติดต่อร้านค้าโดยตรง</span>
                </div>
              )}
            </div>
          )}

          {selectedPayment === "cod" && (
            <p className="text-sm text-gray-500 mb-4">ชำระเงินเมื่อได้รับสินค้า</p>
          )}

          {selectedPayment === "credit_card" && (
            <p className="text-sm text-gray-500 mb-4">
              กรุณาตรวจสอบสถานะการจัดส่งได้ที่หน้าประวัติการสั่งซื้อ
            </p>
          )}

          {/* Slip upload — for promptpay / bank_transfer */}
          {(selectedPayment === "promptpay" || selectedPayment === "bank_transfer") && (
            <div className="mb-6 border border-gray-100 rounded-2xl p-5 bg-gray-50 text-left">
              <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Upload className="h-4 w-4 text-orange-500" /> แจ้งโอนเงิน
              </p>
              <p className="text-xs text-gray-400 mb-3">อัพโหลดสลิปเพื่อแจ้งร้านค้า — ร้านค้าจะยืนยันการชำระเงินหลังได้รับสลิป</p>

              {slipUploaded ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="h-4 w-4" /> แจ้งโอนสำเร็จ ร้านค้าจะตรวจสอบสลิปของคุณ
                </div>
              ) : (
                <>
                  <input ref={slipInputRef} type="file" accept="image/*" className="hidden" onChange={handleSlipSelect} />
                  {slipPreview ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slipPreview} alt="สลิป" className="max-h-48 rounded-xl border border-gray-200 object-contain" />
                        <button
                          onClick={() => { setSlipFile(null); setSlipPreview(null); }}
                          className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 shadow-sm hover:bg-gray-50"
                        >
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                      {slipError && <p className="text-xs text-red-500">{slipError}</p>}
                      <Button size="sm" onClick={handleSlipUpload} disabled={uploadingSlip} className="gap-2 w-full">
                        {uploadingSlip ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังส่ง...</> : <><Upload className="h-3.5 w-3.5" /> ส่งสลิปให้ร้านค้า</>}
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => slipInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-orange-500 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors w-full justify-center"
                    >
                      <ImageIcon className="h-4 w-4" /> เลือกรูปสลิป
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/">กลับหน้าหลัก</Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link href={`/orders/${placedOrderId}`}>ดูรายละเอียดออเดอร์</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/cart" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">ชำระเงิน</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {steps.map((s, idx) => (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  currentStepIdx > idx ? "bg-green-500 text-white" :
                  currentStepIdx === idx ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
                )}>
                  {currentStepIdx > idx ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span className={cn("text-xs mt-1", currentStepIdx === idx ? "text-orange-500 font-medium" : "text-gray-400")}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-2 mb-4", currentStepIdx > idx ? "bg-green-500" : "bg-gray-200")} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {step === "address" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">เลือกที่อยู่จัดส่ง</h2>
                {addrLoading ? (
                  <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {addresses.map((addr) => (
                        <label key={addr.id} className={cn(
                          "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                          selectedAddress === addr.id ? "border-orange-500 bg-orange-50" : "border-gray-100 hover:border-gray-200"
                        )}>
                          <input
                            type="radio"
                            name="address"
                            value={addr.id}
                            checked={selectedAddress === addr.id}
                            onChange={() => setSelectedAddress(addr.id)}
                            className="mt-0.5 accent-orange-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{addr.label}</span>
                              {addr.isDefault && <span className="text-xs text-orange-500 font-medium">ค่าเริ่มต้น</span>}
                            </div>
                            <p className="font-medium text-gray-800">{addr.recipientName}</p>
                            <p className="text-sm text-gray-500">{addr.phone}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {addr.addressLine} แขวง{addr.subDistrict} เขต{addr.district} {addr.province} {addr.postalCode}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {!showAddForm ? (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 text-orange-500 text-sm font-medium hover:text-orange-600"
                      >
                        <Plus className="h-4 w-4" /> เพิ่มที่อยู่ใหม่
                      </button>
                    ) : (
                      <div className="border border-gray-200 rounded-xl p-4 space-y-3 mt-2">
                        <p className="font-medium text-gray-800 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-500" /> เพิ่มที่อยู่ใหม่
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">ป้ายกำกับ</label>
                            <Input value={newAddr.label} onChange={(e) => setNewAddr((p) => ({ ...p, label: e.target.value }))} placeholder="บ้าน / ที่ทำงาน" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">ชื่อผู้รับ</label>
                            <Input value={newAddr.recipientName} onChange={(e) => setNewAddr((p) => ({ ...p, recipientName: e.target.value }))} placeholder="ชื่อ-นามสกุล" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">เบอร์โทร</label>
                            <Input value={newAddr.phone} onChange={(e) => setNewAddr((p) => ({ ...p, phone: e.target.value }))} placeholder="08x-xxx-xxxx" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">ที่อยู่</label>
                            <Input value={newAddr.addressLine} onChange={(e) => setNewAddr((p) => ({ ...p, addressLine: e.target.value }))} placeholder="บ้านเลขที่ / ถนน" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">แขวง/ตำบล</label>
                            <Input value={newAddr.subDistrict} onChange={(e) => setNewAddr((p) => ({ ...p, subDistrict: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">เขต/อำเภอ</label>
                            <Input value={newAddr.district} onChange={(e) => setNewAddr((p) => ({ ...p, district: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">จังหวัด</label>
                            <Input value={newAddr.province} onChange={(e) => setNewAddr((p) => ({ ...p, province: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">รหัสไปรษณีย์</label>
                            <Input value={newAddr.postalCode} onChange={(e) => setNewAddr((p) => ({ ...p, postalCode: e.target.value }))} placeholder="10xxx" />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>ยกเลิก</Button>
                          <Button size="sm" onClick={handleSaveAddress} disabled={savingAddr || !newAddr.recipientName || !newAddr.addressLine}>
                            {savingAddr ? "กำลังบันทึก..." : "บันทึก"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <Button
                  className="w-full mt-6"
                  onClick={() => setStep("shipping")}
                  disabled={!selectedAddress}
                >
                  ถัดไป: เลือกวิธีจัดส่ง <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Step 2: Shipping */}
            {step === "shipping" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">เลือกวิธีการจัดส่ง</h2>
                <div className="space-y-3 mb-6">
                  {shippingMethods.map((method) => {
                    const needsMore = method.minOrder && subtotal < method.minOrder;
                    return (
                      <label key={method.id} className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                        selectedShipping === method.id ? "border-orange-500 bg-orange-50" : "border-gray-100 hover:border-gray-200"
                      )}>
                        <input
                          type="radio"
                          name="shipping"
                          value={method.id}
                          checked={selectedShipping === method.id}
                          onChange={() => setSelectedShipping(method.id)}
                          className="accent-orange-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-800">{method.name}</p>
                              <p className="text-sm text-gray-500">{method.carrier} · {method.duration}</p>
                            </div>
                            <div className="text-right">
                              {method.price === 0 && !needsMore ? (
                                <span className="text-green-600 font-bold">ฟรี</span>
                              ) : (
                                <span className="font-bold">{formatPrice(method.price)}</span>
                              )}
                              {needsMore && (
                                <p className="text-xs text-gray-400">ต้องซื้อครบ {formatPrice(method.minOrder!)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">หมายเหตุถึงผู้ขาย (ไม่จำเป็น)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เช่น ต้องการสีน้ำเงิน, แพ็กเป็นของขวัญ..."
                    className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("address")}>ย้อนกลับ</Button>
                  <Button className="flex-1" onClick={() => setStep("payment")}>
                    ถัดไป: ชำระเงิน <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === "payment" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">เลือกช่องทางชำระเงิน</h2>
                {!shipping?.supportsCod && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    ไปรษณีย์ไทยรองรับเฉพาะการชำระเงินล่วงหน้าเท่านั้น
                  </div>
                )}
                <div className="space-y-3 mb-6">
                  {paymentMethods.map((method) => (
                    <label key={method.id} className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                      selectedPayment === method.id ? "border-orange-500 bg-orange-50" : "border-gray-100 hover:border-gray-200"
                    )}>
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                        className="accent-orange-500"
                      />
                      <method.icon className={cn("h-6 w-6 flex-shrink-0", selectedPayment === method.id ? "text-orange-500" : "text-gray-400")} />
                      <div>
                        <p className="font-medium text-gray-800">{method.name}</p>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("shipping")}>ย้อนกลับ</Button>
                  <Button className="flex-1" onClick={() => setStep("review")}>
                    ถัดไป: ยืนยันคำสั่งซื้อ <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === "review" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold mb-4">ยืนยันคำสั่งซื้อ</h2>
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.variantId}`} className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                        {item.variantName && <p className="text-xs text-gray-400">{item.variantName}</p>}
                        <p className="text-xs text-gray-500 mt-1">x{item.quantity}</p>
                      </div>
                      <span className="font-semibold text-gray-800">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>ที่อยู่จัดส่ง</span>
                      <span className="text-right text-gray-800 max-w-48">
                        {(() => {
                          const a = addresses.find((x) => x.id === selectedAddress);
                          return a ? `${a.recipientName} · ${a.province}` : "-";
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>วิธีจัดส่ง</span>
                      <span className="text-gray-800">{shippingMethods.find((s) => s.id === selectedShipping)?.carrier}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>ชำระเงินด้วย</span>
                      <span className="text-gray-800">{paymentMethods.find((p) => p.id === selectedPayment)?.name}</span>
                    </div>
                  </div>
                </div>

                {placeError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    {placeError}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("payment")}>ย้อนกลับ</Button>
                  <Button className="flex-1" size="lg" onClick={handlePlaceOrder} disabled={placing}>
                    {placing ? "กำลังสั่งซื้อ..." : `ยืนยันและชำระเงิน ${formatPrice(total)}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm h-fit">
            <h3 className="font-semibold text-gray-800 mb-4">สรุปคำสั่งซื้อ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>สินค้า ({items.length} รายการ)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ค่าจัดส่ง</span>
                <span>{shippingFee === 0 ? <span className="text-green-600">ฟรี</span> : formatPrice(shippingFee)}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>ค่าเก็บเงินปลายทาง</span>
                  <span>+{formatPrice(codFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t border-gray-100">
                <span>รวมทั้งหมด</span>
                <span className="text-orange-500 text-base">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
