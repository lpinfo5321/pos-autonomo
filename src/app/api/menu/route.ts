import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { active: true },
          orderBy: { name: "asc" },
          include: {
            modifierGroups: {
              include: {
                modifiers: {
                  where: { active: true },
                  orderBy: { name: "asc" },
                },
              },
            },
          },
        },
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json({ error: "Error al cargar el menú" }, { status: 500 });
  }
}
