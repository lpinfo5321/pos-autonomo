import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, calories, categoryId, image, featured, active, posCode } = body;

    const item = await prisma.menuItem.update({
      where: { id },
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
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
