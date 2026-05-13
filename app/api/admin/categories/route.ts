import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  icon: z.string().max(10).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(_req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { name, slug, icon, isActive, sortOrder } = parsed.data;
  const finalSlug = slug || name.toLowerCase().replace(/[\s]+/g, "-").replace(/[^a-z0-9-]/g, "") || `cat-${Date.now()}`;

  try {
    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        icon: icon ?? "📦",
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug ซ้ำกัน" }, { status: 400 });
  }
}
