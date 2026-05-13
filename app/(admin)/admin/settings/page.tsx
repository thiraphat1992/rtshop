"use client";

import React, { useState } from "react";
import {
  CreditCard, Truck, QrCode, Wallet, Package,
  Save, Eye, EyeOff, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { cn } from "@/lib/utils";

// ─── Payment methods ───────────────────────────────────────────────────────

interface PaymentMethod {
  id: string;
  name: string;
  nameEn: string;
  icon: React.ReactNode;
  enabled: boolean;
  color: string;
  fields: FieldDef[];
  note?: string;
}

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "password" | "number" | "select";
  options?: string[];
  hint?: string;
}

const initialPaymentMethods: PaymentMethod[] = [
  {
    id: "promptpay",
    name: "พร้อมเพย์ (QR Code)",
    nameEn: "PromptPay",
    icon: <QrCode className="h-5 w-5" />,
    enabled: true,
    color: "bg-purple-100 text-purple-600",
    note: "ลูกค้าสแกน QR จ่ายเงินผ่านแอปธนาคาร ไม่มีค่าธรรมเนียม",
    fields: [
      { key: "promptpay_id",    label: "เลขพร้อมเพย์ (เบอร์โทร / เลขประชาชน)", placeholder: "0812345678", hint: "ใช้สำหรับสร้าง QR Code ชำระเงิน" },
      { key: "promptpay_name",  label: "ชื่อบัญชี",           placeholder: "บริษัท อาร์ทีชอป จำกัด" },
      { key: "omise_public_key", label: "Omise Public Key (ถ้าใช้)", placeholder: "pkey_test_...", type: "password" },
      { key: "omise_secret_key", label: "Omise Secret Key (ถ้าใช้)", placeholder: "skey_test_...", type: "password" },
    ],
  },
  {
    id: "credit_card",
    name: "บัตรเครดิต / เดบิต",
    nameEn: "Credit / Debit Card",
    icon: <CreditCard className="h-5 w-5" />,
    enabled: false,
    color: "bg-blue-100 text-blue-600",
    note: "รองรับ Visa, Mastercard, JCB — ค่าธรรมเนียม ~1.5–3%",
    fields: [
      { key: "payment_gateway", label: "Payment Gateway", placeholder: "", type: "select", options: ["Omise", "GB Prime Pay", "2C2P", "Stripe"] },
      { key: "cc_public_key",  label: "Public Key",  placeholder: "pkey_...",  type: "password" },
      { key: "cc_secret_key",  label: "Secret Key",  placeholder: "skey_...",  type: "password" },
      { key: "cc_webhook_key", label: "Webhook Key", placeholder: "whkey_...", type: "password" },
    ],
  },
  {
    id: "gbprime",
    name: "GB Prime Pay",
    nameEn: "GB Prime Pay",
    icon: <Wallet className="h-5 w-5" />,
    enabled: false,
    color: "bg-emerald-100 text-emerald-600",
    note: "รองรับบัตรเครดิต, QR Code, PromptPay, TrueMoney Wallet",
    fields: [
      { key: "gbprime_public_key", label: "GB Prime Public Key", placeholder: "...", type: "password" },
      { key: "gbprime_secret_key", label: "GB Prime Secret Key", placeholder: "...", type: "password" },
      { key: "gbprime_token",      label: "GB Prime Token",      placeholder: "...", type: "password" },
    ],
  },
  {
    id: "cod",
    name: "เก็บเงินปลายทาง (COD)",
    nameEn: "Cash on Delivery",
    icon: <Package className="h-5 w-5" />,
    enabled: true,
    color: "bg-orange-100 text-orange-600",
    note: "ลูกค้าชำระเงินเมื่อได้รับสินค้า — เพิ่มค่าธรรมเนียม COD ได้",
    fields: [
      { key: "cod_fee_type",   label: "ประเภทค่าธรรมเนียม COD", placeholder: "", type: "select", options: ["ฟรี (ไม่คิดค่าธรรมเนียม)", "จำนวนคงที่ (บาท)", "เปอร์เซ็นต์ (%)"] },
      { key: "cod_fee_value",  label: "จำนวนค่าธรรมเนียม",      placeholder: "เช่น 30 (บาท) หรือ 2 (%)", type: "number" },
      { key: "cod_max_amount", label: "ยอดสั่งซื้อสูงสุดที่ใช้ COD ได้ (บาท)", placeholder: "เช่น 5000 (ว่าง = ไม่จำกัด)", type: "number", hint: "ว่างไว้หากต้องการไม่จำกัดยอด" },
      { key: "cod_min_amount", label: "ยอดสั่งซื้อต่ำสุด (บาท)", placeholder: "เช่น 200", type: "number" },
    ],
  },
];

// ─── Shipping carriers ─────────────────────────────────────────────────────

interface Carrier {
  id: string;
  name: string;
  logo: string;
  enabled: boolean;
  color: string;
  fields: FieldDef[];
  note?: string;
}

