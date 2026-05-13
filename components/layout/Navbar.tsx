"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Heart, User, Menu, X, Store, ChevronDown, LogOut, Package, LayoutDashboard, Shield } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FALLBACK_CATEGORIES = [
  { slug: "fashion",      name: "แฟชั่น",              icon: "👗" },
  { slug: "electronics",  name: "อิเล็กทรอนิกส์",      icon: "📱" },
  { slug: "home-kitchen", name: "บ้านและครัว",          icon: "🏠" },
  { slug: "sports",       name: "กีฬา",                icon: "⚽" },
  { slug: "beauty",       name: "ความงาม",             icon: "💄" },
  { slug: "books",        name: "หนังสือ",             icon: "📚" },
  { slug: "food-drink",   name: "อาหารและเครื่องดื่ม", icon: "🍜" },
  { slug: "automotive",   name: "ยานยนต์",             icon: "🚗" },
];

export default function Navbar() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const totalItems    = useCartStore((s) => s.getTotalItems());
  const wishlistCount = useWishlistStore((s) => s.productIds.length);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: { slug: string; name: string; icon?: string | null }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon ?? "📦" })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className={cn("sticky top-0 z-50 w-full bg-white transition-shadow", isScrolled && "shadow-md")}>
      {/* Top bar */}
      <div className="bg-orange-500 text-white text-xs py-1">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <span>ยินดีต้อนรับสู่ RTShop - ช้อปง่าย ส่งไว</span>
          <div className="flex items-center gap-4">
            {user ? (
              <span className="opacity-90">สวัสดี, <strong>{user.name}</strong></span>
            ) : (
              <>
                <Link href="/seller/register" className="hover:text-orange-100 flex items-center gap-1">
                  <Store className="h-3 w-3" /> เปิดร้านค้า
                </Link>
                <Link href="/login" className="hover:text-orange-100">เข้าสู่ระบบ</Link>
                <Link href="/register" className="hover:text-orange-100">สมัครสมาชิก</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 gap-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RT</span>
              </div>
              <span className="text-xl font-bold text-orange-500 hidden sm:block">RTShop</span>
            </div>
          </Link>

          {/* Search — centered in remaining space */}
          <form onSubmit={handleSearch} className="flex-1 flex justify-center">
            <div className="flex w-full max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาสินค้า ร้านค้า หรือแบรนด์..."
                className="w-full h-10 px-4 text-sm border border-r-0 border-gray-200 rounded-l-lg focus:outline-none focus:border-orange-500"
              />
              <button type="submit" className="h-10 px-5 bg-orange-500 text-white rounded-r-lg hover:bg-orange-600 transition-colors flex items-center gap-2 flex-shrink-0">
                <Search className="h-4 w-4" />
                <span className="hidden sm:block text-sm font-medium">ค้นหา</span>
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Wishlist */}
            <Link href="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Heart className="h-6 w-6 text-gray-600" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

            {/* User menu */}
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-24 truncate">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    <Link href="/profile" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User className="h-4 w-4 text-gray-400" /> โปรไฟล์ของฉัน
                    </Link>
                    <Link href="/orders" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Package className="h-4 w-4 text-gray-400" /> คำสั่งซื้อของฉัน
                    </Link>

                    <div className="border-t border-gray-50 mt-1 pt-1">
                      {user.role === "BUYER" && (
                        <Link href="/seller/register" onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                          <Store className="h-4 w-4" /> เปิดร้านค้า
                        </Link>
                      )}
                      {user.role === "SELLER" && (
                        <Link href="/seller/dashboard" onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 transition-colors">
                          <LayoutDashboard className="h-4 w-4" /> Seller Center
                        </Link>
                      )}
                      {user.role === "ADMIN" && (
                        <>
                          <Link href="/seller/dashboard" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 transition-colors">
                            <LayoutDashboard className="h-4 w-4" /> Seller Center
                          </Link>
                          <Link href="/admin/dashboard" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                            <Shield className="h-4 w-4" /> Admin Panel
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-gray-50 mt-1 pt-1">
                      <button onClick={() => { setShowUserMenu(false); logout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut className="h-4 w-4" /> ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <User className="h-6 w-6 text-gray-600" />
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div className="border-t border-gray-100 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors whitespace-nowrap">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {user && (
              <div className="flex items-center gap-3 px-3 py-3 bg-orange-50 rounded-xl mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
            )}
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-500 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}>
                <span className="text-xl">{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
            {!user && (
              <div className="pt-2 border-t border-gray-100 flex gap-2">
                <Link href="/login" className="flex-1 text-center py-2 text-sm font-medium text-orange-500 border border-orange-300 rounded-lg hover:bg-orange-50"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="flex-1 text-center py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
