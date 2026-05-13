import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { slipUrl } = await req.json();
  if (!slipUrl) return NextResponse.json({ error: "slipUrl required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.order.update({
    where: { id },
    data: { slipUrl, slipUploadedAt: new Date(), paymentVerified: false },
  });

  return NextResponse.json({ ok: true });
}
