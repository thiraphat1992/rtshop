import React from "react";
import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";
import ProductSection from "@/components/home/ProductSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `สินค้า - ${slug}`,
    description: "รายละเอียดสินค้าจาก RTShop",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <ProductDetailClient slug={slug} />
      <div className="container mx-auto px-4 pb-8">
        <ProductSection title="สินค้าที่คุณอาจสนใจ" href="/products" />
      </div>
    </>
  );
}
