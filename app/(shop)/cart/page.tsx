"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, Tag, ChevronRight, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>(items.map((i) => i.product.id));

  const subtotal = items
    .filter((i) => selectedItems.includes(i.product.id))
    .reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const shippingFee = subtotal >= 299 ? 0 : 50;
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const total = subtotal + shippingFee - discount;

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((i) => i.product.id));
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-20 w-20 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">ตะกร้าสินค้าว่างเปล่า</h2>
        <p className="text-gray-400 mb-6">เลือกสินค้าที่คุณชอบแล้วเพิ่มในตะกร้าได้เลย</p>
        <Button asChild>
          <Link href="/products">
            <ShoppingCart className="h-4 w-4 mr-2" /> เริ่มช้อปปิ้ง
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/products" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            ตะกร้าสินค้า <span className="text-orange-500">({getTotalItems()})</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {/* Select all */}
            <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <input
                type="checkbox"
                checked={selectedItems.length === items.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">
                เลือกทั้งหมด ({items.length} รายการ)
              </span>
            </div>

            {items.map((item) => (
              <div key={`${item.product.id}-${item.variantId}`} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.product.id)}
                    onChange={() => toggleSelectItem(item.product.id)}
                    className="w-4 h-4 rounded accent-orange-500 mt-1"
                  />

                  {/* Product image */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  {/* Product details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">{item.product.shopName}</p>
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
                      {item.product.name}
                    </h3>
                    {item.variantName && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {item.variantName}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-orange-500 font-bold">
                        {formatPrice(item.product.price)}
                      </span>

                      {/* Quantity controls */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variantId)}
                          className="w-8 h-8 hover:bg-gray-50 flex items-center justify-center"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-8 h-8 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.product.id, item.variantId)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Item subtotal */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                  <span className="text-sm text-gray-600">
                    รวม: <span className="font-bold text-gray-800">{formatPrice(item.product.price * item.quantity)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-orange-500" /> คูปองส่วนลด
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="ใส่รหัสคูปอง"
                  className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (couponCode === "SAVE10") {
                      setCouponApplied(true);
                    }
                  }}
                  disabled={!couponCode}
                  className="text-xs px-3"
                >
                  ใช้
                </Button>
              </div>
              {couponApplied && (
                <p className="text-xs text-green-600 mt-2">✓ ใช้คูปอง SAVE10 แล้ว ลด 10%</p>
              )}
            </div>

            {/* Price summary */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">สรุปคำสั่งซื้อ</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>ราคาสินค้า ({selectedItems.length} รายการ)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ค่าจัดส่ง</span>
                  <span className={shippingFee === 0 ? "text-green-600 font-medium" : ""}>
                    {shippingFee === 0 ? "ฟรี" : formatPrice(shippingFee)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>ส่วนลดคูปอง</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                {subtotal < 299 && subtotal > 0 && (
                  <p className="text-xs text-orange-500 bg-orange-50 rounded-lg px-3 py-2">
                    ช้อปเพิ่มอีก {formatPrice(299 - subtotal)} เพื่อรับส่งฟรี!
                  </p>
                )}
                <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-100">
                  <span>ยอดรวมทั้งหมด</span>
                  <span className="text-orange-500">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                className="w-full mt-5"
                size="lg"
                disabled={selectedItems.length === 0}
                asChild
              >
                <Link href="/checkout" className="flex items-center gap-2">
                  ดำเนินการชำระเงิน
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>

              <div className="mt-3 text-center text-xs text-gray-400">
                ปลอดภัยด้วย SSL encryption 🔒
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
