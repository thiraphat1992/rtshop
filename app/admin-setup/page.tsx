"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSetupPage() {
  const [setupDone, setSetupDone] = useState<boolean | null>(null);
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  useEffect(() => {
    fetch("/api/admin/setup")
      .then((r) => r.json())
      .then((d) => setSetupDone(d.setupDone))
      .catch(() => setSetupDone(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  if (setupDone === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">RTShop Admin Setup</h1>
          <p className="text-gray-400 text-sm mt-1">ตั้งค่าบัญชีผู้ดูแลระบบ</p>
        </div>

        {setupDone ? (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-white font-bold text-lg mb-2">ตั้งค่าเรียบร้อยแล้ว</h2>
            <p className="text-gray-400 text-sm mb-6">บัญชีแอดมินถูกสร้างไว้แล้ว กรุณาเข้าสู่ระบบ</p>
            <Link href="/login?redirect=/admin/dashboard">
              <Button className="w-full">เข้าสู่ระบบ Admin</Button>
            </Link>
          </div>
        ) : success ? (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-white font-bold text-lg mb-2">สร้างบัญชีแอดมินสำเร็จ!</h2>
            <p className="text-gray-400 text-sm mb-6">ตอนนี้คุณสามารถเข้าสู่ระบบด้วยบัญชีนี้ได้</p>
            <Link href="/login?redirect=/admin/dashboard">
              <Button className="w-full">เข้าสู่ระบบ Admin</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-8">
            <p className="text-gray-400 text-xs text-center mb-6">
              สร้างบัญชีแอดมินครั้งแรก · ใช้ได้ครั้งเดียวเท่านั้น
            </p>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">ชื่อแอดมิน</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น Admin RTShop"
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">อีเมล</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">หากมีบัญชีนี้อยู่แล้ว จะอัปเกรดเป็นแอดมิน</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">รหัสผ่าน</label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-orange-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? "กำลังสร้าง..." : "สร้างบัญชีแอดมิน"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
