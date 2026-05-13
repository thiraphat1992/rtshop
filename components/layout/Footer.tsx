import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";

const footerLinks = {
  "เกี่ยวกับ RTShop": [
    { label: "เกี่ยวกับเรา", href: "/about" },
    { label: "นโยบายความเป็นส่วนตัว", href: "/privacy" },
    { label: "ข้อกำหนดการใช้งาน", href: "/terms" },
    { label: "แผนผังเว็บไซต์", href: "/sitemap" },
  ],
  "ช่วยเหลือ": [
    { label: "ศูนย์ช่วยเหลือ", href: "/help" },
    { label: "วิธีการชำระเงิน", href: "/help/payment" },
    { label: "นโยบายการคืนสินค้า", href: "/help/return" },
    { label: "ติดต่อเรา", href: "/contact" },
  ],
  "ผู้ขาย": [
    { label: "เปิดร้านค้า", href: "/seller/register" },
    { label: "ศูนย์ผู้ขาย", href: "/seller" },
    { label: "สิทธิประโยชน์ผู้ขาย", href: "/seller/benefits" },
  ],
};

const paymentMethods = ["💳 บัตรเครดิต", "📱 พร้อมเพย์", "🏦 โอนเงิน", "💰 ปลายทาง"];
const shippingPartners = ["Flash", "Kerry", "J&T", "ไปรษณีย์ไทย"];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RT</span>
              </div>
              <span className="text-xl font-bold text-white">RTShop</span>
            </div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              แพลตฟอร์ม Multi-vendor ที่รวมสินค้าคุณภาพจากร้านค้าหลากหลาย
              พร้อมระบบจัดส่งที่รวดเร็วและปลอดภัย
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <span>กรุงเทพมหานคร 10110</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <span>02-000-0000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <span>support@rtshop.com</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              {["Facebook", "Instagram", "YouTube", "X"].map((name) => (
                <a key={name} href="#" title={name} className="p-2 bg-gray-800 rounded-lg hover:bg-orange-500 transition-colors text-xs font-bold">
                  {name[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment & Shipping */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-2">ช่องทางการชำระเงิน</p>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((m) => (
                  <span key={m} className="px-3 py-1 bg-gray-800 rounded text-xs">{m}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">พาร์ทเนอร์ขนส่ง</p>
              <div className="flex flex-wrap gap-2">
                {shippingPartners.map((s) => (
                  <span key={s} className="px-3 py-1 bg-gray-800 rounded text-xs">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>© 2024 RTShop. สงวนลิขสิทธิ์ทั้งหมด</p>
        </div>
      </div>
    </footer>
  );
}
