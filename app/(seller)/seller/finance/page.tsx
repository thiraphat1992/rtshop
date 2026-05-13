"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp, Wallet, ArrowDownToLine, Clock, CheckCircle,
  AlertCircle, ChevronRight, DollarSign, BarChart3, Calendar,
  CreditCard, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SellerTopbar from "@/components/seller/SellerTopbar";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FinanceData {
  monthRevenue:     number;
  prevMonthRevenue: number;
  pendingPayout:    number;
  balance:          number;
  totalRevenue:     number;
  weeklyData:       { date: string; total: number }[];
  transactions:     { id: string; orderId: string; type: string; label: string; amount: number; date: string; status: string }[];
  bank:             { bankName: string; bankAccount: string };
}

const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const payoutTabs = ["ทั้งหมด", "รายรับ", "รอดำเนินการ", "สำเร็จ"];

export default function SellerFinancePage() {
  const [data,        setData]        = useState<FinanceData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(false);
  const [activeTab,   setActiveTab]   = useState("ทั้งหมด");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    fetch("/api/seller/finance")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setData(d))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SellerTopbar title="การเงิน" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (fetchError || !data) {
    return (
      <div className="flex flex-col min-h-screen">
        <SellerTopbar title="การเงิน" />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-gray-500">ไม่สามารถโหลดข้อมูลได้</p>
          <button onClick={() => { setFetchError(false); setLoading(true); fetch("/api/seller/finance").then((r) => r.json()).then((d) => setData(d)).catch(() => setFetchError(true)).finally(() => setLoading(false)); }}
            className="text-sm text-orange-500 hover:text-orange-600 underline">ลองใหม่</button>
        </div>
      </div>
    );
  }

  const growth = data.prevMonthRevenue > 0
    ? Math.round(((data.monthRevenue - data.prevMonthRevenue) / data.prevMonthRevenue) * 100)
    : null;

  const summaryCards = [
    { label: "ยอดขายเดือนนี้",     value: data.monthRevenue,  growth, icon: TrendingUp,  color: "text-green-600 bg-green-50" },
    { label: "รอโอนเงิน",          value: data.pendingPayout, growth: null, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "ยอดขายเดือนนี้ (net)", value: data.balance,    growth: null, icon: Wallet, color: "text-blue-600 bg-blue-50" },
    { label: "รายได้รวมทั้งหมด",   value: data.totalRevenue,  growth: null, icon: CheckCircle, color: "text-purple-600 bg-purple-50" },
  ];

  const maxBar = Math.max(...data.weeklyData.map((d) => d.total), 1);

  const filteredTx = data.transactions.filter((tx) => {
    if (activeTab === "รายรับ")       return tx.type === "income";
    if (activeTab === "รอดำเนินการ")  return tx.status === "pending";
    if (activeTab === "สำเร็จ")       return tx.status === "settled";
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <SellerTopbar title="การเงิน" />

      <div className="flex-1 p-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <div className={cn("p-2 rounded-xl", card.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-800">{formatPrice(card.value)}</p>
                {card.growth !== null && (
                  <p className={cn("text-xs mt-1", card.growth >= 0 ? "text-green-600" : "text-red-500")}>
                    {card.growth >= 0 ? "+" : ""}{card.growth}% จากเดือนที่แล้ว
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-500" /> ยอดขาย 7 วันล่าสุด
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="h-3.5 w-3.5" />
                {data.weeklyData[0]?.date} – {data.weeklyData[data.weeklyData.length - 1]?.date}
              </div>
            </div>
            <div className="flex items-end gap-3 h-40">
              {data.weeklyData.map((d, i) => {
                const date = new Date(d.date);
                const dayLabel = DAYS_TH[date.getDay()];
                const pct = (d.total / maxBar) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">
                      {d.total > 0 ? `${(d.total / 1000).toFixed(1)}k` : ""}
                    </span>
                    <div className="w-full rounded-t-lg bg-orange-100 relative overflow-hidden" style={{ height: `${Math.max(pct, 4)}%` }}>
                      <div className="absolute inset-0 bg-orange-400 opacity-80" />
                    </div>
                    <span className="text-[10px] text-gray-500">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wallet */}
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-orange-500" /> กระเป๋าเงินของฉัน
            </h3>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
              <p className="text-sm opacity-80 mb-1">ยอดขายเดือนนี้</p>
              <p className="text-3xl font-bold">{formatPrice(data.balance)}</p>
              <p className="text-xs opacity-70 mt-2">รอโอน: {formatPrice(data.pendingPayout)}</p>
            </div>

            {data.bank.bankName && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
                <p className="text-gray-500 text-xs font-medium mb-2">บัญชีรับเงิน</p>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{data.bank.bankName}</span>
                </div>
                <p className="text-gray-800 font-mono font-semibold pl-6">{data.bank.bankAccount || "ยังไม่ได้ตั้งค่า"}</p>
              </div>
            )}

            {!data.bank.bankName && (
              <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700">
                <p className="font-medium">ยังไม่ได้ตั้งค่าบัญชีธนาคาร</p>
                <a href="/seller/settings" className="text-xs underline mt-1 block">ตั้งค่าบัญชีธนาคาร →</a>
              </div>
            )}

            {!showWithdraw ? (
              <Button onClick={() => setShowWithdraw(true)} className="w-full gap-2">
                <ArrowDownToLine className="h-4 w-4" /> ถอนเงิน
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="ระบุจำนวน"
                    min="100"
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">ถอนขั้นต่ำ ฿100 · โอนภายใน 1–2 วันทำการ</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!withdrawAmount || Number(withdrawAmount) < 100}
                    onClick={() => { setShowWithdraw(false); setWithdrawAmount(""); }}
                  >
                    ยืนยัน
                  </Button>
                  <Button variant="outline" onClick={() => setShowWithdraw(false)}>ยกเลิก</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">ประวัติคำสั่งซื้อ</h3>
          </div>

          <div className="flex gap-1 px-4 pt-3 pb-1 overflow-x-auto">
            {payoutTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  activeTab === tab ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="divide-y divide-gray-50">
            {filteredTx.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">ไม่มีรายการ</div>
            ) : (
              filteredTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="p-2 rounded-xl bg-green-50 flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.label}</p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">+{formatPrice(tx.amount)}</p>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      tx.status === "settled" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {tx.status === "settled" ? "สำเร็จ" : "รอดำเนินการ"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fee info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-blue-800">โครงสร้างค่าธรรมเนียม RTShop</p>
              <ul className="text-blue-700 space-y-0.5 text-xs">
                <li>• ค่าธรรมเนียมแพลตฟอร์ม: <strong>3%</strong> ของยอดขายสุทธิ</li>
                <li>• ค่าธรรมเนียมการชำระเงิน: <strong>1.5%</strong> (บัตรเครดิต) หรือ <strong>0%</strong> (พร้อมเพย์)</li>
                <li>• ค่าธรรมเนียมถอนเงิน: <strong>ฟรี</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
