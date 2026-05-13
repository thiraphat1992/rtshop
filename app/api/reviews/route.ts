import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  try {
    const body = await req.json();
    const data = reviewSchema.parse(body);

    // Verify user bought this product (has a DELIVERED order containing it)
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId: data.productId,
        order: { userId: user.id, status: "DELIVERED" },
      },
    });
    if (!purchased) {
      return NextResponse.json({ message: "คุณต้องซื้อสินค้านี้ก่อนจึงจะรีวิวได้" }, { status: 403 });
    }

    // Check duplicate review
    const existing = await prisma.review.findFirst({
      where: { productId: data.productId, userId: user.id },
    });
    if (existing) {
      return NextResponse.json({ message: "คุณรีวิวสินค้านี้แล้ว" }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
      },
      include: { user: { select: { name: true, avatar: true } } },
    });

    // Update product rating average
    const stats = await prisma.review.aggregate({
      where: { productId: data.productId },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.product.update({
      where: { id: data.productId },
      data: {
        rating: stats._avg.rating ?? 0,
        reviewCount: stats._count.id,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
