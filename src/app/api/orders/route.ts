import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          items: {
            include: { menuItem: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Error al cargar pedidos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerName, notes, paymentMethod } = body;

    const taxSetting = await prisma.settings.findUnique({ where: { key: "tax_rate" } });
    const taxRate = parseFloat(taxSetting?.value || "8.5") / 100;

    const counterSetting = await prisma.settings.findUnique({ where: { key: "order_counter" } });
    const orderNumber = parseInt(counterSetting?.value || "1");

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number; modifiers: { price: number }[] }) => {
      const modTotal = item.modifiers?.reduce((m: number, mod: { price: number }) => m + mod.price, 0) || 0;
      return sum + (item.price + modTotal) * item.quantity;
    }, 0);

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: "pending",
        subtotal,
        tax,
        total,
        paymentMethod: paymentMethod || "cash",
        customerName,
        notes,
        items: {
          create: items.map((item: { menuItemId: string; name: string; price: number; quantity: number; modifiers: CartModifier[]; notes?: string }) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            modifiers: JSON.stringify(item.modifiers || []),
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    });

    await prisma.settings.upsert({
      where: { key: "order_counter" },
      update: { value: (orderNumber + 1).toString() },
      create: { key: "order_counter", value: (orderNumber + 1).toString() },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 });
  }
}

interface CartModifier {
  id: string;
  name: string;
  price: number;
}
