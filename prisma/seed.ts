import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.admin.upsert({
    where: { email: "admin@posapp.com" },
    update: {},
    create: {
      email: "admin@posapp.com",
      password: hashedPassword,
      name: "Administrador",
      role: "admin",
    },
  });

  // Settings
  const defaultSettings = [
    { key: "restaurant_name", value: "Mi Restaurante" },
    { key: "tax_rate", value: "8.5" },
    { key: "currency", value: "USD" },
    { key: "square_access_token", value: "" },
    { key: "square_location_id", value: "" },
    { key: "square_environment", value: "sandbox" },
    { key: "welcome_message", value: "¡Bienvenido! Toca para ordenar" },
    { key: "logo_url", value: "" },
    { key: "primary_color", value: "#22c55e" },
    { key: "order_counter", value: "1" },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Categories
  const categories = [
    { name: "Especiales", icon: "⭐", sortOrder: 0 },
    { name: "Burgers & Más", icon: "🍔", sortOrder: 1 },
    { name: "Pollo", icon: "🍗", sortOrder: 2 },
    { name: "Opciones Saludables", icon: "🥗", sortOrder: 3 },
    { name: "Acompañamientos", icon: "🍟", sortOrder: 4 },
    { name: "Malteadas & Postres", icon: "🍦", sortOrder: 5 },
    { name: "Bebidas", icon: "🥤", sortOrder: 6 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { id: cat.name },
      update: {},
      create: { ...cat },
    });
    createdCategories[cat.name] = created.id;
  }

  // Get all categories
  const allCategories = await prisma.category.findMany();
  const catMap: Record<string, string> = {};
  for (const c of allCategories) {
    catMap[c.name] = c.id;
  }

  // Menu items
  const menuItems = [
    // Especiales
    {
      name: "Clubhouse Pimento Cheese Burger",
      description: "Hamburguesa 100% Angus con queso pimento cremoso, lechuga, tomate y ShackSauce en pan de papa tostado.",
      price: 9.99,
      calories: 690,
      categoryId: catMap["Especiales"],
      featured: true,
      image: "/images/burger-special.jpg",
    },
    {
      name: "K-Shack Fried Chicken Sandwich",
      description: "Sándwich de pollo frito estilo coreano con salsa gochujang y kimchi slaw.",
      price: 10.49,
      calories: 650,
      categoryId: catMap["Especiales"],
      image: "/images/chicken-special.jpg",
    },
    // Burgers
    {
      name: "ShackBurger",
      description: "100% Angus con lechuga, tomate, ShackSauce en pan de papa tostado.",
      price: 8.49,
      calories: 560,
      categoryId: catMap["Burgers & Más"],
      featured: true,
      image: "/images/shackburger.jpg",
    },
    {
      name: "Smoke ShackBurger",
      description: "ShackBurger con tocino y cherry peppers.",
      price: 9.99,
      calories: 670,
      categoryId: catMap["Burgers & Más"],
      image: "/images/smoke-shack.jpg",
    },
    {
      name: "ShroomBurger",
      description: "Hongo portobello frito con muenster y cheddar, lechuga, tomate y ShackSauce.",
      price: 9.49,
      calories: 490,
      categoryId: catMap["Burgers & Más"],
    },
    {
      name: "ShackStack",
      description: "ShackBurger con ShroomBurger.",
      price: 12.49,
      calories: 1060,
      categoryId: catMap["Burgers & Más"],
    },
    // Pollo
    {
      name: "Chicken Shack",
      description: "Pechuga de pollo sin antibióticos, empanada a mano, con lechuga, pickles y mayo de hierbas.",
      price: 8.49,
      calories: 550,
      categoryId: catMap["Pollo"],
      featured: true,
      image: "/images/chicken-shack.jpg",
    },
    {
      name: "Spicy Chicken Shack",
      description: "Igual que el Chicken Shack pero con salsa picante especial.",
      price: 8.99,
      calories: 570,
      categoryId: catMap["Pollo"],
    },
    // Saludables
    {
      name: "Lettuce Wrap",
      description: "Cualquier sandwich envuelto en lechuga en lugar de pan. -180 cal.",
      price: 0.00,
      calories: -180,
      categoryId: catMap["Opciones Saludables"],
    },
    // Acompañamientos
    {
      name: "Fries",
      description: "Papas fritas crinkle-cut.",
      price: 3.99,
      calories: 470,
      categoryId: catMap["Acompañamientos"],
      featured: true,
    },
    {
      name: "Cheese Fries",
      description: "Papas fritas con queso cheddar.",
      price: 4.99,
      calories: 620,
      categoryId: catMap["Acompañamientos"],
    },
    {
      name: "K-Shack Spicy BBQ Cheese Fries",
      description: "Papas fritas con salsa BBQ picante y queso.",
      price: 6.49,
      calories: 710,
      categoryId: catMap["Acompañamientos"],
    },
    // Malteadas
    {
      name: "Chocolate Shake",
      description: "Malteada de chocolate con leche 100% natural.",
      price: 6.99,
      calories: 770,
      categoryId: catMap["Malteadas & Postres"],
      featured: true,
    },
    {
      name: "Vanilla Shake",
      description: "Malteada de vainilla pura.",
      price: 6.99,
      calories: 680,
      categoryId: catMap["Malteadas & Postres"],
    },
    {
      name: "Strawberry Shake",
      description: "Malteada de fresa fresca.",
      price: 6.99,
      calories: 740,
      categoryId: catMap["Malteadas & Postres"],
    },
    // Bebidas
    {
      name: "Coke",
      description: "Coca-Cola regular.",
      price: 3.49,
      calories: 140,
      categoryId: catMap["Bebidas"],
    },
    {
      name: "Coke Zero",
      description: "Coca-Cola Zero azúcar.",
      price: 3.49,
      calories: 0,
      categoryId: catMap["Bebidas"],
    },
    {
      name: "Sprite",
      description: "Sprite fresca.",
      price: 3.49,
      calories: 130,
      categoryId: catMap["Bebidas"],
    },
    {
      name: "Agua",
      description: "Agua mineral natural.",
      price: 2.99,
      calories: 0,
      categoryId: catMap["Bebidas"],
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }

  // Add modifiers for Chicken Shack
  const chickenShack = await prisma.menuItem.findFirst({ where: { name: "Chicken Shack" } });
  if (chickenShack) {
    const group = await prisma.modifierGroup.create({
      data: {
        name: "Ingredientes",
        required: false,
        multiSelect: true,
        menuItemId: chickenShack.id,
      },
    });

    await prisma.modifier.createMany({
      data: [
        { name: "Herb Mayo", price: 0, calories: 90, modifierGroupId: group.id },
        { name: "Pickle", price: 0, calories: 1, modifierGroupId: group.id },
        { name: "Shredded Lettuce", price: 0, calories: 1, modifierGroupId: group.id },
        { name: "Avocado", price: 1.99, calories: 60, modifierGroupId: group.id },
        { name: "Bacon", price: 1.99, calories: 70, modifierGroupId: group.id },
        { name: "Cherry Peppers", price: 0.50, calories: 10, modifierGroupId: group.id },
        { name: "Crispy Onions", price: 1.29, calories: 110, modifierGroupId: group.id },
        { name: "Shack Sauce", price: 0, calories: 60, modifierGroupId: group.id },
      ],
    });
  }

  // Add modifiers for ShackBurger
  const shackBurger = await prisma.menuItem.findFirst({ where: { name: "ShackBurger" } });
  if (shackBurger) {
    const group = await prisma.modifierGroup.create({
      data: {
        name: "Personalizar",
        required: false,
        multiSelect: true,
        menuItemId: shackBurger.id,
      },
    });

    await prisma.modifier.createMany({
      data: [
        { name: "ShackSauce", price: 0, calories: 70, modifierGroupId: group.id },
        { name: "Lechuga", price: 0, calories: 5, modifierGroupId: group.id },
        { name: "Tomate", price: 0, calories: 10, modifierGroupId: group.id },
        { name: "Bacon", price: 1.99, calories: 70, modifierGroupId: group.id },
        { name: "Queso Extra", price: 1.29, calories: 90, modifierGroupId: group.id },
        { name: "Avocado", price: 1.99, calories: 60, modifierGroupId: group.id },
      ],
    });
  }

  // Size modifiers for Bebidas
  const coke = await prisma.menuItem.findFirst({ where: { name: "Coke" } });
  if (coke) {
    const sizeGroup = await prisma.modifierGroup.create({
      data: {
        name: "Tamaño",
        required: true,
        multiSelect: false,
        minSelect: 1,
        maxSelect: 1,
        menuItemId: coke.id,
      },
    });
    await prisma.modifier.createMany({
      data: [
        { name: "Pequeño", price: 0, calories: 100, modifierGroupId: sizeGroup.id },
        { name: "Mediano", price: 0.50, calories: 180, modifierGroupId: sizeGroup.id },
        { name: "Grande", price: 1.00, calories: 260, modifierGroupId: sizeGroup.id },
      ],
    });
  }

  console.log("✅ Seed completado exitosamente");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
