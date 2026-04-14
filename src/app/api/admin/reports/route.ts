import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "today";

    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "all":
        startDate = new Date(0);
        break;
      default: // today
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    // Totales generales
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Productos más vendidos
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = productMap.get(item.menuItemId) ?? {
          name: item.name,
          qty: 0,
          revenue: 0,
        };
        existing.qty += item.quantity;
        existing.revenue += item.price * item.quantity;
        productMap.set(item.menuItemId, existing);
      }
    }
    const topProducts = [...productMap.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // Ventas por hora (para gráfica de barras)
    const byHour: Record<number, number> = {};
    for (const order of orders) {
      const h = new Date(order.createdAt).getHours();
      byHour[h] = (byHour[h] ?? 0) + order.total;
    }

    // Ventas por día (últimos 7 días)
    const byDay: Record<string, number> = {};
    for (const order of orders) {
      const d = new Date(order.createdAt).toLocaleDateString("es-MX", {
        month: "short",
        day: "numeric",
      });
      byDay[d] = (byDay[d] ?? 0) + order.total;
    }

    // Órdenes recientes
    const recentOrders = orders.slice(0, 20).map((o) => ({
      orderNumber: o.orderNumber,
      total: o.total,
      status: o.status,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      avgTicket,
      topProducts,
      byHour,
      byDay,
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
