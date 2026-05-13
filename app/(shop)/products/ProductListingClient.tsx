"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Grid3X3, List, X } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const priceRanges = [
  { label: "ทุกราคา",         min: undefined, max: undefined },
  { label: "ต่ำกว่า 100 บาท", min: 0,         max: 100 },
  { label: "100 – 500 บาท",   min: 100,        max: 500 },
  { label: "500 – 1,000 บาท", min: 500,        max: 1000 },
  { label: "1,000 – 5,000 บาท", min: 1000,     max: 5000 },
  { label: "มากกว่า 5,000 บาท", min: 5000,     max: undefined },
];

const sortOptions = [
  { label: "แนะนำ",       value: "recommended" },
  { label: "สินค้าใหม่",  value: "newest" },
  { label: "ขายดีที่สุด", value: "best_selling" },
  { label: "ราคาต่ำ→สูง", value: "price_asc" },
  { label: "ราคาสูง→ต่ำ", value: "price_desc" },
  { label: "คะแนนสูงสุด", value: "rating" },
];

export default function ProductListingClient() {
  const searchParams = useSearchParams();
  const query     = searchParams.get("q") ?? "";
  const catParam  = searchParams.get("category") ?? "";

  const [products,    setProducts]    = useState<any[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [categories,  setCategories]  = useState<{ id: string; name: string; slug: string }[]>([]);

  const [sortBy,          setSortBy]          = useState("recommended");
  const [selectedCategory, setSelectedCategory] = useState(catParam);
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [viewMode,        setViewMode]        = useState<"grid" | "list">("grid");
  const [showFilter,      setShowFilter]      = useState(false);
  const [page,            setPage]            = useState(1);

  // Sync URL params → local state when navigating between category links
  useEffect(() => {
    setSelectedCategory(catParam);
    setPage(1);
  }, [catParam]);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Fetch products whenever filters change
  const fetchProducts = useCallback(() => {
    setLoading(true);
    const range = priceRanges[selectedPriceRange];
    const params = new URLSearchParams();
    if (query)             params.set("q",        query);
    if (selectedCategory)  params.set("category", selectedCategory);
    if (range.min !== undefined) params.set("minPrice", String(range.min));
    if (range.max !== undefined) params.set("maxPrice", String(range.max));
    params.set("sort",  sortBy);
    params.set("page",  String(page));
    params.set("limit", "20");

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query, selectedCategory, selectedPriceRange, sortBy, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters change (except page itself)
  useEffect(() => {
    setPage(1);
  }, [query, selectedCategory, selectedPriceRange, sortBy]);

  const activeFiltersCount = [selectedCategory !== "", selectedPriceRange !== 0].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedPriceRange(0);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {query ? (
            <h1 className="text-lg font-semibold text-gray-800">
              ผลการค้นหา &ldquo;<span className="text-orange-500">{query}</span>&rdquo;
              <span className="text-sm text-gray-400 font-normal ml-2">({total} รายการ)</span>
            </h1>
          ) : selectedCategory ? (
            <h1 className="text-lg font-semibold text-gray-800">
              {categories.find((c) => c.slug === selectedCategory)?.name ?? selectedCategory}
              <span className="text-sm text-gray-400 font-normal ml-2">({total} รายการ)</span>
            </h1>
          ) : (
            <h1 className="text-lg font-semibold text-gray-800">
              สินค้าทั้งหมด
              <span className="text-sm text-gray-400 font-normal ml-2">({total} รายการ)</span>
            </h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-2", viewMode === "grid" ? "bg-orange-500 text-white" : "hover:bg-gray-50 text-gray-600")}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-2", viewMode === "list" ? "bg-orange-500 text-white" : "hover:bg-gray-50 text-gray-600")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors md:hidden",
              showFilter ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            ตัวกรอง
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filter */}
        <aside className={cn(
          "w-60 flex-shrink-0 space-y-6",
          "hidden md:block",
          showFilter && "!block fixed inset-0 z-40 bg-white p-6 overflow-y-auto md:relative md:p-0 md:z-auto"
        )}>
          <div className="flex items-center justify-between md:hidden">
            <h2 className="font-semibold">ตัวกรอง</h2>
            <button onClick={() => setShowFilter(false)}><X className="h-5 w-5" /></button>
          </div>

          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> ล้างตัวกรองทั้งหมด
            </button>
          )}

          {/* Category */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">หมวดหมู่</h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCategory("")}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedCategory === "" ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                ทั้งหมด
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedCategory === cat.slug ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">ช่วงราคา</h3>
            <div className="space-y-1.5">
              {priceRanges.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPriceRange(idx)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedPriceRange === idx ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                : "flex flex-col gap-3"
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl animate-pulse aspect-square" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-lg mb-2">ไม่พบสินค้า</p>
              <p className="text-gray-300 text-sm">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
            </div>
          ) : (
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                : "flex flex-col gap-3"
            )}>
              {products.map((product) => (
                viewMode === "grid" ? (
                  <ProductCard key={product.id} product={product} />
                ) : (
                  <ProductCard key={product.id} product={product} className="flex-row" />
                )
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-sm"
              >
                ←
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                      page === p ? "bg-orange-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-sm"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
