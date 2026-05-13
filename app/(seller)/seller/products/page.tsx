"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Search, Edit2, Trash2, Eye, EyeOff,
  Package, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SellerTopbar from "@/components/seller/SellerTopbar";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  sold: number;
  isActive: boolean;
  createdAt: string;
  images: { url: string }[];
  category: { name: string } | null;
}

export default function SellerProductsPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [selected, setSelected]     = useState<string[]>([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", String(page));
    fetch(`/api/seller/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter((p) => {
    if (stockFilter === "low") return p.stock > 0 && p.stock <= 5;
    if (stockFilter === "out") return p.stock === 0;
    return true;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((p) => p.id));

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/seller/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p))
    );
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("ลบสินค้านี้?")) return;
    const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SellerTopbar title="จัดการสินค้า" />

      <div className="flex-1 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package className="h-4 w-4" />
            สินค้าทั้งหมด <span className="font-semibold text-gray-800">{total}</span> รายการ
          </div>
          <Button asChild>
            <Link href="/seller/products/new">
              <Plus className="h-4 w-4 mr-1.5" /> เพิ่มสินค้าใหม่
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="ค้นหาสินค้า หรือ SKU..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
          >
            <option value="all">สต็อกทั้งหมด</option>
            <option value="low">สต็อกใกล้หมด (≤5)</option>
            <option value="out">หมดสต็อก</option>
          </select>
          <Button size="sm" variant="outline" onClick={handleSearch}>ค้นหา</Button>
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-orange-700 font-medium">เลือก {selected.length} รายการ</span>
            <Button size="sm" variant="destructive" className="text-xs" onClick={() => setSelected([])}>
              ยกเลิก
            </Button>
          </div>
        )}

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
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="rounded accent-orange-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">สินค้า</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">ราคา</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">สต็อก</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 hidden lg:table-cell">ขายแล้ว</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">สถานะ</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded accent-orange-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                          {product.images[0] ? (
                            <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <Package className="h-6 w-6 text-gray-300 m-auto mt-3" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.sku ?? "–"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {product.category?.name ?? "–"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-sm font-semibold",
                        product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-amber-500" : "text-gray-700"
                      )}>
                        {product.stock === 0 ? (
                          <span className="flex items-center justify-end gap-1 text-red-500">
                            <AlertTriangle className="h-3.5 w-3.5" /> หมด
                          </span>
                        ) : `${product.stock} ชิ้น`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500 hidden lg:table-cell">
                      {product.sold.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={product.isActive ? "success" : "secondary"}>
                        {product.isActive ? "เปิดขาย" : "ปิดอยู่"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/seller/products/${product.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => toggleActive(product.id, product.isActive)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            product.isActive
                              ? "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                              : "text-gray-400 hover:text-green-500 hover:bg-green-50"
                          )}
                          title={product.isActive ? "ปิดสินค้า" : "เปิดสินค้า"}
                        >
                          {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">ไม่พบสินค้า</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">หน้า {page} / {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30 hover:bg-gray-50">
                  ก่อนหน้า
                </button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30 hover:bg-gray-50">
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