const initialCarriers: Carrier[] = [
  {
    id: "flash",
    name: "Flash Express",
    logo: "⚡",
    enabled: true,
    color: "bg-yellow-100 text-yellow-700",
    note: "ราคาถูก จัดส่งทั่วไทย รับพัสดุถึงบ้าน",
    fields: [
      { key: "flash_api_key",    label: "Flash API Key",    placeholder: "flash_api_...", type: "password" },
      { key: "flash_secret_key", label: "Flash Secret Key", placeholder: "flash_secret_...", type: "password" },
      { key: "flash_sender_name", label: "ชื่อผู้ส่ง (ค่าเริ่มต้น)", placeholder: "RTShop" },
      { key: "flash_sender_phone", label: "เบอร์ผู้ส่ง (ค่าเริ่มต้น)", placeholder: "0812345678" },
    ],
  },
  {
    id: "kerry",
    name: "Kerry Express",
    logo: "🚚",
    enabled: true,
    color: "bg-red-100 text-red-700",
    note: "บริการครอบคลุม, รองรับ COD",
    fields: [
      { key: "kerry_merchant_id", label: "Kerry Merchant ID", placeholder: "KER_MERCHANT_..." },
      { key: "kerry_api_key",    label: "Kerry API Key",     placeholder: "...", type: "password" },
      { key: "kerry_api_secret", label: "Kerry API Secret",  placeholder: "...", type: "password" },
    ],
  },
  {
    id: "jt",
    name: "J&T Express",
    logo: "📦",
    enabled: true,
    color: "bg-red-100 text-red-700",
    note: "บริการรวดเร็ว รับพัสดุทุกวัน",
    fields: [
      { key: "jt_customer_id",  label: "J&T Customer ID",  placeholder: "JT_..." },
      { key: "jt_api_key",      label: "J&T API Key",      placeholder: "...", type: "password" },
      { key: "jt_private_key",  label: "J&T Private Key",  placeholder: "...", type: "password" },
    ],
  },
  {
    id: "thailand_post",
    name: "ไปรษณีย์ไทย (EMS / Registered)",
    logo: "✉️",
    enabled: false,
    color: "bg-orange-100 text-orange-700",
    note: "เหมาะกับของชิ้นเล็ก น้ำหนักเบา ราคาถูก",
    fields: [
      { key: "thpost_license_key", label: "Thailand Post License Key", placeholder: "...", type: "password" },
      { key: "thpost_token",       label: "Access Token",              placeholder: "...", type: "password" },
    ],
  },
  {
    id: "scg",
    name: "SCG Express",
    logo: "🟠",
    enabled: false,
    color: "bg-orange-100 text-orange-700",
    note: "บริการระดับพรีเมียม รวดเร็ว",
    fields: [
      { key: "scg_api_key",    label: "SCG API Key",    placeholder: "...", type: "password" },
      { key: "scg_api_secret", label: "SCG API Secret", placeholder: "...", type: "password" },
    ],
  },
  {
    id: "ninja",
    name: "Ninja Van",
    logo: "🥷",
    enabled: false,
    color: "bg-gray-100 text-gray-700",
    note: "บริการระดับภูมิภาค รองรับ Express",
    fields: [
      { key: "ninja_client_id",     label: "Ninja Van Client ID",     placeholder: "..." },
      { key: "ninja_client_secret", label: "Ninja Van Client Secret", placeholder: "...", type: "password" },
      { key: "ninja_country",       label: "Country Code",            placeholder: "TH" },
    ],
  },
];

// ─── Saved field values ────────────────────────────────────────────────────

type FieldValues = Record<string, Record<string, string>>;

// ─── Toggle component ──────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "w-11 h-6 rounded-full transition-colors relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-300",
        value ? "bg-orange-500" : "bg-gray-200"
      )}
    >
      <span className={cn(
        "w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform",
        value ? "translate-x-6" : "translate-x-1"
      )} />
    </button>
  );
}

// ─── Expandable section ───────────────────────────────────────────────────

