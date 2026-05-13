import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  phone: z.string().min(10, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
  shopName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "อีเมลหรือเบอร์โทรศัพท์นี้ถูกใช้งานแล้ว" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
        ...(data.role === "SELLER" && data.shopName
          ? {
              shop: {
                create: {
                  name: data.shopName,
                  slug: data.shopName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
                  bankName: data.bankName,
                  bankAccount: data.bankAccount,
                  status: "PENDING",
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json({
      message: "สมัครสมาชิกสำเร็จ",
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
