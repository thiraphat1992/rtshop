"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Save, X,
  MoveUp, MoveDown, Monitor, Smartphone,
  RotateCcw, Copy, Check, Code2, Paintbrush,
  Image as ImageIcon, Link as LinkIcon, GripVertical,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { cn } from "@/lib/utils";

// ─── Fonts & Presets ────────────────────────────────────────────────────────
const THAI_FONTS = ["Kanit","Sarabun","Prompt","Mitr","Chakra Petch","K2D","IBM Plex Sans Thai","Noto Sans Thai"];
const OTHER_FONTS = ["Arial","Georgia","Helvetica Neue","Verdana","Trebuchet MS"];
const ALL_FONTS = [...THAI_FONTS, ...OTHER_FONTS];

const PRESET_GRADIENTS = [
  { label: "RTShop 🟠", value: "linear-gradient(135deg,#f97316 0%,#fb923c 50%,#fed7aa 100%)" },
  { label: "Ocean 🌊",  value: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" },
  { label: "Sunset 🌅", value: "linear-gradient(135deg,#f7971e 0%,#f2994a 50%,#e52e71 100%)" },
  { label: "Forest 🌿", value: "linear-gradient(135deg,#11998e 0%,#38ef7d 100%)" },
  { label: "Rose 🌸",   value: "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)" },
  { label: "Night 🌙",  value: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)" },
  { label: "Gold 💛",   value: "linear-gradient(135deg,#f9d423 0%,#ff4e50 100%)" },
  { label: "Steel 💎",  value: "linear-gradient(135deg,#2c3e50 0%,#3498db 100%)" },
];

// ─── Types ──────────────────────────────────────────────────────────────────
interface BannerDesign {
  bannerName: string;
  bgType: "color" | "image" | "gradient";
  bgColor: string;
  bgImage: string;
  bgGradient: string;
  overlayEnabled: boolean;
  overlayColor: string;
  overlayOpacity: number;
  headline: string;
  headlineFont: string;
  headlineSize: number;
  headlineWeight: string;
  headlineColor: string;
  headlineShadow: boolean;
  subtext: string;
  subtextFont: string;
  subtextSize: number;
  subtextColor: string;
  showCta: boolean;
  ctaText: string;
  ctaBg: string;
  ctaColor: string;
  ctaRadius: number;
  contentAlign: "left" | "center" | "right";
  verticalAlign: "flex-start" | "center" | "flex-end";
  linkUrl: string;
}

const DEFAULT_DESIGN: BannerDesign = {
  bannerName: "แบนเนอร์ใหม่",
  bgType: "gradient",
  bgColor: "#1a1a2e",
  bgImage: "",
  bgGradient: PRESET_GRADIENTS[0].value,
  overlayEnabled: false,
  overlayColor: "#000000",
  overlayOpacity: 40,
  headline: "ช้อปสินค้าดี ราคาถูก",
  headlineFont: "Kanit",
  headlineSize: 52,
  headlineWeight: "700",
  headlineColor: "#ffffff",
  headlineShadow: true,
  subtext: "ส่งฟรีทั่วประเทศ ไม่มีขั้นต่ำ",
  subtextFont: "Kanit",
  subtextSize: 20,
  subtextColor: "#ffffff",
  showCta: true,
  ctaText: "ช้อปเลย →",
  ctaBg: "#ffffff",
  ctaColor: "#f97316",
  ctaRadius: 50,
  contentAlign: "center",
  verticalAlign: "center",
  linkUrl: "/products",
};

// ─── HTML Generator ─────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

function generateHTML(d: BannerDesign): string {
  const thaiFontsUsed = [...new Set([d.headlineFont, d.subtextFont])].filter(f => THAI_FONTS.includes(f));
  const fontQuery = thaiFontsUsed.map(f => `family=${encodeURIComponent(f)}:wght@400;600;700;800;900`).join("&");
  const fontLink = fontQuery
    ? `  <link href="https://fonts.googleapis.com/css2?${fontQuery}&display=swap" rel="stylesheet">`
    : "";

  const bg =
    d.bgType === "image" && d.bgImage ? `background: url('${d.bgImage}') center / cover no-repeat` :
    d.bgType === "gradient" ? `background: ${d.bgGradient}` :
    `background: ${d.bgColor}`;

  const overlay = d.overlayEnabled
    ? `    <div style="position:absolute;inset:0;background:${hexToRgba(d.overlayColor, d.overlayOpacity / 100)}"></div>`
    : "";

  const shadow = d.headlineShadow
    ? "text-shadow: 0 3px 16px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4);" : "";

  const justifyMap: Record<string, string> = { left: "flex-start", center: "center", right: "flex-end" };
  const justifyContent = justifyMap[d.contentAlign] ?? "center";
  const paddingH = d.contentAlign === "center" ? "48px" : "64px";

  const hlLine = d.headline
    ? `      <div style="font-family:'${d.headlineFont}',sans-serif;font-size:${d.headlineSize}px;font-weight:${d.headlineWeight};color:${d.headlineColor};line-height:1.2;${shadow}">${d.headline}</div>`
    : "";

  const stLine = d.subtext
    ? `      <div style="font-family:'${d.subtextFont}',sans-serif;font-size:${d.subtextSize}px;color:${d.subtextColor};margin-top:10px;">${d.subtext}</div>`
    : "";

  const ctaLine = d.showCta && d.ctaText
    ? `      <a href="${d.linkUrl}" style="display:inline-block;background:${d.ctaBg};color:${d.ctaColor};padding:12px 36px;border-radius:${d.ctaRadius}px;font-family:'${d.headlineFont}',sans-serif;font-size:16px;font-weight:600;text-decoration:none;margin-top:20px;">${d.ctaText}</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
${fontLink}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div style="${bg};width:100%;height:100%;position:relative;display:flex;align-items:${d.verticalAlign};justify-content:${justifyContent};">
${overlay}
    <div style="position:relative;text-align:${d.contentAlign};padding:0 ${paddingH};width:100%;max-width:960px;">
${hlLine}
${stLine}
${ctaLine}
    </div>
  </div>
</body>
</html>`;
}

// ─── Existing Banner type ────────────────────────────────────────────────────
interface Banner { id:string; title:string; imageUrl:string; linkUrl:string; isActive:boolean; sortOrder:number; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isCustomHtml(url: string) { return url.startsWith("html::"); }

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminBannersPage() {
  // ── Designer state ──────────────────────────────────────────
  const [design, setDesign]         = useState<BannerDesign>(DEFAULT_DESIGN);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [codeEdited, setCodeEdited] = useState(false);
  const [editorTab, setEditorTab]   = useState<"visual" | "code">("visual");
  const [previewTab, setPreviewTab] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied]         = useState(false);
  const [saving, setSaving]         = useState(false);

  // which visual section is expanded
  const [openSection, setOpenSection] = useState<string>("bg");

  // ── Banner list state ────────────────────────────────────────
  const [banners,  setBanners]  = useState<Banner[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", imageUrl: "", linkUrl: "" });
  const [deleting, setDeleting] = useState<string | null>(null);

  const displayCode = codeEdited && manualCode !== null ? manualCode : generateHTML(design);

  function setField<K extends keyof BannerDesign>(key: K, value: BannerDesign[K]) {
    setDesign(prev => ({ ...prev, [key]: value }));
    if (codeEdited) { /* keep manual code */ }
    else { setManualCode(null); }
  }

  const resetCode = () => { setManualCode(null); setCodeEdited(false); };

  const copyCode = () => {
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveBanner = async () => {
    setSaving(true);
    try {
      const html = displayCode;
      const encoded = typeof btoa !== "undefined" ? btoa(unescape(encodeURIComponent(html))) : Buffer.from(html).toString("base64");
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: design.bannerName,
          imageUrl: `html::${encoded}`,
          linkUrl: design.linkUrl,
          isActive: true,
        }),
      });
      if (res.ok) {
        const newBanner = await res.json();
        setBanners(prev => [...prev, newBanner]);
        alert("บันทึกแบนเนอร์สำเร็จ!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`บันทึกไม่สำเร็จ: ${err.error ?? res.status}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Banner list fetch & actions ──────────────────────────────
  const fetchBanners = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/banners")
      .then(r => r.json())
      .then(data => setBanners(Array.isArray(data) ? data : (data.banners ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const toggleActive = async (id: string, cur: boolean) => {
    const res = await fetch(`/api/admin/banners/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !cur }) });
    if (res.ok) setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !cur } : b));
  };

  const startEdit = (b: Banner) => { setEditId(b.id); setEditForm({ title: b.title, imageUrl: b.imageUrl, linkUrl: b.linkUrl }); };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/admin/banners/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    if (res.ok) { const updated = await res.json(); setBanners(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b)); setEditId(null); }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("ลบแบนเนอร์นี้?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (res.ok) setBanners(prev => prev.filter(b => b.id !== id));
    setDeleting(null);
  };

  const moveUp = async (id: string) => {
    const idx = banners.findIndex(b => b.id === id); if (idx === 0) return;
    const next = [...banners]; [next[idx-1], next[idx]] = [next[idx], next[idx-1]];
    const reordered = next.map((b,i) => ({ ...b, sortOrder: i+1 }));
    setBanners(reordered);
    await fetch(`/api/admin/banners/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: reordered.find(b=>b.id===id)!.sortOrder }) });
  };

  const moveDown = async (id: string) => {
    const idx = banners.findIndex(b => b.id === id); if (idx === banners.length - 1) return;
    const next = [...banners]; [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
    const reordered = next.map((b,i) => ({ ...b, sortOrder: i+1 }));
    setBanners(reordered);
    await fetch(`/api/admin/banners/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: reordered.find(b=>b.id===id)!.sortOrder }) });
  };

  // ── Section component ────────────────────────────────────────
  const Section = ({ id, title, children }: { id:string; title:string; children:React.ReactNode }) => (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpenSection(openSection === id ? "" : id)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
        {title}
        <span className={cn("text-gray-400 transition-transform", openSection === id && "rotate-180")}>▾</span>
      </button>
      {openSection === id && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );

  const Label = ({ children }: { children:React.ReactNode }) => (
    <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>
  );

  const Row = ({ children, className }: { children:React.ReactNode; className?:string }) => (
    <div className={cn("grid grid-cols-2 gap-3", className)}>{children}</div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="จัดการแบนเนอร์" />

      <div className="flex-1 p-6 space-y-6">

        {/* ── Banner Designer ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-sm">Banner Designer</h2>
                <p className="text-xs text-gray-400">ออกแบบและพรีวิวแบนเนอร์</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                value={design.bannerName}
                onChange={e => setField("bannerName", e.target.value)}
                placeholder="ชื่อแบนเนอร์"
                className="w-48 h-8 text-sm"
              />
              <Button onClick={handleSaveBanner} disabled={saving} className="gap-2 h-8 text-sm">
                <Save className="h-3.5 w-3.5" />
                {saving ? "กำลังบันทึก..." : "บันทึกแบนเนอร์"}
              </Button>
            </div>
          </div>

          {/* Designer Body */}
          <div className="grid grid-cols-[420px_1fr] min-h-[640px]">

            {/* ── Left: Editor ── */}
            <div className="border-r border-gray-100 flex flex-col">
              {/* Editor tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                {([["visual","🎨 ออกแบบ"],["code","</> โค้ด"]] as const).map(([tab, label]) => (
                  <button key={tab} onClick={() => setEditorTab(tab)}
                    className={cn("flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                      editorTab === tab ? "bg-white text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-gray-700")}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Visual Controls */}
              {editorTab === "visual" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">

                  {/* Background */}
                  <Section id="bg" title="🖼️ พื้นหลัง">
                    <div className="flex gap-1 mb-2">
                      {([["color","สี"],["image","รูปภาพ"],["gradient","Gradient"]] as const).map(([t, l]) => (
                        <button key={t} onClick={() => setField("bgType", t)}
                          className={cn("flex-1 py-1 text-xs rounded-lg border font-medium transition-colors",
                            design.bgType === t ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:border-orange-300")}>
                          {l}
                        </button>
                      ))}
                    </div>

                    {design.bgType === "color" && (
                      <Row>
                        <div>
                          <Label>สีพื้นหลัง</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={design.bgColor} onChange={e => setField("bgColor", e.target.value)}
                              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                            <Input value={design.bgColor} onChange={e => setField("bgColor", e.target.value)} className="h-9 text-xs font-mono" />
                          </div>
                        </div>
                      </Row>
                    )}

                    {design.bgType === "image" && (
                      <div>
                        <Label>URL รูปภาพพื้นหลัง</Label>
                        <Input value={design.bgImage} onChange={e => setField("bgImage", e.target.value)}
                          placeholder="https://example.com/banner.jpg" className="text-xs" />
                        <p className="text-[10px] text-gray-400 mt-1">ขนาดแนะนำ: 1280×320px (Desktop) / 750×500px (Mobile)</p>
                        {design.bgImage && (
                          <div className="mt-2 h-16 rounded-lg overflow-hidden bg-gray-100">
                            <img src={design.bgImage} alt="" className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        )}
                      </div>
                    )}

                    {design.bgType === "gradient" && (
                      <div>
                        <Label>Gradient สำเร็จรูป</Label>
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          {PRESET_GRADIENTS.map(g => (
                            <button key={g.value} onClick={() => setField("bgGradient", g.value)} title={g.label}
                              style={{ background: g.value }}
                              className={cn("h-8 rounded-lg border-2 transition-all",
                                design.bgGradient === g.value ? "border-orange-500 scale-95" : "border-transparent hover:scale-95")} />
                          ))}
                        </div>
                        <Label>Custom Gradient CSS</Label>
                        <Input value={design.bgGradient} onChange={e => setField("bgGradient", e.target.value)}
                          placeholder="linear-gradient(135deg,#f00 0%,#00f 100%)" className="text-xs font-mono" />
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Overlay สีทับ</Label>
                        <button onClick={() => setField("overlayEnabled", !design.overlayEnabled)}
                          className={cn("w-10 h-5 rounded-full transition-colors relative flex-shrink-0",
                            design.overlayEnabled ? "bg-orange-500" : "bg-gray-200")}>
                          <span className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform",
                            design.overlayEnabled ? "translate-x-5" : "translate-x-0.5")} />
                        </button>
                      </div>
                      {design.overlayEnabled && (
                        <Row>
                          <div>
                            <Label>สี Overlay</Label>
                            <div className="flex gap-2 items-center">
                              <input type="color" value={design.overlayColor} onChange={e => setField("overlayColor", e.target.value)}
                                className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                              <Input value={design.overlayColor} onChange={e => setField("overlayColor", e.target.value)} className="h-9 text-xs font-mono" />
                            </div>
                          </div>
                          <div>
                            <Label>ความทึบ {design.overlayOpacity}%</Label>
                            <input type="range" min={0} max={90} value={design.overlayOpacity} onChange={e => setField("overlayOpacity", +e.target.value)}
                              className="w-full mt-2 accent-orange-500" />
                          </div>
                        </Row>
                      )}
                    </div>
                  </Section>

                  {/* Headline */}
                  <Section id="headline" title="✏️ ข้อความหลัก">
                    <div>
                      <Label>ข้อความ</Label>
                      <Input value={design.headline} onChange={e => setField("headline", e.target.value)} placeholder="ใส่ข้อความหลัก..." />
                    </div>
                    <Row>
                      <div>
                        <Label>ฟอนต์</Label>
                        <select value={design.headlineFont} onChange={e => setField("headlineFont", e.target.value)}
                          className="w-full h-9 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500">
                          <optgroup label="ภาษาไทย">{THAI_FONTS.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>
                          <optgroup label="ทั่วไป">{OTHER_FONTS.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>
                        </select>
                      </div>
                      <div>
                        <Label>น้ำหนัก</Label>
                        <select value={design.headlineWeight} onChange={e => setField("headlineWeight", e.target.value)}
                          className="w-full h-9 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500">
                          {[["400","ปกติ"],["600","กึ่งหนา"],["700","หนา"],["800","หนามาก"],["900","หนาสุด"]].map(([v,l]) => (
                            <option key={v} value={v}>{l} ({v})</option>
                          ))}
                        </select>
                      </div>
                    </Row>
                    <Row>
                      <div>
                        <Label>ขนาด {design.headlineSize}px</Label>
                        <input type="range" min={20} max={100} value={design.headlineSize} onChange={e => setField("headlineSize", +e.target.value)}
                          className="w-full mt-2 accent-orange-500" />
                      </div>
                      <div>
                        <Label>สีตัวอักษร</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={design.headlineColor} onChange={e => setField("headlineColor", e.target.value)}
                            className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                          <Input value={design.headlineColor} onChange={e => setField("headlineColor", e.target.value)} className="h-9 text-xs font-mono" />
                        </div>
                      </div>
                    </Row>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="shadow" checked={design.headlineShadow} onChange={e => setField("headlineShadow", e.target.checked)}
                        className="w-4 h-4 accent-orange-500 rounded" />
                      <label htmlFor="shadow" className="text-xs text-gray-600 cursor-pointer">เงาตัวอักษร (Text Shadow)</label>
                    </div>
                  </Section>

                  {/* Subtext */}
                  <Section id="subtext" title="📝 ข้อความรอง">
                    <div>
                      <Label>ข้อความรอง</Label>
                      <Input value={design.subtext} onChange={e => setField("subtext", e.target.value)} placeholder="ข้อความรองไม่บังคับ..." />
                    </div>
                    <Row>
                      <div>
                        <Label>ฟอนต์</Label>
                        <select value={design.subtextFont} onChange={e => setField("subtextFont", e.target.value)}
                          className="w-full h-9 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500">
                          <optgroup label="ภาษาไทย">{THAI_FONTS.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>
                          <optgroup label="ทั่วไป">{OTHER_FONTS.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>
                        </select>
                      </div>
                      <div>
                        <Label>ขนาด {design.subtextSize}px</Label>
                        <input type="range" min={12} max={48} value={design.subtextSize} onChange={e => setField("subtextSize", +e.target.value)}
                          className="w-full mt-2 accent-orange-500" />
                      </div>
                    </Row>
                    <div>
                      <Label>สีตัวอักษร</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={design.subtextColor} onChange={e => setField("subtextColor", e.target.value)}
                          className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                        <Input value={design.subtextColor} onChange={e => setField("subtextColor", e.target.value)} className="h-9 text-xs font-mono" />
                      </div>
                    </div>
                  </Section>

                  {/* CTA Button */}
                  <Section id="cta" title="🔘 ปุ่ม CTA">
                    <div className="flex items-center gap-2 pb-2">
                      <input type="checkbox" id="showCta" checked={design.showCta} onChange={e => setField("showCta", e.target.checked)} className="w-4 h-4 accent-orange-500 rounded" />
                      <label htmlFor="showCta" className="text-xs text-gray-600 cursor-pointer font-medium">แสดงปุ่ม CTA</label>
                    </div>
                    {design.showCta && (
                      <>
                        <div>
                          <Label>ข้อความปุ่ม</Label>
                          <Input value={design.ctaText} onChange={e => setField("ctaText", e.target.value)} placeholder="ช้อปเลย →" />
                        </div>
                        <Row>
                          <div>
                            <Label>สีพื้นปุ่ม</Label>
                            <div className="flex gap-2 items-center">
                              <input type="color" value={design.ctaBg} onChange={e => setField("ctaBg", e.target.value)}
                                className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                              <Input value={design.ctaBg} onChange={e => setField("ctaBg", e.target.value)} className="h-9 text-xs font-mono" />
                            </div>
                          </div>
                          <div>
                            <Label>สีตัวอักษร</Label>
                            <div className="flex gap-2 items-center">
                              <input type="color" value={design.ctaColor} onChange={e => setField("ctaColor", e.target.value)}
                                className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                              <Input value={design.ctaColor} onChange={e => setField("ctaColor", e.target.value)} className="h-9 text-xs font-mono" />
                            </div>
                          </div>
                        </Row>
                        <div>
                          <Label>มุมโค้ง {design.ctaRadius}px</Label>
                          <input type="range" min={0} max={50} value={design.ctaRadius} onChange={e => setField("ctaRadius", +e.target.value)}
                            className="w-full mt-2 accent-orange-500" />
                        </div>
                      </>
                    )}
                  </Section>

                  {/* Layout & Link */}
                  <Section id="layout" title="📐 Layout & ลิงก์">
                    <div>
                      <Label>จัดข้อความ</Label>
                      <div className="flex gap-1">
                        {([["left","◀ ซ้าย"],["center","▬ กลาง"],["right","ขวา ▶"]] as const).map(([v, l]) => (
                          <button key={v} onClick={() => setField("contentAlign", v)}
                            className={cn("flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors",
                              design.contentAlign === v ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:border-orange-300")}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>ตำแหน่งแนวตั้ง</Label>
                      <div className="flex gap-1">
                        {([["flex-start","↑ บน"],["center","• กลาง"],["flex-end","↓ ล่าง"]] as const).map(([v, l]) => (
                          <button key={v} onClick={() => setField("verticalAlign", v)}
                            className={cn("flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors",
                              design.verticalAlign === v ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600 hover:border-orange-300")}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>ลิงก์เมื่อคลิกแบนเนอร์</Label>
                      <Input value={design.linkUrl} onChange={e => setField("linkUrl", e.target.value)} placeholder="/products" />
                    </div>
                  </Section>
                </div>
              )}

              {/* Code Editor */}
              {editorTab === "code" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <span className="text-xs text-gray-400 font-mono">banner.html</span>
                      {codeEdited && <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-medium">แก้ไขแล้ว</span>}
                    </div>
                    <div className="flex gap-2">
                      {codeEdited && (
                        <button onClick={resetCode} className="text-xs text-gray-400 hover:text-orange-400 flex items-center gap-1 transition-colors">
                          <RotateCcw className="h-3 w-3" /> รีเซ็ต
                        </button>
                      )}
                      <button onClick={copyCode} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                        {copied ? <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">คัดลอกแล้ว</span></> : <><Copy className="h-3 w-3" /> คัดลอก</>}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={displayCode}
                    onChange={e => { setManualCode(e.target.value); setCodeEdited(true); }}
                    spellCheck={false}
                    className="flex-1 w-full bg-gray-900 text-gray-100 font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed"
                    style={{ tabSize: 2 }}
                  />
                </div>
              )}
            </div>

            {/* ── Right: Preview ── */}
            <div className="bg-gray-50 flex flex-col">
              {/* Preview tabs */}
              <div className="flex border-b border-gray-100 bg-white px-4 pt-3 gap-1">
                {([["desktop","🖥️ Desktop (1280×320px)"],["mobile","📱 Mobile (375×256px)"]] as const).map(([tab, label]) => (
                  <button key={tab} onClick={() => setPreviewTab(tab)}
                    className={cn("px-4 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors",
                      previewTab === tab ? "text-orange-500 border-orange-500 bg-orange-50" : "text-gray-500 border-transparent hover:text-gray-700")}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex items-start justify-center p-6 overflow-auto">
                {previewTab === "desktop" && (
                  <div className="w-full">
                    <p className="text-xs text-gray-400 mb-2 text-center">พรีวิว Desktop — scaled to fit</p>
                    {/* Scale 1280×320 to fit container */}
                    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg" style={{ paddingBottom: "25%" }}>
                      <iframe
                        srcDoc={displayCode}
                        title="Desktop Preview"
                        sandbox="allow-same-origin"
                        className="absolute inset-0 w-full h-full border-0"
                        style={{ pointerEvents: "none" }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-300 text-center mt-2">อัตราส่วน 4:1 (เหมือนบนเว็บจริง h-80)</p>
                  </div>
                )}

                {previewTab === "mobile" && (
                  <div className="flex flex-col items-center">
                    <p className="text-xs text-gray-400 mb-3 text-center">พรีวิว Mobile (375×256px)</p>
                    {/* Phone mockup */}
                    <div className="relative">
                      <div className="bg-gray-800 rounded-[28px] p-3 shadow-2xl" style={{ width: "280px" }}>
                        {/* Phone camera notch */}
                        <div className="bg-gray-900 rounded-[20px] overflow-hidden" style={{ width: "100%", height: "auto" }}>
                          <div className="bg-black h-5 flex items-center justify-center">
                            <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
                          </div>
                          {/* Banner area — mobile: 375:256 ratio */}
                          <div className="relative overflow-hidden" style={{ aspectRatio: "375/256" }}>
                            <iframe
                              srcDoc={displayCode}
                              title="Mobile Preview"
                              sandbox="allow-same-origin"
                              className="absolute inset-0 border-0"
                              style={{ width: "375px", height: "256px", transform: "scale(0.693)", transformOrigin: "top left", pointerEvents: "none" }}
                            />
                          </div>
                          <div className="bg-white p-2 text-center">
                            <div className="text-[8px] text-gray-400">RTShop</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-300 text-center mt-3">อัตราส่วน 375:256 (เหมือนบนมือถือจริง h-64)</p>
                  </div>
                )}
              </div>

              {/* Quick info */}
              <div className="px-6 py-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>📐 Desktop: 1280×320px</span>
                  <span>📱 Mobile: 375×256px</span>
                  <span>🔗 Link: {design.linkUrl || "–"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Existing Banners List ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ImageIcon className="h-4 w-4" />
              แบนเนอร์ทั้งหมด <span className="font-semibold text-gray-800">{banners.length}</span> รายการ
              · เปิดใช้งาน <span className="font-semibold text-green-600">{banners.filter(b => b.isActive).length}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : banners.length === 0 ? (
            <div className="py-12 text-center text-gray-400">ยังไม่มีแบนเนอร์ — ออกแบบด้านบนแล้วกดบันทึก</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {banners.map((banner, idx) => (
                <div key={banner.id} className={cn("flex items-center gap-4 p-4", !banner.isActive && "opacity-60")}>
                  <div className="cursor-grab text-gray-300 flex-shrink-0"><GripVertical className="h-5 w-5" /></div>

                  {editId === banner.id ? (
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <Input value={editForm.title}    onChange={e => setEditForm({ ...editForm, title: e.target.value })}    placeholder="ชื่อแบนเนอร์" className="text-sm" />
                      <Input value={editForm.imageUrl} onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })} placeholder="imageUrl" className="text-sm font-mono text-xs" />
                      <Input value={editForm.linkUrl}  onChange={e => setEditForm({ ...editForm, linkUrl: e.target.value })}  placeholder="ลิงก์" className="text-sm" />
                    </div>
                  ) : (
                    <>
                      {/* Preview thumbnail */}
                      <div className="relative w-28 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {isCustomHtml(banner.imageUrl) ? (
                          <iframe
                            srcDoc={(() => { try { return decodeURIComponent(escape(atob(banner.imageUrl.slice(6)))); } catch { return ""; } })()}
                            className="absolute inset-0 border-0"
                            style={{ width: "560px", height: "140px", transform: "scale(0.25)", transformOrigin: "top left", pointerEvents: "none" }}
                            sandbox="allow-same-origin"
                          />
                        ) : banner.imageUrl ? (
                          <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" sizes="112px"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-white/60" />
                          </div>
                        )}
                        {!banner.isActive && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-[10px] font-medium">ปิดอยู่</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{banner.title}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          <LinkIcon className="h-3 w-3 flex-shrink-0" />
                          {banner.linkUrl || "ไม่มีลิงก์"}
                        </p>
                        {isCustomHtml(banner.imageUrl) && (
                          <span className="inline-block mt-1 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">Custom Design</span>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => moveUp(banner.id)} disabled={idx === 0}
                      className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-20">
                      <MoveUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => moveDown(banner.id)} disabled={idx === banners.length - 1}
                      className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-20">
                      <MoveDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => toggleActive(banner.id, banner.isActive)}
                      className={cn("p-1.5 rounded-lg transition-colors",
                        banner.isActive ? "text-green-500 hover:text-amber-500 hover:bg-amber-50" : "text-gray-400 hover:text-green-500 hover:bg-green-50")}>
                      {banner.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    {editId === banner.id ? (
                      <>
                        <button onClick={() => saveEdit(banner.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                          <Save className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(banner)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteBanner(banner.id)} disabled={deleting === banner.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
