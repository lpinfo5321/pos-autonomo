import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      pendingOrders,
      totalItems,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "cancelled" } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: today }, status: { not: "cancelled" } },
      }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.menuItem.count({ where: { active: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
    ]);

    // Revenue by day for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayRevenue = await prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: date, lt: nextDate },
          status: { not: "cancelled" },
        },
      });

      last7Days.push({
        date: date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
        revenue: dayRevenue._sum.total || 0,
      });
    }

    return NextResponse.json({
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      todayRevenue: todayRevenue._sum.total || 0,
      pendingOrders,
      totalItems,
      recentOrders,
      last7Days,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Error al cargar estadísticas" }, { status: 500 });
  }
}
