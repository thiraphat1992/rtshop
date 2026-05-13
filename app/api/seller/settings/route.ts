import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function getSellerPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    if (payload.role !== "SELLER" && payload.role !== "ADMIN") return null;
    return payload;
  } catch {
    return null;
  }
}

const settingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  bankName: z.string().max(100).optional(),
  bankAccount: z.string().max(50).optional(),
  bankAccountName: z.string().max(100).optional(),
  promptpayId: z.string().max(20).optional(),
  logo: z.string().max(500).optional(),
  banner: z.string().max(500).optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const payload = await getSellerPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shop = await (prisma.shop as any).findUnique({
      where: { userId: payload.userId },
      select: {
        id: true, name: true, description: true,
        bankName: true, bankAccount: true, promptpayId: true,
        logo: true, banner: true, status: true,
      },
    });

    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Fetch bankAccountName via raw SQL to avoid Prisma client version issues
    const raw = await prisma.$queryRaw<[{ bankAccountName: string | null }]>`
      SELECT bankAccountName FROM shops WHERE userId = ${payload.userId} LIMIT 1
    `;
    const bankAccountName = raw[0]?.bankAccountName ?? "";

    return NextResponse.json({ ...shop, bankAccountName });
  } catch (err) {
    console.error("[seller/settings GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = await getSellerPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shop = await (prisma.shop as any).findUnique({ where: { userId: payload.userId } });
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Separate bankAccountName out — update via raw SQL to avoid Prisma client version issues
    const { bankAccountName, ...prismaData } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.shop as any).update({
      where: { id: shop.id },
      data: prismaData,
      select: {
        id: true, name: true, description: true,
        bankName: true, bankAccount: true, promptpayId: true,
        logo: true, banner: true,
      },
    });

    if (bankAccountName !== undefined) {
      await prisma.$executeRaw`UPDATE shops SET bankAccountName = ${bankAccountName} WHERE id = ${shop.id}`;
    }

    return NextResponse.json({ ...updated, bankAccountName: bankAccountName ?? shop.bankAccountName ?? "" });
  } catch (err) {
    console.error("[seller/settings PUT]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
