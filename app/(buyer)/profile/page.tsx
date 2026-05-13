"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Heart, MapPin, Bell, LogOut, Edit3, Camera, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useWishlistStore } from "@/store/wishlist";

const menuItems = [
  { icon: Package, label: "คำสั่งซื้อของฉัน", href: "/orders" },
  { icon: Heart, label: "รายการโปรด", href: "/wishlist" },
  { icon: MapPin, label: "ที่อยู่จัดส่ง", href: "/profile/addresses" },
  { icon: Bell, label: "การแจ้งเตือน", href: "/profile/notifications" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const wishlistCount = useWishlistStore((s) => s.productIds.length);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);

  useEffect(() => {
    if (user) {
      setName(user.name);
      fetch("/api/orders")
        .then((r) => r.json())
        .then((d) => setOrderCount(Array.isArray(d.orders) ? d.orders.length : 0))
        .catch(() => {});
      fetch("/api/addresses")
        .then((r) => r.json())
        .then((d) => setAddressCount(Array.isArray(d.addresses) ? d.addresses.length : 0))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/profile");
    }
  }, [loading, user, router]);

  const handleSave = async () => {
    setSaveError("");
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.message ?? "เกิดข้อผิดพลาด");
      } else {
        setIsEditing(false);
        window.location.reload();
      }
    } catch {
      setSaveError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const joinYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-800 mb-6">โปรไฟล์ของฉัน</h1>

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.avatar ?? ""} />
                <AvatarFallback className="text-xl bg-orange-500 text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{user.name}</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">สมาชิกตั้งแต่ปี {joinYear}</p>
            </div>
            <button
              onClick={() => { setIsEditing(!isEditing); setSaveError(""); }}
              className="ml-auto p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-orange-500 transition-colors"
            >
              <Edit3 className="h-5 w-5" />
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                  {saveError}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">ชื่อ-นามสกุล</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">เบอร์โทรศัพท์</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="เบอร์โทรศัพท์" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">อีเมล</label>
                <Input value={user.email ?? ""} disabled className="bg-gray-50 text-gray-400" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setIsEditing(false); setSaveError(""); }}>
                  ยกเลิก
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "ชื่อ-นามสกุล", value: user.name },
                { label: "อีเมล", value: user.email ?? "-" },
              ].map(({ label, value }) => (
                <div key={label} className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-sm font-medium text-gray-700">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "คำสั่งซื้อ", value: orderCount },
            { label: "รายการโปรด", value: wishlistCount },
            { label: "ที่อยู่", value: addressCount },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          {menuItems.map((item, idx) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors",
                idx < menuItems.length - 1 && "border-b border-gray-50"
              )}
            >
              <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
                <item.icon className="h-5 w-5 text-orange-500" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4" /> ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
