"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";

export default function WishlistPage() {
  const { productIds } = useWishlistStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productIds.length === 0) { setProducts([]); return; }
    setLoading(true);
    fetch(`/api/products?ids=${productIds.join(",")}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [productIds]);

  if (productIds.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Heart className="h-20 w-20 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มีรายการโปรด</h2>
        <p className="text-gray-400 mb-6">กดหัวใจบนสินค้าที่ชอบเพื่อบันทึกไว้</p>
        <Button asChild>
          <Link href="/products">
            <ShoppingBag className="h-4 w-4 mr-2" /> เลือกชมสินค้า
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">
            รายการโปรด <span className="text-orange-500">({productIds.length})</span>
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {productIds.map((id) => (
              <div key={id} className="bg-white rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">ไม่พบสินค้า</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
