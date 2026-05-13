"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Plus, Edit2, Trash2, Star, Save, X, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Address {
  id:            string;
  label:         string;
  recipientName: string;
  phone:         string;
  addressLine:   string;
  district:      string;
  subDistrict:   string;
  province:      string;
  postalCode:    string;
  isDefault:     boolean;
}

const emptyForm = {
  label:         "บ้าน",
  recipientName: "",
  phone:         "",
  addressLine:   "",
  district:      "",
  subDistrict:   "",
  province:      "",
  postalCode:    "",
  isDefault:     false,
};

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [fetching,  setFetching]  = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState(emptyForm);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/profile/addresses");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/addresses")
      .then((r) => r.json())
      .then((data) => setAddresses(data.addresses ?? []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setEditId(addr.id);
    setForm({
      label:         addr.label,
      recipientName: addr.recipientName,
      phone:         addr.phone,
      addressLine:   addr.addressLine,
      district:      addr.district,
      subDistrict:   addr.subDistrict,
      province:      addr.province,
      postalCode:    addr.postalCode,
      isDefault:     addr.isDefault,
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.recipientName || !form.phone || !form.addressLine || !form.province || !form.postalCode) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setSaving(true);
    setError("");

    const url    = editId ? `/api/addresses/${editId}` : "/api/addresses";
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const data = await res.json();
      const saved: Address = data.address;

      if (form.isDefault) {
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === saved.id }))
        );
      }

      if (editId) {
        setAddresses((prev) => prev.map((a) => a.id === editId ? saved : a));
      } else {
        setAddresses((prev) => form.isDefault
          ? [saved, ...prev.map((a) => ({ ...a, isDefault: false }))]
          : [...prev, saved]
        );
      }

      setShowForm(false);
    } else {
      const data = await res.json();
      setError(data.message ?? "เกิดข้อผิดพลาด");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบที่อยู่นี้?")) return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const setDefault = async (id: string) => {
    const res = await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) {
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">ที่อยู่จัดส่ง</h1>
          <Button onClick={openAdd} className="ml-auto gap-2" size="sm">
            <Plus className="h-4 w-4" /> เพิ่มที่อยู่
          </Button>
        </div>

        {/* Add / Edit form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                {editId ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ป้ายกำกับ</label>
                <div className="flex gap-2">
                  {["บ้าน", "ที่ทำงาน", "อื่นๆ"].map((lbl) => (
                    <button
                      key={lbl}
                      onClick={() => setForm({ ...form, label: lbl })}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors",
                        form.label === lbl ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:border-orange-300"
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อผู้รับ *</label>
                  <Input value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} placeholder="ชื่อ-นามสกุล" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">เบอร์โทร *</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0XX-XXX-XXXX" type="tel" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ที่อยู่ (บ้านเลขที่, ถนน) *</label>
                <Input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} placeholder="บ้านเลขที่ / หมู่บ้าน / ถนน" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ตำบล/แขวง</label>
                  <Input value={form.subDistrict} onChange={(e) => setForm({ ...form, subDistrict: e.target.value })} placeholder="ตำบล/แขวง" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">อำเภอ/เขต</label>
                  <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="อำเภอ/เขต" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">จังหวัด *</label>
                  <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="จังหวัด" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">รหัสไปรษณีย์ *</label>
                  <Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="XXXXX" maxLength={5} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm text-gray-700">ตั้งเป็นที่อยู่หลัก</span>
              </label>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>ยกเลิก</Button>
                <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Address list */}
        {addresses.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <MapPin className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">ยังไม่มีที่อยู่</p>
            <p className="text-sm text-gray-400 mt-1">เพิ่มที่อยู่จัดส่งเพื่อความสะดวกในการสั่งซื้อ</p>
            <Button onClick={openAdd} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> เพิ่มที่อยู่
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className={cn(
                "bg-white rounded-2xl shadow-sm p-5 border-2 transition-colors",
                addr.isDefault ? "border-orange-400" : "border-transparent"
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={cn(
                      "p-2 rounded-lg",
                      addr.isDefault ? "bg-orange-100" : "bg-gray-100"
                    )}>
                      <MapPin className={cn("h-4 w-4", addr.isDefault ? "text-orange-500" : "text-gray-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-orange-400" /> หลัก
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{addr.recipientName}</p>
                      <p className="text-xs text-gray-400">{addr.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!addr.isDefault && (
                      <button onClick={() => setDefault(addr.id)} title="ตั้งเป็นหลัก"
                        className="p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors text-xs">
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => openEdit(addr)} title="แก้ไข"
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(addr.id)} title="ลบ"
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pl-12 text-sm text-gray-600 leading-relaxed">
                  {addr.addressLine}
                  {addr.subDistrict && ` ต.${addr.subDistrict}`}
                  {addr.district && ` อ.${addr.district}`}
                  {addr.province && ` จ.${addr.province}`}
                  {addr.postalCode && ` ${addr.postalCode}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
