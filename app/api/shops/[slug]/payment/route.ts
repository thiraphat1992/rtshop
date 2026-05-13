import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shop = await (prisma.shop as any).findUnique({
      where: { id: slug },
      select: { name: true, bankName: true, bankAccount: true, promptpayId: true },
    });
    if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Get bankAccountName via raw SQL to avoid Prisma client version issues
    const raw = await prisma.$queryRaw<[{ bankAccountName: string | null }]>`
      SELECT bankAccountName FROM shops WHERE id = ${slug} LIMIT 1
    `;
    const bankAccountName = raw[0]?.bankAccountName ?? null;

    return NextResponse.json({ ...shop, bankAccountName });
  } catch (err) {
    console.error("[shops/payment GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
