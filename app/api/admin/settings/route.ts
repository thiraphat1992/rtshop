import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { z } from "zod";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    if (payload.role !== "ADMIN") return null;
    return payload;
  } catch {
    return null;
  }
}

interface SectionConfig {
  enabled: boolean;
  fields: Record<string, string>;
}

type SettingsStore = {
  payment: Record<string, SectionConfig>;
  shipping: Record<string, SectionConfig>;
};

const sectionSchema = z.object({
  enabled: z.boolean(),
  fields: z.record(z.string(), z.string()),
});

const settingsSchema = z.object({
  payment:  z.record(z.string(), sectionSchema).optional(),
  shipping: z.record(z.string(), sectionSchema).optional(),
});

// In-memory store (replace with DB/file in production)
let settings: SettingsStore = {
  payment: {
    promptpay:   { enabled: true,  fields: {} },
    credit_card: { enabled: false, fields: {} },
    gbprime:     { enabled: false, fields: {} },
    cod:         { enabled: true,  fields: { cod_fee_type: "ฟรี (ไม่คิดค่าธรรมเนียม)" } },
  },
  shipping: {
    flash:         { enabled: true,  fields: {} },
    kerry:         { enabled: true,  fields: {} },
    jt:            { enabled: true,  fields: {} },
    thailand_post: { enabled: false, fields: {} },
    scg:           { enabled: false, fields: {} },
    ninja:         { enabled: false, fields: {} },
  },
};

function maskFields(section: SectionConfig): SectionConfig {
  return {
    enabled: section.enabled,
    fields: Object.fromEntries(
      Object.entries(section.fields).map(([k, v]) =>
        k.includes("key") || k.includes("secret") || k.includes("token")
          ? [k, v ? "••••••••" : ""]
          : [k, v]
      )
    ),
  };
}

export async function GET(_req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    payment:  Object.fromEntries(Object.entries(settings.payment).map(([k, v]) => [k, maskFields(v)])),
    shipping: Object.fromEntries(Object.entries(settings.shipping).map(([k, v]) => [k, maskFields(v)])),
  });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  if (parsed.data.payment) {
    for (const [id, data] of Object.entries(parsed.data.payment)) {
      const existing: SectionConfig = settings.payment[id] ?? { enabled: false, fields: {} };
      const mergedFields = { ...existing.fields };
      for (const [fk, fv] of Object.entries(data.fields)) {
        if (fv !== "••••••••") mergedFields[fk] = fv;
      }
      settings.payment[id] = { enabled: data.enabled, fields: mergedFields };
    }
  }

  if (parsed.data.shipping) {
    for (const [id, data] of Object.entries(parsed.data.shipping)) {
      const existing: SectionConfig = settings.shipping[id] ?? { enabled: false, fields: {} };
      const mergedFields = { ...existing.fields };
      for (const [fk, fv] of Object.entries(data.fields)) {
        if (fv !== "••••••••") mergedFields[fk] = fv;
      }
      settings.shipping[id] = { enabled: data.enabled, fields: mergedFields };
    }
  }

  return NextResponse.json({ success: true });
}

// Public endpoint for buyer checkout / payment pages
export async function POST(_req: NextRequest) {
  const cod = settings.payment["cod"];
  const pp = settings.payment["promptpay"];
  return NextResponse.json({
    paymentMethods:  Object.entries(settings.payment).filter(([, v]) => v.enabled).map(([id]) => id),
    carriers:        Object.entries(settings.shipping).filter(([, v]) => v.enabled).map(([id]) => id),
    promptpayEnabled: pp?.enabled ?? false,
    promptpayId:     pp?.fields["promptpay_id"] ?? "",
    promptpayName:   pp?.fields["promptpay_name"] ?? "RTShop",
    codEnabled:      cod?.enabled ?? false,
    codFeeType:      cod?.fields["cod_fee_type"] ?? "ฟรี",
    codFeeValue:     cod?.fields["cod_fee_value"] ?? "0",
    codMaxAmount:    cod?.fields["cod_max_amount"] ?? "",
    codMinAmount:    cod?.fields["cod_min_amount"] ?? "",
  });
}
