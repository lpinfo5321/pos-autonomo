import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Este endpoint es usado por el script AutoHotKey para obtener los PLU de CRE
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const num = parseInt(orderNumber);
    if (isNaN(num)) {
      return NextResponse.json({ error: "Número inválido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: num },
      include: {
        items: {
          include: {
            menuItem: { select: { posCode: true, name: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Construir lista de PLU codes para CRE
    const posCodes: { plu: string; qty: number; name: string }[] = [];
    for (const item of order.items) {
      const plu = item.menuItem?.posCode;
      if (plu) {
        posCodes.push({ plu, qty: item.quantity, name: item.name });
      }
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      items: posCodes,
      // Si algún ítem no tiene PLU, lo reportamos
      missing: order.items
        .filter((i) => !i.menuItem?.posCode)
        .map((i) => i.name),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
