"use client";

import React from "react";
import { Bell, Search, Menu } from "lucide-react";

interface AdminTopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function AdminTopbar({ title, onMenuClick }: AdminTopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="font-semibold text-gray-800 text-lg flex-1">{title}</h1>

      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          placeholder="ค้นหา..."
          className="w-64 h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-gray-50"
        />
      </div>

      <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg">
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
        A
      </div>
    </header>
  );
}
