import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { name: "asc" },
      include: {
        category: true,
        modifierGroups: {
          include: { modifiers: { orderBy: { name: "asc" } } },
        },
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, calories, categoryId, image, featured, active, posCode } = body;

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        calories: calories ? parseInt(calories) : null,
        categoryId,
        image,
        posCode: posCode || null,
        featured: featured ?? false,
        active: active ?? true,
      },
      include: { category: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear ítem" }, { status: 500 });
  }
}
