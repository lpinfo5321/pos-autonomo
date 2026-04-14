import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const modifier = await prisma.modifier.update({
      where: { id },
      data: { image: body.image ?? null },
    });
    return NextResponse.json(modifier);
  } catch {
    return NextResponse.json({ error: "Error al actualizar modificador" }, { status: 500 });
  }
}
