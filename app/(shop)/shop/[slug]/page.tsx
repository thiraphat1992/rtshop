"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Store, Star, ShoppingBag, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";

interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  rating: number;
  totalSales: number;
  createdAt: string;
  _count: { products: number };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  rating: number;
  reviewCount: number;
  sold: number;
  stock: number;
  images: { url: string }[];
  category: { name: string };
  shop: { name: string; slug: string };
}

export default function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/shops/${slug}?page=${page}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setShop(data.shop);
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, page]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <Store className="h-16 w-16 text-gray-200" />
        <p className="text-xl font-semibold text-gray-600">ไม่พบร้านค้า</p>
        <Button asChild><Link href="/products">ดูสินค้าทั้งหมด</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shop banner */}
      <div className="relative h-48 bg-gradient-to-r from-orange-400 to-orange-600 overflow-hidden">
        {shop.banner && (
          <Image src={shop.banner} alt={shop.name} fill className="object-cover" priority sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Shop info */}
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm -mt-8 p-6 mb-6 relative">
          <div className="flex items-start gap-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-orange-100 border-4 border-white shadow-md flex-shrink-0 -mt-10">
              {shop.logo ? (
                <Image src={shop.logo} alt={shop.name} fill className="object-cover" sizes="80px" />
              ) : (
                <Store className="h-10 w-10 text-orange-400 m-auto mt-5" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <h1 className="text-xl font-bold text-gray-800">{shop.name}</h1>
              {shop.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{shop.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  {shop.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-4 w-4" />
                  ขายแล้ว {shop.totalSales.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {shop._count.products} สินค้า
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">สินค้าทั้งหมด ({total})</h2>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center shadow-sm">
            <Package className="h-16 w-16 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">ยังไม่มีสินค้า</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 mb-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                  p === page ? "bg-orange-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
