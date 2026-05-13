"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Store, CreditCard, Bell, Camera, Save,
  CheckCircle, AlertTriangle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SellerTopbar from "@/components/seller/SellerTopbar";
import { cn } from "@/lib/utils";
import { buildPromptPayPayload } from "@/lib/promptpay";

const settingTabs = [
  { key: "shop",  label: "ข้อมูลร้านค้า", icon: Store      },
  { key: "bank",  label: "บัญชีธนาคาร",   icon: CreditCard },
  { key: "notif", label: "การแจ้งเตือน",  icon: Bell       },
];

const banks = [
  "ธ.กสิกรไทย (KBANK)", "ธ.กรุงไทย (KTB)", "ธ.ไทยพาณิชย์ (SCB)",
  "ธ.กรุงเทพ (BBL)", "ธ.กรุงศรีอยุธยา (BAY)", "ธ.ออมสิน",
  "ธ.ทหารไทยธนชาต (TTB)", "ธ.ยูโอบี (UOB)", "ธ.ซีไอเอ็มบี (CIMB)",
];

export default function SellerSettingsPage() {
  const [activeTab, setActiveTab] = useState("shop");
  const [saved, setSaved]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [loadError, setLoadError] = useState("");
  const [uploadingLogo, setUploadingLogo]     = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const logoInputRef   = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [shop, setShop] = useState({
    name: "",
    description: "",
    logo: "",
    banner: "",
  });

  const [bank, setBank] = useState({
    bankName: "",
    bankAccount: "",
    bankAccountName: "",
    promptpayId: "",
  });
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  const [notifs, setNotifs] = useState({
    newOrder: true, orderCancelled: true, lowStock: true,
    payout: false, review: true, promotions: false,
  });

  useEffect(() => {
    fetch("/api/seller/settings")
      .then(async (r) => {
        const text = await r.text();
        try { return JSON.parse(text); } catch { throw new Error(text.slice(0, 200)); }
      })
      .then((data) => {
        if (data.error) { setLoadError(data.error); return; }
        setShop({
          name: data.name ?? "",
          description: data.description ?? "",
          logo: data.logo ?? "",
          banner: data.banner ?? "",
        });
        setBank({
          bankName: data.bankName ?? "",
          bankAccount: data.bankAccount ?? "",
          bankAccountName: data.bankAccountName ?? "",
          promptpayId: data.promptpayId ?? "",
        });
      })
      .catch((e) => setLoadError(e.message || "โหลดข้อมูลไม่สำเร็จ"));
  }, []);

  // Generate QR preview when promptpayId changes
  useEffect(() => {
    if (!bank.promptpayId || bank.promptpayId.length < 10) { setQrPreview(null); return; }
    import("qrcode").then((QRCode) => {
      const payload = buildPromptPayPayload(bank.promptpayId);
      QRCode.toDataURL(payload, { width: 180, margin: 2, color: { dark: "#000000", light: "#ffffff" } })
        .then(setQrPreview)
        .catch(() => setQrPreview(null));
    });
  }, [bank.promptpayId]);

  const uploadImage = async (file: File, type: "logo" | "banner") => {
    if (type === "logo") setUploadingLogo(true);
    else setUploadingBanner(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");

      const newShop = { ...shop, [type]: data.url };
      setShop(newShop);

      await fetch("/api/seller/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: data.url }),
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      if (type === "logo") setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body =
        activeTab === "shop" ? { name: shop.name, description: shop.description } :
        activeTab === "bank" ? { bankName: bank.bankName, bankAccount: bank.bankAccount, promptpayId: bank.promptpayId } :
        {};

      const res = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex flex-col min-h-screen">
        <SellerTopbar title="ตั้งค่าร้านค้า" />
        <div className="flex-1 flex items-center justify-center text-red-500">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SellerTopbar title="ตั้งค่าร้านค้า" />

      {/* hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file, "logo");
          e.target.value = "";
        }}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file, "banner");
          e.target.value = "";
        }}
      />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar tabs */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {settingTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors border-l-2",
                      activeTab === tab.key
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-transparent text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="xl:col-span-3 space-y-5">
            {/* ─── Shop Info ─── */}
            {activeTab === "shop" && (
              <>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Banner */}
                  <div className="relative h-36 bg-gradient-to-r from-orange-400 to-orange-600 group cursor-pointer"
                       onClick={() => bannerInputRef.current?.click()}>
                    {shop.banner ? (
                      <Image src={shop.banner} alt="banner" fill className="object-cover" sizes="100vw" />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all text-white text-sm gap-2 opacity-0 group-hover:opacity-100">
                      {uploadingBanner
                        ? <Loader2 className="h-5 w-5 animate-spin" />
                        : <><Camera className="h-5 w-5" /> เปลี่ยนรูปปก</>}
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="px-6 pb-5 -mt-10 flex items-end gap-4">
                    <div className="relative">
                      <div
                        className="w-20 h-20 rounded-2xl bg-orange-100 border-4 border-white flex items-center justify-center text-2xl shadow-md overflow-hidden cursor-pointer group"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {shop.logo ? (
                          <Image src={shop.logo} alt="logo" fill className="object-cover" sizes="80px" />
                        ) : (
                          <span>🛍️</span>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100 rounded-2xl">
                          {uploadingLogo
                            ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                            : <Camera className="h-5 w-5 text-white" />}
                        </div>
                      </div>
                    </div>
                    <div className="pb-1">
                      <p className="font-semibold text-gray-800">{shop.name || "ร้านค้าของฉัน"}</p>
                      <p className="text-xs text-gray-400">คลิกที่รูปเพื่อเปลี่ยน</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Store className="h-4 w-4 text-orange-500" /> ข้อมูลร้านค้า
                  </h3>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">ชื่อร้านค้า *</label>
                    <Input value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">คำอธิบายร้านค้า</label>
                    <textarea
                      value={shop.description}
                      onChange={(e) => setShop({ ...shop, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ─── Bank ─── */}
            {activeTab === "bank" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" /> บัญชีธนาคารสำหรับรับเงิน
                </h3>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    กรุณาใช้บัญชีธนาคารของคุณเองเท่านั้น
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">ธนาคาร *</label>
                    <select
                      value={bank.bankName}
                      onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                    >
                      <option value="">เลือกธนาคาร</option>
                      {banks.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">ชื่อบัญชี *</label>
                    <Input
                      value={bank.bankAccountName}
                      onChange={(e) => setBank({ ...bank, bankAccountName: e.target.value })}
                      placeholder="ชื่อ-นามสกุล เจ้าของบัญชี"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">เลขที่บัญชี *</label>
                    <Input
                      value={bank.bankAccount}
                      onChange={(e) => setBank({ ...bank, bankAccount: e.target.value })}
                      placeholder="xxx-x-xxxxx-x"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">พร้อมเพย์ (QR Code)</h4>
                  <p className="text-xs text-gray-400 mb-3">ลูกค้าจะเห็น QR Code นี้หลังจากสั่งซื้อด้วยพร้อมเพย์ — สแกนได้ทุกแอปธนาคาร</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">เบอร์โทรหรือเลขบัตรประชาชน</label>
                      <Input
                        value={bank.promptpayId}
                        onChange={(e) => setBank({ ...bank, promptpayId: e.target.value.replace(/\D/g, "") })}
                        placeholder="0812345678 หรือ 1234567890123"
                        maxLength={13}
                      />
                      <p className="text-xs text-gray-400 mt-1">กรอกเฉพาะตัวเลข 10 หลัก (เบอร์โทร) หรือ 13 หลัก (บัตรประชาชน)</p>
                    </div>
                    {qrPreview && (
                      <div className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 mb-2 font-medium">ตัวอย่าง QR ที่ลูกค้าเห็น</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrPreview} alt="QR Preview" className="w-32 h-32" />
                        <p className="text-[10px] text-green-600 mt-2 font-medium">✓ สแกนได้จากแอปธนาคาร</p>
                        {bank.bankAccountName && (
                          <p className="text-xs text-gray-600 mt-1 font-medium">{bank.bankAccountName}</p>
                        )}
                        <p className="text-[10px] text-gray-400">{bank.promptpayId}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Notifications ─── */}
            {activeTab === "notif" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-500" /> การแจ้งเตือน
                </h3>
                <p className="text-sm text-gray-400">การตั้งค่าการแจ้งเตือนจะนำไปใช้ในอนาคต</p>
                <div className="space-y-1">
                  {[
                    { key: "newOrder",       label: "มีคำสั่งซื้อใหม่",       desc: "แจ้งเตือนทันทีเมื่อมีออเดอร์ใหม่" },
                    { key: "orderCancelled", label: "ออเดอร์ถูกยกเลิก",       desc: "แจ้งเตือนเมื่อลูกค้ายกเลิกคำสั่งซื้อ" },
                    { key: "lowStock",       label: "สต็อกสินค้าใกล้หมด",     desc: "แจ้งเตือนเมื่อสินค้าเหลือ ≤ 5 ชิ้น" },
                    { key: "payout",         label: "การโอนเงิน",              desc: "แจ้งเตือนเมื่อมีการโอนเงินเข้าบัญชี" },
                    { key: "review",         label: "ลูกค้ารีวิวสินค้า",       desc: "แจ้งเตือนเมื่อมีรีวิวสินค้าใหม่" },
                    { key: "promotions",     label: "ข้อเสนอจาก RTShop",      desc: "ข่าวสารและ tips สำหรับผู้ขาย" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                      <div
                        onClick={() => setNotifs((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                        className={cn(
                          "w-10 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0",
                          notifs[item.key as keyof typeof notifs] ? "bg-orange-500" : "bg-gray-200"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 bg-white rounded-full absolute top-1 transition-transform",
                          notifs[item.key as keyof typeof notifs] ? "translate-x-5" : "translate-x-1"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} className="gap-2" disabled={saving || saved}>
                {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "บันทึกแล้ว!" : saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </Button>
              {saved && <p className="text-sm text-green-600">การตั้งค่าของคุณถูกบันทึกเรียบร้อย</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
