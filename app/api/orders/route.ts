import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
      ...(status && status !== "all" ? { status: status as any } : {}),
    },
    include: {
      items: {
        include: {
          product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

const createOrderSchema = z.object({
  addressId: z.string(),
  shippingMethod: z.string(),
  paymentMethod: z.string(),
  couponId: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      variantId: z.string().optional(),
    })
  ),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createOrderSchema.parse(body);

    // Verify address belongs to user
    const address = await prisma.address.findFirst({ where: { id: data.addressId, userId: authUser.id } });
    if (!address) return NextResponse.json({ message: "ไม่พบที่อยู่จัดส่ง" }, { status: 400 });

    const products = await prisma.product.findMany({
      where: { id: { in: data.items.map((i) => i.productId) } },
    });

    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`ไม่พบสินค้า: ${item.productId}`);
      if (product.stock < item.quantity) throw new Error(`สินค้า ${product.name} มีไม่พอ`);

      const price = Number(product.price);
      subtotal += price * item.quantity;

      return { productId: item.productId, quantity: item.quantity, price, variantId: item.variantId };
    });

    const shippingFee = subtotal >= 299 ? 0 : 50;
    const total = subtotal + shippingFee;

    const orderCount = await prisma.order.count();
    const orderNumber = `RTSHOP0${String(orderCount + 1).padStart(6, "0")}`;

    const isCod = data.paymentMethod === "cod";

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: authUser.id,
        addressId: data.addressId,
        shippingMethod: data.shippingMethod,
        paymentMethod: data.paymentMethod,
        couponId: data.couponId,
        subtotal,
        shippingFee,
        total,
        note: data.note,
        ...(isCod ? { status: "PAID", paymentStatus: "SUCCESS" } : {}),
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    // Decrement stock
    await Promise.all(
      data.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity }, sold: { increment: item.quantity } },
        })
      )
    );

    const shopId = products[0]?.shopId ?? null;
    return NextResponse.json({ message: "สร้างคำสั่งซื้อสำเร็จ", orderId: order.id, shopId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
