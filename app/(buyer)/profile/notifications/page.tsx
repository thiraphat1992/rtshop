"use client";

import { Bell, BellOff, ShoppingBag, Tag, Megaphone } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const notificationSettings = [
  { id: "orders", icon: ShoppingBag, label: "อัปเดตคำสั่งซื้อ", description: "รับการแจ้งเตือนเมื่อสถานะออเดอร์เปลี่ยนแปลง", defaultOn: true },
  { id: "promotions", icon: Tag, label: "โปรโมชัน & ส่วนลด", description: "รับข้อเสนอพิเศษและคูปองส่วนลดจากร้านค้า", defaultOn: true },
  { id: "announcements", icon: Megaphone, label: "ประกาศจาก RTShop", description: "ข่าวสารและการอัปเดตจากแพลตฟอร์ม", defaultOn: false },
];

export default function NotificationsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationSettings.map((s) => [s.id, s.defaultOn]))
  );
  const [masterOn, setMasterOn] = useState(true);

  const toggle = (id: string) =>
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-800 mb-6">การแจ้งเตือน</h1>

        {/* Master toggle */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              {masterOn ? (
                <Bell className="h-5 w-5 text-orange-500" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">เปิดการแจ้งเตือนทั้งหมด</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {masterOn ? "รับการแจ้งเตือนตามที่ตั้งค่าไว้" : "ปิดการแจ้งเตือนทั้งหมดชั่วคราว"}
              </p>
            </div>
            <Switch
              checked={masterOn}
              onCheckedChange={setMasterOn}
            />
          </div>
        </div>

        {/* Individual settings */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ประเภทการแจ้งเตือน</p>
          </div>
          {notificationSettings.map((setting, idx) => (
            <div
              key={setting.id}
              className={`flex items-center gap-4 px-5 py-4 ${
                idx < notificationSettings.length - 1 ? "border-b border-gray-50" : ""
              } ${!masterOn ? "opacity-50" : ""}`}
            >
              <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
                <setting.icon className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">{setting.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{setting.description}</p>
              </div>
              <Switch
                checked={masterOn && enabled[setting.id]}
                onCheckedChange={() => toggle(setting.id)}
                disabled={!masterOn}
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400 px-4">
          การตั้งค่าการแจ้งเตือนจะถูกบันทึกเฉพาะในอุปกรณ์นี้
        </p>
      </div>
    </div>
  );
}
