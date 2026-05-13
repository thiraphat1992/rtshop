"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BannerItem {
  id:       string;
  title:    string;
  imageUrl: string;
  linkUrl:  string;
}

const DEFAULT_BANNERS = [
  { id: "d1", title: "สินค้าคุณภาพดีจากร้านค้าที่เชื่อถือได้",  linkUrl: "/products", imageUrl: "" },
  { id: "d2", title: "ช้อปง่าย ส่งไว ราคาดี",                     linkUrl: "/products", imageUrl: "" },
];

const GRADIENT_BG = [
  "from-orange-500 to-red-500",
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-teal-500",
];

function decodeHtmlBanner(encoded: string): string {
  try {
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

export default function HeroBanner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data: BannerItem[]) => {
        if (Array.isArray(data) && data.length > 0) setBanners(data);
        else setBanners(DEFAULT_BANNERS);
      })
      .catch(() => setBanners(DEFAULT_BANNERS));
  }, []);

  const items = banners.length > 0 ? banners : DEFAULT_BANNERS;

  const next = useCallback(() => setCurrent((c) => (c + 1) % items.length), [items.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + items.length) % items.length), [items.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (items.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {items.map((banner, idx) => (
          <Link
            key={banner.id}
            href={banner.linkUrl || "/products"}
            className="w-full flex-shrink-0 block"
          >
            {banner.imageUrl?.startsWith("html::") ? (
              <div className="relative w-full h-64 md:h-80">
                <iframe
                  srcDoc={decodeHtmlBanner(banner.imageUrl.slice(6))}
                  className="w-full h-full border-0 pointer-events-none"
                  title={banner.title}
                  sandbox="allow-same-origin"
                />
              </div>
            ) : banner.imageUrl ? (
              <div className="relative w-full h-64 md:h-80">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  priority={idx === 0}
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <h2 className="text-white text-2xl md:text-4xl font-bold text-center px-4">{banner.title}</h2>
                </div>
              </div>
            ) : (
              <div className={cn("bg-gradient-to-r h-64 md:h-80 flex items-center justify-center", GRADIENT_BG[idx % GRADIENT_BG.length])}>
                <div className="text-center text-white px-6">
                  <div className="text-6xl md:text-8xl opacity-30 select-none mb-4">🛍️</div>
                  <h2 className="text-2xl md:text-4xl font-bold mb-4">{banner.title}</h2>
                  <div className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3 rounded-full">
                    ช้อปเลย →
                  </div>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                className={cn("h-2 rounded-full transition-all", i === current ? "w-6 bg-white" : "w-2 bg-white/50")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
