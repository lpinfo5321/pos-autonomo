import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { items: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, sortOrder } = body;

    const category = await prisma.category.create({
      data: { name, icon, sortOrder: sortOrder || 0 },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
