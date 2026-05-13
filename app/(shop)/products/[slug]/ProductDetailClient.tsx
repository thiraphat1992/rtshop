"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart, ShoppingCart, Star, Truck, Shield, RotateCcw,
  Store, ChevronRight, Minus, Plus, MessageCircle, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useChatStore } from "@/store/chat";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  stock: number;
  price: number | null;
}

interface ProductImage {
  url: string;
  altText: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: string | null;
  createdAt: string;
  user: { name: string; avatar: string | null };
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
  description: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  shop: { id: string; name: string; slug: string; logo: string | null; rating: number; totalSales: number };
  category: { name: string; slug: string };
  reviews: Review[];
}

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [variantError, setVariantError] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { toggle, isInWishlist } = useWishlistStore();
  const openWithShop = useChatStore((s) => s.openWithShop);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => setProduct(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
        <p className="text-xl font-semibold text-gray-600">ไม่พบสินค้า</p>
        <Button asChild><Link href="/products">ดูสินค้าทั้งหมด</Link></Button>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discount = calculateDiscount(product.price, product.comparePrice ?? 0);
  const images = product.images.length > 0
    ? product.images
    : [{ url: "https://picsum.photos/seed/default/600/600", altText: product.name }];

  const selectedVariantObj = product.variants.find((v) => v.id === selectedVariant);
  const effectiveStock = product.variants.length > 0
    ? (selectedVariantObj?.stock ?? 0)
    : product.stock;
  const needsVariant = product.variants.length > 0 && !selectedVariant;
  const outOfStock = needsVariant ? false : effectiveStock === 0;

  const doAddToCart = (): boolean => {
    if (needsVariant) {
      setVariantError(true);
      setTimeout(() => setVariantError(false), 2500);
      return false;
    }
    addItem(
      {
        id: product.id,
        name: product.name,
        price: selectedVariantObj?.price != null ? Number(selectedVariantObj.price) : Number(product.price),
        image: images[0].url,
        stock: effectiveStock,
        shopName: product.shop.name,
        shopId: product.shop.id,
      },
      quantity,
      selectedVariant ?? undefined,
      selectedVariantObj?.value
    );
    return true;
  };

  const handleAddToCart = () => {
    if (!doAddToCart()) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!doAddToCart()) return;
    router.push("/checkout");
  };

  const reviewImages = (review: Review): string[] => {
    if (!review.images) return [];
    try { return JSON.parse(review.images); } catch { return []; }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-orange-500">หน้าแรก</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/products" className="hover:text-orange-500">สินค้าทั้งหมด</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/products?category=${product.category.slug}`} className="hover:text-orange-500">
            {product.category.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-800 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
              <Image
                src={images[selectedImage]?.url ?? images[0].url}
                alt={images[selectedImage]?.altText ?? product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {discount > 0 && (
                <Badge variant="destructive" className="absolute top-4 left-4 text-sm px-3 py-1">
                  -{discount}%
                </Badge>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      "relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors",
                      selectedImage === idx ? "border-orange-500" : "border-transparent hover:border-gray-300"
                    )}
                  >
                    <Image src={img.url} alt={img.altText ?? ""} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{product.category.name}</Badge>
                {outOfStock && !needsVariant ? (
                  <Badge variant="destructive">สินค้าหมด</Badge>
                ) : !needsVariant && effectiveStock > 0 ? (
                  <Badge variant="success">มีสินค้า</Badge>
                ) : null}
              </div>
              <h1 className="text-xl font-bold text-gray-800 leading-relaxed">{product.name}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 py-3 border-y border-gray-100">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                    )}
                  />
                ))}
                <span className="font-semibold text-orange-500 ml-1">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-400">{product.reviewCount.toLocaleString()} รีวิว</span>
              <span className="text-sm text-gray-400">ขายแล้ว {product.sold.toLocaleString()}</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-orange-500">{formatPrice(Number(product.price))}</span>
              {product.comparePrice && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(Number(product.comparePrice))}</span>
              )}
              {discount > 0 && (
                <span className="text-sm bg-red-50 text-red-500 px-2 py-0.5 rounded font-medium">
                  ประหยัด {formatPrice(Number(product.comparePrice!) - Number(product.price))}
                </span>
              )}
            </div>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {product.variants[0]?.name ?? "ตัวเลือก"}:{" "}
                  <span className={cn("font-semibold", selectedVariant ? "text-orange-500" : variantError ? "text-red-500" : "text-gray-400")}>
                    {selectedVariantObj?.value ?? (variantError ? "⚠ กรุณาเลือกตัวเลือก" : "กรุณาเลือก")}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVariant(v.id); setVariantError(false); }}
                      disabled={v.stock === 0}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                        selectedVariant === v.id
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : v.stock === 0
                            ? "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                            : variantError
                              ? "border-red-300 text-gray-700 hover:border-orange-300"
                              : "border-gray-200 text-gray-700 hover:border-orange-300"
                      )}
                    >
                      {v.value}
                      {v.stock === 0 && <span className="ml-1 text-[10px]">หมด</span>}
                    </button>
                  ))}
                </div>
                {variantError && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
                    <AlertCircle className="h-3 w-3" /> กรุณาเลือกตัวเลือกสินค้าก่อน
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">จำนวน:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 hover:bg-gray-50 flex items-center justify-center transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(effectiveStock || 1, q + 1))}
                  disabled={effectiveStock > 0 && quantity >= effectiveStock}
                  className="w-10 h-10 hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {effectiveStock > 0 && (
                <span className="text-sm text-gray-400">
                  มีสินค้า {effectiveStock} ชิ้น
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={outOfStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {addedToCart ? "เพิ่มแล้ว ✓" : "ใส่ตะกร้า"}
              </Button>
              <Button
                onClick={handleBuyNow}
                size="lg"
                className="flex-1"
                disabled={outOfStock}
              >
                ซื้อเลย
              </Button>
              <button
                onClick={() => toggle(product.id)}
                className={cn(
                  "w-12 h-12 rounded-xl border flex items-center justify-center transition-colors",
                  inWishlist ? "bg-red-50 border-red-200 text-red-500" : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500"
                )}
              >
                <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
              </button>
            </div>

            {/* Shipping info */}
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              {[
                { icon: Truck, text: "จัดส่งภายใน 1-3 วันทำการ | ฟรีค่าส่งเมื่อซื้อครบ 299 บาท" },
                { icon: Shield, text: "รับประกันสินค้าของแท้ 100% จากร้านค้าที่ผ่านการตรวจสอบ" },
                { icon: RotateCcw, text: "คืนสินค้าได้ภายใน 15 วัน หากสินค้าไม่ตรงปก" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shop Info — Shopee style */}
        <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="p-5 flex items-start gap-4">
            {/* Logo */}
            <Link href={`/shop/${product.shop.slug}`} className="flex-shrink-0">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-orange-50 border border-orange-100">
                {product.shop.logo ? (
                  <Image src={product.shop.logo} alt={product.shop.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="h-7 w-7 text-orange-400" />
                  </div>
                )}
              </div>
            </Link>

            {/* Info + Buttons */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">{product.shop.name}</h3>
                  <p className="text-xs text-green-500 font-medium mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                    ออนไลน์อยู่
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white h-8 px-4"
                    onClick={() => openWithShop(product.shop.id)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> แชทเลย
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 px-4" asChild>
                    <Link href={`/shop/${product.shop.slug}`}>
                      <Store className="h-3.5 w-3.5" /> ดูร้านค้า
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 mt-3 pt-3 border-t border-gray-50">
                <div>
                  <span className="text-xs text-gray-400">คะแนน</span>
                  <p className="text-sm font-semibold text-orange-500">{product.shop.rating.toFixed(1)} ⭐</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">สินค้าขายแล้ว</span>
                  <p className="text-sm font-semibold text-gray-700">{product.shop.totalSales.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">รีวิวทั้งหมด</span>
                  <p className="text-sm font-semibold text-gray-700">{product.reviewCount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">รายละเอียดสินค้า</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
            {product.description ?? "ไม่มีรายละเอียดสินค้า"}
          </p>
        </div>

        {/* Reviews */}
        {product.reviews.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">รีวิวจากผู้ซื้อ</h2>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-orange-500">{product.rating.toFixed(1)}</div>
                <div>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-4 w-4", i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">{product.reviewCount.toLocaleString()} รีวิว</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {product.reviews.map((review) => {
                const imgs = reviewImages(review);
                return (
                  <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex-shrink-0">
                        {review.user.avatar ? (
                          <Image src={review.user.avatar} alt={review.user.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-orange-500 font-bold text-sm">
                            {review.user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{review.user.name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("th-TH")}
                          </span>
                        </div>
                        <div className="flex mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">{review.comment}</p>
                        {imgs.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {imgs.map((img, idx) => (
                              <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
                                <Image src={img} alt="รีวิว" fill className="object-cover" sizes="64px" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
