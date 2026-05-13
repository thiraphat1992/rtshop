"use client";

import React, { useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SellerTopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function SellerTopbar({ title, onMenuClick }: SellerTopbarProps) {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch("/api/seller/orders?status=PAID&limit=1")
      .then((r) => r.json())
      .then((data) => setPendingCount(data.total ?? 0))
      .catch(() => {});
  }, []);

  const displayName = user?.name ?? "ผู้ขาย";

  return (
    <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg">
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
          <Bell className="h-5 w-5 text-gray-500" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 cursor-pointer">
            <AvatarFallback className="text-xs bg-orange-100 text-orange-600">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600 hidden sm:block">{displayName}</span>
        </div>
      </div>
    </header>
  );
}
