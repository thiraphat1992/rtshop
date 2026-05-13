"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    rating: number;
    sold: number;
    stock: number;
    images: { url: string; altText?: string }[];
    shop: { id: string; name: string };
    category?: { name: string };
  };
  className?: string;
  priority?: boolean;
}

export default function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggle, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);
  const discount = product.comparePrice ? calculateDiscount(product.price, product.comparePrice) : 0;
  const mainImage = product.images[0]?.url ?? "/placeholder-product.png";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: mainImage,
        stock: product.stock,
        shopName: product.shop.name,
        shopId: product.shop.id,
      },
      1
    );
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <Link href={`/products/${product.slug}`} className={cn("group block", className)}>
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={mainImage}
            alt={product.images[0]?.altText ?? product.name}
            fill
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">สินค้าหมด</span>
            </div>
          )}

          {/* Actions overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleWishlist}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors",
                inWishlist ? "bg-red-500 text-white" : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-400 mb-1 line-clamp-1">{product.shop.name}</p>
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-500 font-bold text-base">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-gray-400 text-xs line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Rating & Sold */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-500">{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-gray-400">ขายแล้ว {product.sold.toLocaleString()}</span>
          </div>

          {/* Add to cart */}
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="w-full mt-3 h-8 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              เพิ่มในตะกร้า
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
