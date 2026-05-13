import React, { Suspense } from "react";
import type { Metadata } from "next";
import ProductListingClient from "./ProductListingClient";

export const metadata: Metadata = {
  title: "ค้นหาสินค้า",
  description: "ค้นหาและเลือกชมสินค้าจากร้านค้าหลายหลาย",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoadingSkeleton />}>
      <ProductListingClient />
    </Suspense>
  );
}

function ProductsLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="w-60 flex-shrink-0 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl aspect-square animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
