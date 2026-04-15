import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface StoredModifier {
  id: string;
  name: string;
  price: number;
  posCode?: string;
}

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
          include: { menuItem: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    /**
     * Para cada item de la orden, construimos la lista de PLUs que el script
     * debe tipear en CRE, en orden:
     *
     * 1. PLU del item base — solo si price > 0 (ej. Burrito $11.99)
     *    Si el precio base es $0 (ej. Taco) la carne ya carga el precio.
     *
     * 2. PLUs de los modificadores seleccionados (carnes, extras, etc.)
     *    Se incluyen todos los que tengan posCode, sin importar si son $0.
     *
     * Cualquier PLU no reconocido en CRE muestra "Item Not Found" pero el
     * script AHK lo descarta silenciosamente y continúa con el siguiente.
     */
    const items = order.items.map((item) => {
      const mods: StoredModifier[] = (() => {
        try {
          return JSON.parse(item.modifiers || "[]");
        } catch {
          return [];
        }
      })();

      const plus: string[] = [];

      // Base item PLU (solo si tiene precio propio)
      if (item.price > 0 && item.menuItem?.posCode) {
        plus.push(item.menuItem.posCode);
      }

      // Modifier PLUs
      for (const mod of mods) {
        if (mod.posCode) {
          plus.push(mod.posCode);
        }
      }

      return {
        name: item.name,
        qty: item.quantity,
        plus,
        // Para debug/display
        modNames: mods.map((m) => m.name).join(", "),
      };
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      items,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
