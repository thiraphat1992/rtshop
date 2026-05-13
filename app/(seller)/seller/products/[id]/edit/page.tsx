import React from "react";
import ProductEditClient from "./ProductEditClient";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditClient productId={id} />;
}
