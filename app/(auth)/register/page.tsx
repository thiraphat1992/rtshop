"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Check, User, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AccountType = "buyer" | "seller";

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    bankName: "",
    bankAccount: "",
    agreeTerms: false,
  });

  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (form.password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: accountType.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">สมัครสมาชิกสำเร็จ!</h2>
          <p className="text-gray-500 mb-6 text-sm">
            {accountType === "seller"
              ? "ขอบคุณที่สมัครเป็นผู้ขาย เราจะตรวจสอบข้อมูลของคุณภายใน 1-3 วันทำการ"
              : "สมัครสมาชิกเสร็จเรียบร้อย เข้าสู่ระบบเพื่อเริ่มช้อปได้เลย!"}
          </p>
          <Button asChild className="w-full">
            <Link href="/login">เข้าสู่ระบบ</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">RT</span>
              </div>
              <span className="text-2xl font-bold text-orange-500">RTShop</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-800 mt-4 mb-1">สมัครสมาชิก</h1>
          </div>

          {/* Account type selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {([
              { type: "buyer" as AccountType, label: "ผู้ซื้อ", desc: "ช้อปปิ้งออนไลน์", icon: User },
              { type: "seller" as AccountType, label: "ผู้ขาย", desc: "เปิดร้านค้า", icon: Store },
            ] as const).map(({ type, label, desc, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors",
                  accountType === type
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-100 hover:border-gray-200"
                )}
              >
                <Icon className={cn("h-6 w-6", accountType === type ? "text-orange-500" : "text-gray-400")} />
                <span className={cn("font-medium text-sm", accountType === type ? "text-orange-600" : "text-gray-700")}>
                  {label}
                </span>
                <span className="text-xs text-gray-400">{desc}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">ชื่อ-นามสกุล *</label>
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="ชื่อของคุณ"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">เบอร์โทรศัพท์ *</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">อีเมล *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">รหัสผ่าน *</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">ยืนยันรหัสผ่าน *</label>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                required
              />
            </div>

            {/* Seller-specific fields */}
            {accountType === "seller" && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Store className="h-4 w-4 text-orange-500" /> ข้อมูลร้านค้า
                </p>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">ชื่อร้านค้า *</label>
                  <Input
                    value={form.shopName}
                    onChange={(e) => update("shopName", e.target.value)}
                    placeholder="ชื่อร้านค้าของคุณ"
                    required={accountType === "seller"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">ธนาคาร *</label>
                    <select
                      value={form.bankName}
                      onChange={(e) => update("bankName", e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                      required={accountType === "seller"}
                    >
                      <option value="">เลือกธนาคาร</option>
                      <option>กรุงเทพ (BBL)</option>
                      <option>กสิกรไทย (KBANK)</option>
                      <option>ไทยพาณิชย์ (SCB)</option>
                      <option>กรุงไทย (KTB)</option>
                      <option>กรุงศรี (BAY)</option>
                      <option>ทีทีบี (TTB)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">เลขบัญชี *</label>
                    <Input
                      value={form.bankAccount}
                      onChange={(e) => update("bankAccount", e.target.value)}
                      placeholder="XXX-X-XXXXX-X"
                      required={accountType === "seller"}
                    />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    📋 หลังสมัครแล้ว ทีมงานจะตรวจสอบข้อมูลของคุณภายใน 1-3 วันทำการ
                    และแจ้งผลทางอีเมลที่ท่านให้ไว้
                  </p>
                </div>
              </div>
            )}

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreeTerms}
                onChange={(e) => update("agreeTerms", e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-orange-500"
                required
              />
              <span className="text-xs text-gray-600">
                ฉันยอมรับ{" "}
                <Link href="/terms" className="text-orange-500 hover:underline">ข้อกำหนดการใช้งาน</Link>
                {" "}และ{" "}
                <Link href="/privacy" className="text-orange-500 hover:underline">นโยบายความเป็นส่วนตัว</Link>
              </span>
            </label>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading || !form.agreeTerms}>
              {isLoading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