function Section({
  id, name, logo, icon, enabled, onToggle,
  fields, values, onFieldChange, color, note,
  children,
}: {
  id: string; name: string; logo?: string; icon?: React.ReactNode;
  enabled: boolean; onToggle: () => void;
  fields: FieldDef[]; values: Record<string, string>;
  onFieldChange: (key: string, val: string) => void;
  color: string; note?: string; children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border-2 transition-colors overflow-hidden",
      enabled ? "border-transparent" : "border-gray-100"
    )}>
      {/* Header */}
      <div className="flex items-center gap-4 p-5">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0", color)}>
          {logo ?? icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{name}</p>
          {note && <p className="text-xs text-gray-400 mt-0.5 truncate">{note}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("text-xs font-medium", enabled ? "text-orange-600" : "text-gray-400")}>
            {enabled ? "เปิดใช้งาน" : "ปิดอยู่"}
          </span>
          <Toggle value={enabled} onChange={onToggle} />
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Fields */}
      {open && (
        <div className="px-5 pb-5 border-t border-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-3">การตั้งค่า API</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-gray-700 mb-1 block">{f.label}</label>
                {f.type === "select" ? (
                  <select
                    value={values[f.key] ?? ""}
                    onChange={(e) => onFieldChange(f.key, e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- เลือก --</option>
                    {f.options?.map((opt) => <option key={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <div className="relative">
                    <Input
                      type={f.type === "password" ? (showPwd[f.key] ? "text" : "password") : (f.type ?? "text")}
                      value={values[f.key] ?? ""}
                      onChange={(e) => onFieldChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="pr-9"
                    />
                    {f.type === "password" && (
                      <button
                        type="button"
                        onClick={() => setShowPwd((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPwd[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                )}
                {f.hint && <p className="text-[10px] text-gray-400 mt-0.5">{f.hint}</p>}
              </div>
            ))}
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"payment" | "shipping">("payment");
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [carriers, setCarriers] = useState(initialCarriers);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [saved, setSaved] = useState(false);

  const togglePayment = (id: string) =>
    setPaymentMethods((prev) => prev.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m));

  const toggleCarrier = (id: string) =>
    setCarriers((prev) => prev.map((c) => c.id === id ? { ...c, enabled: !c.enabled } : c));

  const setFieldValue = (sectionId: string, key: string, val: string) =>
    setFieldValues((prev) => ({ ...prev, [sectionId]: { ...prev[sectionId], [key]: val } }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const enabledPayments = paymentMethods.filter((m) => m.enabled).length;
  const enabledCarriers = carriers.filter((c) => c.enabled).length;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="ตั้งค่าชำระเงิน & ขนส่ง" />

      <div className="flex-1 p-6 space-y-5">
        {/* Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm flex gap-1 w-fit">
          <button
            onClick={() => setActiveTab("payment")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors",
              activeTab === "payment" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <CreditCard className="h-4 w-4" /> การชำระเงิน
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              activeTab === "payment" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            )}>{enabledPayments}</span>
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors",
              activeTab === "shipping" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Truck className="h-4 w-4" /> บริการขนส่ง
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              activeTab === "shipping" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            )}>{enabledCarriers}</span>
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            {activeTab === "payment"
              ? "ตั้งค่า API Key ของแต่ละช่องทางชำระเงิน เพื่อรองรับการทำงานจริง ค่า Key จะถูกเข้ารหัสก่อนบันทึก ลูกค้าจะเห็นเฉพาะช่องทางที่ เปิดใช้งาน เท่านั้น"
              : "เปิด/ปิดขนส่งแต่ละเจ้า และกรอก API Key เพื่อดึงค่าขนส่งอัตโนมัติและพิมพ์ใบปะหน้า ขนส่งที่ เปิดใช้งาน จะแสดงให้ผู้ขายเลือก"
            }
          </p>
        </div>

        {/* Payment Methods */}
        {activeTab === "payment" && (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Section
                key={method.id}
                id={method.id}
                name={method.name}
                icon={method.icon}
                enabled={method.enabled}
                onToggle={() => togglePayment(method.id)}
                fields={method.fields}
                values={fieldValues[method.id] ?? {}}
                onFieldChange={(k, v) => setFieldValue(method.id, k, v)}
                color={method.color}
                note={method.note}
              >
                {/* COD extra: visual fee summary */}
                {method.id === "cod" && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-xl">
                    <p className="text-xs font-semibold text-orange-700 mb-1">ตัวอย่างแสดงผลฝั่งลูกค้า</p>
                    <p className="text-xs text-orange-600">
                      {(fieldValues["cod"]?.["cod_fee_type"] ?? "ฟรี").includes("ฟรี")
                        ? "✅ เก็บเงินปลายทาง (ฟรีค่าธรรมเนียม)"
                        : (fieldValues["cod"]?.["cod_fee_type"] ?? "").includes("%")
                        ? `✅ เก็บเงินปลายทาง (+${fieldValues["cod"]?.["cod_fee_value"] ?? "?"}% ของยอดรวม)`
                        : `✅ เก็บเงินปลายทาง (+฿${fieldValues["cod"]?.["cod_fee_value"] ?? "?"} ค่า COD)`
                      }
                    </p>
                  </div>
                )}
              </Section>
            ))}
          </div>
        )}

        {/* Shipping carriers */}
        {activeTab === "shipping" && (
          <div className="space-y-3">
            {carriers.map((carrier) => (
              <Section
                key={carrier.id}
                id={carrier.id}
                name={carrier.name}
                logo={carrier.logo}
                enabled={carrier.enabled}
                onToggle={() => toggleCarrier(carrier.id)}
                fields={carrier.fields}
                values={fieldValues[carrier.id] ?? {}}
                onFieldChange={(k, v) => setFieldValue(carrier.id, k, v)}
                color={carrier.color}
                note={carrier.note}
              />
            ))}
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} className="gap-2 px-6" disabled={saved}>
            {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "บันทึกแล้ว!" : "บันทึกการตั้งค่าทั้งหมด"}
          </Button>
          {saved && (
            <p className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" /> บันทึกเรียบร้อย
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
