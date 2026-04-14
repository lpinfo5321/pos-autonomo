import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const [order, kioskPluSetting] = await Promise.all([
      prisma.order.findUnique({
        where: { orderNumber: num },
        include: { items: true },
      }),
      prisma.setting.findUnique({ where: { key: "cre_kiosk_plu" } }),
    ]);

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const kioskPlu = kioskPluSetting?.value ?? "";

    // Resumen de ítems para mostrar en logs / debug
    const itemsSummary = order.items.map((i) => ({
      name: i.name,
      qty: i.quantity,
      price: i.price,
    }));

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      kioskPlu,          // PLU único configurado en admin settings
      items: itemsSummary,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
