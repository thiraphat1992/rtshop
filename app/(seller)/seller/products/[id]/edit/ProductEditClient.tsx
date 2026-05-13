"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package, DollarSign, Weight, Save, ArrowLeft,
  Upload, X, Plus, Image as ImageIcon, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SellerTopbar from "@/components/seller/SellerTopbar";
import { cn } from "@/lib/utils";

interface Category { id: string; name: string; icon: string }
interface Variant {
  id: string; name: string; value: string;
  price: string; stock: string; sku: string;
}

export default function ProductEditClient({ productId }: { productId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories,   setCategories]   = useState<Category[]>([]);
  const [images,       setImages]       = useState<string[]>([]);
  const [uploading,    setUploading]    = useState(false);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [error,        setError]        = useState("");
  const [hasVariants,  setHasVariants]  = useState(false);
  const [variants,     setVariants]     = useState<Variant[]>([]);

  const [form, setForm] = useState({
    name: "", description: "", categoryId: "",
    price: "", comparePrice: "", stock: "", sku: "",
    weight: "", width: "", height: "", depth: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/seller/products/${productId}`).then((r) => r.json()),
    ]).then(([cats, product]) => {
      if (Array.isArray(cats)) setCategories(cats);
      if (product && !product.error) {
        setForm({
          name:         product.name ?? "",
          description:  product.description ?? "",
          categoryId:   product.categoryId ?? "",
          price:        String(Number(product.price) ?? ""),
          comparePrice: product.comparePrice ? String(Number(product.comparePrice)) : "",
          stock:        String(product.stock ?? ""),
          sku:          product.sku ?? "",
          weight:       product.weight ? String(product.weight) : "",
          width:        product.width  ? String(product.width)  : "",
          height:       product.height ? String(product.height) : "",
          depth:        product.depth  ? String(product.depth)  : "",
        });
        setImages(product.images?.map((img: { url: string }) => img.url) ?? []);
        if (product.variants?.length > 0) {
          setHasVariants(true);
          setVariants(product.variants.map((v: { id: string; name: string; value: string; price?: number; stock: number; sku?: string }) => ({
            id:    v.id,
            name:  v.name,
            value: v.value,
            price: v.price ? String(Number(v.price)) : "",
            stock: String(v.stock),
            sku:   v.sku ?? "",
          })));
        }
      }
    })
    .catch(() => setError("โหลดข้อมูลสินค้าไม่สำเร็จ"))
    .finally(() => setIsLoading(false));
  }, [productId]);

  const update = (key: keyof typeof form, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const addVariant = () =>
    setVariants((prev) => [...prev, { id: Date.now().toString(), name: "ไซส์", value: "", price: "", stock: "", sku: "" }]);

  const removeVariant = (id: string) =>
    setVariants((prev) => prev.filter((v) => v.id !== id));

  const updateVariant = (id: string, key: keyof Variant, val: string) =>
    setVariants((prev) => prev.map((v) => v.id === id ? { ...v, [key]: val } : v));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "อัพโหลดไม่สำเร็จ"); break; }
        setImages((prev) => prev.length >= 8 ? prev : [...prev, data.url]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const body: Record<string, unknown> = {
        name:        form.name.trim(),
        description: form.description.trim(),
        categoryId:  form.categoryId,
        price:       Number(form.price),
        stock:       Number(form.stock),
        images,
      };
      if (form.comparePrice) body.comparePrice = Number(form.comparePrice);
      else body.comparePrice = null;
      if (form.sku)    body.sku    = form.sku;
      if (form.weight) body.weight = Number(form.weight);
      if (form.width)  body.width  = Number(form.width);
      if (form.height) body.height = Number(form.height);
      if (form.depth)  body.depth  = Number(form.depth);

      const res = await fetch(`/api/seller/products/${productId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "บันทึกไม่สำเร็จ"); return; }
      router.push("/seller/products");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SellerTopbar title="แก้ไขสินค้า" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SellerTopbar title="แก้ไขสินค้า" />

      <form onSubmit={handleSubmit} className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">แก้ไขสินค้า</h2>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-5">
            {/* Basic info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-500" /> ข้อมูลพื้นฐาน
              </h3>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">ชื่อสินค้า *</label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">รายละเอียดสินค้า *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">หมวดหมู่ *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => update("categoryId", e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-orange-500" /> รูปภาพสินค้า
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {images.length < 8 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-orange-400 hover:bg-orange-50 transition-colors text-gray-400 hover:text-orange-500 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                    <span className="text-xs font-medium">{uploading ? "กำลังอัพโหลด..." : "อัพโหลด"}</span>
                  </button>
                )}
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-medium">หลัก</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-500" /> ราคาและสต็อก
              </h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setHasVariants(!hasVariants)} className={cn("w-10 h-6 rounded-full transition-colors relative", hasVariants ? "bg-orange-500" : "bg-gray-200")}>
                  <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-transform", hasVariants ? "translate-x-5" : "translate-x-1")} />
                </div>
                <span className="text-sm font-medium text-gray-700">มีตัวเลือกสินค้า (เช่น ไซส์, สี)</span>
              </label>

              {!hasVariants ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">ราคาขาย (บาท) *</label>
                    <Input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" min="0" step="0.01" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">ราคาเดิม (บาท)</label>
                    <Input type="number" value={form.comparePrice} onChange={(e) => update("comparePrice", e.target.value)} placeholder="0.00" min="0" step="0.01" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">จำนวนสต็อก *</label>
                    <Input type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)} placeholder="0" min="0" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">รหัส SKU</label>
                    <Input value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="SKU-001" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-500 px-2">
                    <span>ชื่อตัวเลือก</span><span>ค่า</span><span>ราคา (บาท)</span><span>สต็อก</span><span>SKU</span>
                  </div>
                  {variants.map((v) => (
                    <div key={v.id} className="grid grid-cols-5 gap-2 items-center bg-gray-50 rounded-xl p-2">
                      <Input value={v.name} onChange={(e) => updateVariant(v.id, "name", e.target.value)} className="text-xs h-8" />
                      <Input value={v.value} onChange={(e) => updateVariant(v.id, "value", e.target.value)} placeholder="เช่น M" className="text-xs h-8" />
                      <Input type="number" value={v.price} onChange={(e) => updateVariant(v.id, "price", e.target.value)} placeholder="ราคา" className="text-xs h-8" />
                      <Input type="number" value={v.stock} onChange={(e) => updateVariant(v.id, "stock", e.target.value)} placeholder="สต็อก" className="text-xs h-8" />
                      <div className="flex gap-1">
                        <Input value={v.sku} onChange={(e) => updateVariant(v.id, "sku", e.target.value)} placeholder="SKU" className="text-xs h-8 flex-1" />
                        <button type="button" onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addVariant} className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
                    <Plus className="h-4 w-4" /> เพิ่มตัวเลือก
                  </button>
                </div>
              )}
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Weight className="h-4 w-4 text-orange-500" /> น้ำหนักและขนาด (สำหรับคำนวณค่าส่ง)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">น้ำหนัก (กก.)</label>
                  <Input type="number" step="0.1" min="0" value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="0.5" />
                </div>
              </div>
              <p className="text-xs font-medium text-gray-600 mt-2">ขนาดพัสดุ (ซม.)</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">กว้าง</label>
                  <Input type="number" step="0.1" min="0" value={form.width} onChange={(e) => update("width", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ยาว</label>
                  <Input type="number" step="0.1" min="0" value={form.height} onChange={(e) => update("height", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">สูง</label>
                  <Input type="number" step="0.1" min="0" value={form.depth} onChange={(e) => update("depth", e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-4">สรุปสินค้า</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>ชื่อสินค้า</span>
                  <span className="font-medium text-gray-800 text-right max-w-36 truncate">{form.name || "–"}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ราคาขาย</span>
                  <span className="font-bold text-orange-500">{form.price ? `฿${Number(form.price).toLocaleString()}` : "–"}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>สต็อก</span>
                  <span className="font-medium">{form.stock ? `${form.stock} ชิ้น` : "–"}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>รูปภาพ</span>
                  <span className="font-medium">{images.length} รูป</span>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Button type="submit" className="w-full" disabled={isSaving || uploading}>
                  {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> กำลังบันทึก...</> : <><Save className="h-4 w-4 mr-2" /> บันทึกการแก้ไข</>}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>ยกเลิก</Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
