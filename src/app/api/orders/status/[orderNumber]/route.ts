import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const num = parseInt(orderNumber);
    if (isNaN(num)) {
      return NextResponse.json({ error: "Número de orden inválido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: num },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order status:", error);
    return NextResponse.json({ error: "Error al obtener estado" }, { status: 500 });
  }
}
