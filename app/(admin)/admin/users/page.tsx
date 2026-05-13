"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, UserCheck, UserX, ChevronLeft,
  ChevronRight as ChevronRightIcon, Mail, Phone,
} from "lucide-react";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { cn } from "@/lib/utils";

type Role   = "BUYER" | "SELLER" | "ADMIN";

interface User {
  id:        string;
  name:      string;
  email:     string | null;
  phone:     string | null;
  role:      Role;
  isActive:  boolean;
  createdAt: string;
  _count:    { orders: number };
}

const roleCfg: Record<Role, { label: string; color: string }> = {
  BUYER:  { label: "ผู้ซื้อ", color: "bg-blue-50 text-blue-700"   },
  SELLER: { label: "ผู้ขาย", color: "bg-purple-50 text-purple-700" },
  ADMIN:  { label: "แอดมิน", color: "bg-orange-50 text-orange-700" },
};

export default function AdminUsersPage() {
  const [users,      setUsers]      = useState<User[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page,       setPage]       = useState(1);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)                    params.set("q",    search);
    if (roleFilter !== "all")      params.set("role", roleFilter);
    params.set("page",  String(page));
    params.set("limit", "20");

    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [search, roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleBan = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !isActive } : u));
    }
  };

  const changeRole = async (id: string, role: Role) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    }
  };

  const buyers  = users.filter((u) => u.role === "BUYER").length;
  const sellers = users.filter((u) => u.role === "SELLER").length;
  const banned  = users.filter((u) => !u.isActive).length;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="จัดการผู้ใช้งาน" />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "ทั้งหมด",  value: total,   color: "text-gray-800" },
            { label: "ผู้ซื้อ",  value: buyers,  color: "text-blue-600" },
            { label: "ผู้ขาย",  value: sellers, color: "text-purple-600" },
            { label: "ถูกระงับ", value: banned,  color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
          >
            <option value="all">ทุกบทบาท</option>
            <option value="BUYER">ผู้ซื้อ</option>
            <option value="SELLER">ผู้ขาย</option>
            <option value="ADMIN">แอดมิน</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">ผู้ใช้</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">ติดต่อ</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">บทบาท</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">สถานะ</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 hidden lg:table-cell">ออเดอร์</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 hidden lg:table-cell">สมัครเมื่อ</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {user.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {user.email && <p className="text-xs text-gray-600 flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</p>}
                      {user.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{user.phone}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value as Role)}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-300",
                          roleCfg[user.role].color
                        )}
                      >
                        <option value="BUYER">ผู้ซื้อ</option>
                        <option value="SELLER">ผู้ขาย</option>
                        <option value="ADMIN">แอดมิน</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium",
                        user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      )}>
                        {user.isActive ? "ปกติ" : "ระงับ"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm text-gray-500 hidden lg:table-cell">
                      {user._count.orders}
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs text-gray-400 hidden lg:table-cell">
                      {new Date(user.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => toggleBan(user.id, user.isActive)}
                          title={user.isActive ? "ระงับบัญชี" : "ปลดระงับ"}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            user.isActive
                              ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                              : "text-gray-400 hover:text-green-500 hover:bg-green-50"
                          )}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && users.length === 0 && (
            <div className="py-12 text-center text-gray-400">ไม่พบผู้ใช้</div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">ทั้งหมด {total} รายการ · หน้า {page}/{totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn("w-8 h-8 text-xs rounded-lg transition-colors",
                    p === page ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100")}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
