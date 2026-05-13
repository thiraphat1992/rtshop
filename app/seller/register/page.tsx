"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store, TrendingUp, Users, Truck, Shield,
  ChevronRight, Star, CheckCircle, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

const benefits = [
  { icon: TrendingUp, title: "ยอดขายเติบโต",       desc: "เข้าถึงลูกค้ามากกว่า 1 ล้านคนบน RTShop",            color: "bg-blue-50 text-blue-600" },
  { icon: Users,     title: "ฐานลูกค้ากว้าง",      desc: "ผู้ซื้อที่ Active มากกว่า 500,000 คนต่อเดือน",      color: "bg-green-50 text-green-600" },
  { icon: Truck,     title: "ระบบขนส่งอัตโนมัติ",  desc: "ออกใบปะหน้าอัตโนมัติ รองรับ Flash, Kerry, J&T",     color: "bg-orange-50 text-orange-600" },
  { icon: Shield,    title: "ปลอดภัย มั่นใจ",       desc: "ระบบการรับเงินที่ปลอดภัย โอนเข้าบัญชีทุกสัปดาห์", color: "bg-purple-50 text-purple-600" },
];

const steps = [
  { num: "01", title: "กรอกข้อมูลร้านค้า",   desc: "ใส่ชื่อร้านและรายละเอียดสั้น ๆ" },
  { num: "02", title: "ตรวจสอบและอนุมัติ",    desc: "ทีมงานตรวจสอบภายใน 1-2 วันทำการ" },
  { num: "03", title: "เพิ่มสินค้าและขาย",    desc: "เริ่มเพิ่มสินค้าและรับออเดอร์ได้เลย!" },
];

function SellerLanding() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-red-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm mb-6">
            <Store className="h-4 w-4" /> เปิดร้านบน RTShop วันนี้ ฟรี!
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            เปิดร้านค้าออนไลน์<br />
            <span className="text-yellow-300">ง่าย ๆ ใน 3 ขั้นตอน</span>
          </h1>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            เข้าร่วมกับผู้ขายที่ไว้วางใจ RTShop ระบบจัดการร้านค้าครบครัน ขายง่าย กำไรดี
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8" asChild>
              <Link href="/login?redirect=/seller/register">
                เปิดร้านฟรีเลย <ChevronRight className="h-5 w-5 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8" asChild>
              <Link href="/login">ผู้ขายเข้าสู่ระบบ</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-900 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "50,000+", label: "ผู้ขายที่ Active" },
              { value: "1M+",     label: "ลูกค้าทั่วไทย" },
              { value: "0%",      label: "ค่าธรรมเนียมแรก 3 เดือน" },
              { value: "24/7",    label: "ทีมซัพพอร์ต" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-orange-400">{s.value}</div>
                <div className="text-sm text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-3">ทำไมต้องขายบน RTShop?</h2>
          <p className="text-center text-gray-500 mb-10">เครื่องมือครบครัน ช่วยให้ร้านค้าของคุณเติบโต</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${b.color} flex items-center justify-center mb-4`}>
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">เริ่มขายได้ง่าย ๆ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={step.num} className="text-center relative">
                <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
                {idx < steps.length - 1 && (
                  <ChevronRight className="absolute right-0 top-8 h-6 w-6 text-gray-300 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">พร้อมเริ่มขายแล้วหรือยัง?</h2>
          <p className="opacity-90 mb-8">สมัครฟรี ไม่มีค่าใช้จ่ายในการเปิดร้าน</p>
          <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-10" asChild>
            <Link href="/login?redirect=/seller/register">เปิดร้านเลย →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function SellerRegisterForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "เกิดข้อผิดพลาด");
      } else {
        window.location.href = "/seller/dashboard";
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">เปิดร้านค้าบน RTShop</h1>
            <p className="text-sm text-gray-500">สวัสดี {userName} — กรอกข้อมูลร้านค้าเพื่อเริ่มขาย</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "ฟรีค่าธรรมเนียม", sub: "เปิดร้านได้ทันที" },
              { label: "ลูกค้าหลายล้าน",   sub: "เข้าถึงได้ทุกที่" },
              { label: "จัดการง่าย",        sub: "ระบบ Seller Center" },
            ].map((b) => (
              <div key={b.label} className="text-center p-3 bg-orange-50 rounded-xl">
                <p className="text-xs font-semibold text-orange-600">{b.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{b.sub}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                ชื่อร้านค้า <span className="text-red-500">*</span>
              </label>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="เช่น Fashion World Store, เสื้อผ้าแบรนด์ไทย"
                required
                minLength={2}
              />
              <p className="text-xs text-gray-400 mt-1">ชื่อร้านจะแสดงในหน้าสินค้าสำหรับลูกค้า</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                คำอธิบายร้านค้า <span className="text-gray-400 font-normal">(ไม่จำเป็น)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="บอกลูกค้าเกี่ยวกับร้านค้าของคุณ..."
                className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-orange-500"
                maxLength={500}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">หลังจากสร้างร้านค้า:</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" /> ร้านจะอยู่ในสถานะ "รอการอนุมัติ" จาก Admin</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" /> คุณสามารถเพิ่มสินค้าได้ทันทีใน Seller Center</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" /> เมื่ออนุมัติแล้ว สินค้าจะแสดงให้ลูกค้าเห็น</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading || !shopName.trim()}>
              {isLoading ? "กำลังสร้างร้านค้า..." : "เปิดร้านค้าเลย"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SellerRegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Already a seller — go to dashboard
  if (user?.role === "SELLER" || user?.role === "ADMIN") {
    if (typeof window !== "undefined") router.replace("/seller/dashboard");
    return null;
  }

  // Logged-in buyer — show registration form
  if (user) {
    return <SellerRegisterForm userName={user.name} />;
  }

  // Guest — show marketing landing page
  return <SellerLanding />;
}
