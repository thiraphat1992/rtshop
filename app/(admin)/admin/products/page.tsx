"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Eye, EyeOff, Trash2, AlertTriangle,
  ChevronLeft, ChevronRight as ChevronRightIcon, Package,
} from "lucide-react";
import Image from "next/image";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Product {
  id:        string;
  name:      string;
  price:     number;
  stock:     number;
  sold:      number;
  isActive:  boolean;
  createdAt: string;
  shop:      { name: string };
  category:  { name: string } | null;
  images:    { url: string }[];
}

export default function AdminProductsPage() {
  const [products,       setProducts]       = useState<Product[]>([]);
  const [total,          setTotal]          = useState(0);
  const [totalPages,     setTotalPages]     = useState(1);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [searchInput,    setSearchInput]    = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter,    setStockFilter]    = useState("all");
  const [page,           setPage]           = useState(1);

  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : (data.categories ?? [])))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)                   params.set("q",        search);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (stockFilter !== "all")    params.set("stock",    stockFilter);
    params.set("page",  String(page));
    params.set("limit", "10");

    fetch(`/api/admin/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, categoryFilter, stockFilter, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isActive: !current } : p));
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("ลบสินค้านี้?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    } else {
      const data = await res.json();
      alert(data.error ?? "ลบไม่สำเร็จ");
    }
  };

  const activeCount  = products.filter((p) => p.isActive).length;
  const outCount     = products.filter((p) => p.stock === 0).length;
  const lowCount     = products.filter((p) => p.stock > 0 && p.stock <= 5).length;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="จัดการสินค้า" />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "ทั้งหมด",       value: total,       color: "text-gray-800"  },
            { label: "เปิดขาย",       value: activeCount, color: "text-green-600" },
            { label: "หมดสต็อก",     value: outCount,    color: "text-red-600"   },
            { label: "สต็อกใกล้หมด", value: lowCount,    color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
              placeholder="ค้นหาชื่อสินค้า หรือ ชื่อร้าน..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setCategoryFilter("all"); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                categoryFilter === "all" ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:border-orange-300"
              )}
            >
              ทั้งหมด
            </button>
            {categories.map((cat) => (
              <button key={cat.slug} onClick={() => { setCategoryFilter(cat.slug); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  categoryFilter === cat.slug ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:border-orange-300"
                )}>
                {cat.name}
              </button>
            ))}
          </div>
          <select
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
          >
            <option value="all">สต็อกทั้งหมด</option>
            <option value="low">ใกล้หมด (≤5)</option>
            <option value="out">หมดสต็อก</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">สินค้า</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">ร้านค้า</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 hidden md:table-cell">หมวดหมู่</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">ราคา</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">สต็อก</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 hidden lg:table-cell">ขายแล้ว</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">สถานะ</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                          {product.images[0] ? (
                            <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <Package className="h-5 w-5 text-gray-300 m-auto mt-2.5" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-1 max-w-xs">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-gray-600">{product.shop.name}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center hidden md:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {product.category?.name ?? "–"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-800">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={cn("text-sm font-semibold",
                        product.stock === 0 ? "text-red-500" :
                        product.stock <= 5  ? "text-amber-500" : "text-gray-700")}>
                        {product.stock === 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> หมด
                          </span>
                        ) : `${product.stock}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm text-gray-500 hidden lg:table-cell">
                      {product.sold.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium",
                        product.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500")}>
                        {product.isActive ? "เปิดขาย" : "ปิดอยู่"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => toggleActive(product.id, product.isActive)}
                          title={product.isActive ? "ปิดสินค้า" : "เปิดสินค้า"}
                          className={cn("p-1.5 rounded-lg transition-colors",
                            product.isActive
                              ? "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                              : "text-gray-400 hover:text-green-500 hover:bg-green-50")}>
                          {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => deleteProduct(product.id)} title="ลบสินค้า"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && products.length === 0 && (
            <div className="py-16 text-center">
              <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">ไม่พบสินค้า</p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">ทั้งหมด {total} รายการ · หน้า {page}/{totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn("w-8 h-8 text-xs rounded-lg transition-colors",
                    p === page ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100")}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
