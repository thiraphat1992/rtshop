import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import ConditionalShell from "@/components/layout/ConditionalShell";

export const metadata: Metadata = {
  title: {
    default: "RTShop - ช้อปออนไลน์ครบจบที่เดียว",
    template: "%s | RTShop",
  },
  description: "แพลตฟอร์ม Multi-vendor ช้อปปิ้งออนไลน์ สินค้าครบ ราคาดี จัดส่งรวดเร็ว",
  keywords: ["ช้อปออนไลน์", "ร้านค้าออนไลน์", "RTShop", "e-commerce"],
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "RTShop",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">
        <ToastProvider>
          <ConditionalShell>{children}</ConditionalShell>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}
