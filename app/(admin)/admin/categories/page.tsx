"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Tag, Save, X, GripVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { cn } from "@/lib/utils";

interface Category {
  id:        string;
  name:      string;
  slug:      string;
  icon:      string;
  isActive:  boolean;
  sortOrder: number;
  _count:    { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editForm,   setEditForm]   = useState({ name: "", slug: "", icon: "" });
  const [showAdd,    setShowAdd]    = useState(false);
  const [addForm,    setAddForm]    = useState({ name: "", slug: "", icon: "📦" });
  const [saving,     setSaving]     = useState(false);
  const [seeding,    setSeeding]    = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : (data.categories ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, icon: cat.icon });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => c.id === id ? { ...c, ...updated } : c));
      setEditId(null);
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) {
      setCategories((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !current } : c));
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("ลบหมวดหมู่นี้?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      const data = await res.json();
      alert(data.error ?? "ลบไม่สำเร็จ");
    }
  };

  const seedCategories = async () => {
    if (!confirm("เพิ่มหมวดหมู่ตัวอย่าง 11 รายการ?")) return;
    setSeeding(true);
    const res = await fetch("/api/admin/categories/seed", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      fetchCategories();
    }
    setSeeding(false);
  };

  const addCategory = async () => {
    if (!addForm.name) return;
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      const created = await res.json();
      setCategories((prev) => [...prev, created]);
      setAddForm({ name: "", slug: "", icon: "📦" });
      setShowAdd(false);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="จัดการหมวดหมู่" />

      <div className="flex-1 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Tag className="h-4 w-4" />
            หมวดหมู่ทั้งหมด <span className="font-semibold text-gray-800">{categories.length}</span> รายการ
          </div>
          <div className="flex gap-2">
            {categories.length === 0 && (
              <Button variant="outline" onClick={seedCategories} disabled={seeding} className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50">
                <Sparkles className="h-4 w-4" /> {seeding ? "กำลังเพิ่ม..." : "เพิ่มหมวดหมู่ตัวอย่าง"}
              </Button>
            )}
            <Button onClick={() => setShowAdd(true)} className="gap-2">
              <Plus className="h-4 w-4" /> เพิ่มหมวดหมู่
            </Button>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4">เพิ่มหมวดหมู่ใหม่</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ไอคอน (Emoji)</label>
                <Input value={addForm.icon} onChange={(e) => setAddForm({ ...addForm, icon: e.target.value })} className="text-center text-lg h-10" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อหมวดหมู่ *</label>
                <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="เช่น เครื่องสำอาง" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Slug (URL)</label>
                <Input value={addForm.slug} onChange={(e) => setAddForm({ ...addForm, slug: e.target.value })} placeholder="เว้นว่างเพื่อใช้อัตโนมัติ" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={addCategory} className="gap-2" disabled={saving || !addForm.name}>
                <Save className="h-4 w-4" /> บันทึก
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 w-10"></th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">หมวดหมู่</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Slug</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 hidden md:table-cell">สินค้า</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">สถานะ</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-300">
                      <GripVertical className="h-4 w-4" />
                    </td>
                    <td className="px-5 py-3.5">
                      {editId === cat.id ? (
                        <div className="flex items-center gap-2">
                          <Input value={editForm.icon} onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })} className="w-12 text-center text-lg h-8" />
                          <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-8 flex-1" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {editId === cat.id ? (
                        <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} className="h-8 text-xs font-mono" />
                      ) : (
                        <span className="text-xs font-mono text-gray-400">{cat.slug}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm text-gray-500 hidden md:table-cell">
                      {cat._count?.products ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => toggleActive(cat.id, cat.isActive)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                          cat.isActive
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        {cat.isActive ? "เปิดใช้งาน" : "ปิดอยู่"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {editId === cat.id ? (
                          <>
                            <button onClick={() => saveEdit(cat.id)} disabled={saving}
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                              <Save className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteCategory(cat.id)}
                              disabled={(cat._count?.products ?? 0) > 0}
                              title={(cat._count?.products ?? 0) > 0 ? "มีสินค้าอยู่ในหมวดหมู่นี้" : "ลบ"}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && categories.length === 0 && (
            <div className="py-12 text-center text-gray-400">ยังไม่มีหมวดหมู่</div>
          )}
        </div>
      </div>
    </div>
  );
}
