/**
 * Importación completa del inventario de La Primavera Restaurant
 * Cada producto tiene sus modificadores reales (carnes, extras) con PLU de CRE
 */
import * as dotenv from "dotenv";
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

// ── Extras comunes (aplican a la mayoría de items) ───────────────────────────
const EXTRAS_COMUNES = [
  { name: "+ Cilantro",       price: 0.15, posCode: "68MOD" },
  { name: "+ Cebolla",        price: 0.15, posCode: "69MOD" },
  { name: "+ Cebolla Asada",  price: 0.50, posCode: "64MOD" },
  { name: "+ Aguacate",       price: 0.75, posCode: "60MOD" },
  { name: "+ Crema",          price: 0.35, posCode: "63MOD" },
  { name: "+ Queso Fresco",   price: 0.35, posCode: "65MOD" },
  { name: "+ Queso Mozzarella",price:0.35, posCode: "66MOD" },
  { name: "+ Queso Cotija",   price: 0.35, posCode: "67MOD" },
  { name: "+ Tomate",         price: 0.20, posCode: "62MOD" },
  { name: "+ Lechuga",        price: 0.20, posCode: "61MOD" },
  { name: "+ Valentina",      price: 0.50, posCode: "135MOD" },
];

const EXTRAS_TACO = [
  ...EXTRAS_COMUNES,
  { name: "+ Arroz",          price: 0.20, posCode: "242MOD" },
  { name: "+ Frijol",         price: 0.20, posCode: "70MOD" },
  { name: "+ Limón",          price: 0.20, posCode: "71MOD" },
];

// ── Carnes por tipo de platillo ───────────────────────────────────────────────

// TACO: la carne es el precio (base $0)
const CARNES_TACO = [
  { name: "Asada",            price: 2.75, posCode: "8MOD" },
  { name: "Pollo",            price: 2.75, posCode: "6MOD" },
  { name: "Carnitas",         price: 2.75, posCode: "2MOD" },
  { name: "Barbacoa Borrego", price: 2.75, posCode: "33MOD" },
  { name: "Barbacoa Res",     price: 2.75, posCode: "28MOD" },
  { name: "Birria",           price: 3.15, posCode: "12MOD" },
  { name: "Cabeza",           price: 3.15, posCode: "16MOD" },
  { name: "Tripa",            price: 3.15, posCode: "10MOD" },
  { name: "Campechano",       price: 3.15, posCode: "200MOD" },
  { name: "Camarones",        price: 3.75, posCode: "17MOD" },
];

// TORTILLA para tacos
const TORTILLA_TACO = [
  { name: "Maíz",             price: 0.00, posCode: "241MOD" },
  { name: "Harina",           price: 0.50, posCode: "191MOD" },
];

// BURRITO: base $11.99, carnes $0 extra (incluido)
const CARNES_BURRITO = [
  { name: "Asada",            price: 0, posCode: "73MOD" },
  { name: "Pollo",            price: 0, posCode: "75MOD" },
  { name: "Barbacoa",         price: 0, posCode: "77MOD" },
  { name: "Birria",           price: 0, posCode: "82MOD" },
  { name: "Cabeza",           price: 0, posCode: "79MOD" },
  { name: "Tripa",            price: 0, posCode: "81MOD" },
  { name: "Campechano",       price: 0, posCode: "219MOD" },
  { name: "Camarones",        price: 1.25, posCode: "142MOD" },
];

// TORTA: base $12.99, carnes $0 extra
const CARNES_TORTA = [
  { name: "Asada",            price: 0, posCode: "84MOD" },
  { name: "Pollo",            price: 0, posCode: "86MOD" },
  { name: "Barbacoa",         price: 0, posCode: "88MOD" },
  { name: "Birria",           price: 0, posCode: "93MOD" },
  { name: "Cabeza",           price: 0, posCode: "90MOD" },
  { name: "Tripa",            price: 0, posCode: "92MOD" },
];

// SOPE: base $5.99, carnes $0
const CARNES_SOPE = [
  { name: "Asada",            price: 0, posCode: "30MOD" },
  { name: "Pollo",            price: 0, posCode: "32MOD" },
  { name: "Barbacoa",         price: 0, posCode: "40MOD" },
  { name: "Birria",           price: 0, posCode: "45MOD" },
  { name: "Cabeza",           price: 0, posCode: "42MOD" },
  { name: "Tripa",            price: 0, posCode: "44MOD" },
  { name: "Camarones",        price: 1.25, posCode: "37MOD" },
];

// TOSTADA: base $4.99, carnes $0
const CARNES_TOSTADA = [
  { name: "Asada",            price: 0, posCode: "112MOD" },
  { name: "Pollo",            price: 0, posCode: "114MOD" },
  { name: "Barbacoa",         price: 0, posCode: "116MOD" },
  { name: "Birria",           price: 0, posCode: "161MOD" },
  { name: "Cabeza",           price: 0, posCode: "158MOD" },
  { name: "Camarones",        price: 1.25, posCode: "201MOD" },
];

// HUARACHE: base $7.39, carnes $0
const CARNES_HUARACHE = [
  { name: "Asada",            price: 0, posCode: "102MOD" },
  { name: "Pollo",            price: 0, posCode: "104MOD" },
  { name: "Barbacoa",         price: 0, posCode: "106MOD" },
  { name: "Birria",           price: 0, posCode: "111MOD" },
  { name: "Cabeza",           price: 0, posCode: "108MOD" },
  { name: "Camarones",        price: 1.25, posCode: "231MOD" },
  { name: "Campechano",       price: 0, posCode: "221MOD" },
];

// QUESADILLA: base $11.99, carnes $0
const CARNES_QUESADILLA = [
  { name: "Solo Queso",       price: 0, posCode: "184MOD" },
  { name: "Asada",            price: 0, posCode: "162MOD" },
  { name: "Pollo",            price: 0, posCode: "164MOD" },
  { name: "Barbacoa",         price: 0, posCode: "166MOD" },
  { name: "Birria",           price: 0, posCode: "171MOD" },
  { name: "Cabeza",           price: 0, posCode: "168MOD" },
  { name: "Camarones",        price: 1.25, posCode: "201MOD" },
  { name: "Campechano",       price: 0, posCode: "220MOD" },
];

// NACHOS: base $12.99, carnes $0
const CARNES_NACHOS = [
  { name: "Asada",            price: 0, posCode: "172MOD" },
  { name: "Pollo",            price: 0, posCode: "174MOD" },
  { name: "Barbacoa",         price: 0, posCode: "176MOD" },
  { name: "Birria",           price: 0, posCode: "181MOD" },
  { name: "Cabeza",           price: 0, posCode: "178MOD" },
  { name: "Camarones",        price: 1.25, posCode: "38MOD" },
  { name: "Campechano",       price: 0, posCode: "222MOD" },
];

// CHIMICHANGA: base $13.49, carnes $0
const CARNES_CHIMICHANGA = [
  { name: "Asada",            price: 0, posCode: "117MOD" },
  { name: "Pollo",            price: 0, posCode: "119MOD" },
  { name: "Barbacoa",         price: 0, posCode: "127MOD" },
  { name: "Birria",           price: 0, posCode: "125MOD" },
  { name: "Cabeza",           price: 0, posCode: "121MOD" },
  { name: "Camarones",        price: 1.25, posCode: "232MOD" },
  { name: "Campechano",       price: 0, posCode: "220MOD" },
];

// ── ESTRUCTURA COMPLETA DEL MENÚ ─────────────────────────────────────────────

type Modifier = { name: string; price: number; posCode: string };
type ModGroup = { name: string; required: boolean; multiSelect: boolean; mods: Modifier[] };
type Item = { name: string; price: number; posCode: string; description: string; groups: ModGroup[] };
type Category = { name: string; icon: string; sortOrder: number; items: Item[] };

const MENU: Category[] = [
  {
    name: "🌮 Tacos",
    icon: "🌮",
    sortOrder: 1,
    items: [
      {
        name: "Taco",
        price: 0,
        posCode: "7201",
        description: "Tortilla de maíz o harina con tu elección de carne y aderezos",
        groups: [
          { name: "Elige tu tortilla", required: true,  multiSelect: false, mods: TORTILLA_TACO },
          { name: "Elige tu carne",    required: true,  multiSelect: false, mods: CARNES_TACO },
          { name: "Extras",            required: false, multiSelect: true,  mods: EXTRAS_TACO },
        ]
      },
      {
        name: "Taco de Canasta",
        price: 2.00,
        posCode: "7231",
        description: "Taco de canasta",
        groups: [
          { name: "Elige tu carne", required: true, multiSelect: false, mods: [
            { name: "Asada",    price: 0, posCode: "8MOD" },
            { name: "Pollo",    price: 0, posCode: "6MOD" },
            { name: "Barbacoa", price: 0, posCode: "33MOD" },
            { name: "Carnitas", price: 0, posCode: "2MOD" },
          ]},
        ]
      },
      {
        name: "Taco Dorado",
        price: 1.75,
        posCode: "7105",
        description: "Taco dorado frito",
        groups: [
          { name: "Elige tu carne", required: true, multiSelect: false, mods: [
            { name: "Asada",    price: 0, posCode: "8MOD" },
            { name: "Pollo",    price: 0, posCode: "6MOD" },
            { name: "Carnitas", price: 0, posCode: "2MOD" },
          ]},
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
    ]
  },
  {
    name: "🌯 Burritos",
    icon: "🌯",
    sortOrder: 2,
    items: [
      {
        name: "Burrito",
        price: 11.99,
        posCode: "7202",
        description: "Burrito de harina con tu elección de carne, arroz y frijoles",
        groups: [
          { name: "Elige tu carne", required: true,  multiSelect: false, mods: CARNES_BURRITO },
          { name: "Extras",         required: false, multiSelect: true,  mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Burrito 9.99",
        price: 9.99,
        posCode: "7308",
        description: "Burrito especial económico",
        groups: [
          { name: "Elige tu carne", required: true, multiSelect: false, mods: CARNES_BURRITO.filter(c => c.price === 0) },
          { name: "Extras",         required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
    ]
  },
  {
    name: "🥙 Tortas",
    icon: "🥙",
    sortOrder: 3,
    items: [
      {
        name: "Torta",
        price: 12.99,
        posCode: "7203",
        description: "Torta con tu elección de carne",
        groups: [
          { name: "Elige tu carne", required: true,  multiSelect: false, mods: CARNES_TORTA },
          { name: "Extras",         required: false, multiSelect: true,  mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Torta Cubana",
        price: 13.99,
        posCode: "7204",
        description: "Torta cubana especial",
        groups: [
          { name: "Elige tu carne", required: true, multiSelect: false, mods: CARNES_TORTA },
          { name: "Extras",         required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Torta 9.99",
        price: 9.99,
        posCode: "7307",
        description: "Torta económica",
        groups: [
          { name: "Elige tu carne", required: true, multiSelect: false, mods: CARNES_TORTA },
        ]
      },
      {
        name: "Breakfast Torta",
        price: 11.99,
        posCode: "7230",
        description: "Torta de desayuno con huevo",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
    ]
  },
  {
    name: "🫔 Antojitos",
    icon: "🫔",
    sortOrder: 4,
    items: [
      {
        name: "Sope",
        price: 5.99,
        posCode: "7200",
        description: "Sope de masa con tu elección de carne",
        groups: [
          { name: "Elige tu carne", required: true,  multiSelect: false, mods: CARNES_SOPE },
          { name: "Extras",         required: false, multiSelect: true,  mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Tostada",
        price: 4.99,
        posCode: "7206",
        description: "Tostada crujiente con tu elección de carne",
        groups: [
          { name: "Elige tu carne", required: true,  multiSelect: false, mods: CARNES_TOSTADA },
          { name: "Extras",         required: false, multiSelect: true,  mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Huarache",
        price: 7.39,
        posCode: "7209",
        description: "Huarache de masa con tu elección de carne",
        groups: [
          { name: "Elige tu carne", required: true,  multiSelect: false, mods: CARNES_HUARACHE },
          { name: "Extras",         required: false, multiSelect: true,  mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Quesadilla",
        price: 11.99,
        posCode: "7207",
        description: "Quesadilla de harina con queso y tu elección de carne",
        groups: [
          { name: "Elige tu carne", required: true,  multiSelect: false, mods: CARNES_QUESADILLA },
          { name: "Extras",         required: false, multiSelect: true,  mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Nachos",
        price: 12.99,
        posCode: "7205",
        description: "Nachos con queso y tu elección de carne",
        groups: [
          { name: "Elige tu carne", required: true,  multiSelect: false, mods: CARNES_NACHOS },
          { name: "Extras",         required: false, multiSelect: true,  mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Chimichanga",
        price: 13.49,
        posCode: "7208",
        description: "Chimichanga frita con tu elección de carne",
        groups: [
          { name: "Elige tu carne", required: true,  multiSelect: false, mods: CARNES_CHIMICHANGA },
          { name: "Extras",         required: false, multiSelect: true,  mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Quesadillas Don Juan",
        price: 4.99,
        posCode: "7081",
        description: "Quesadillas de maíz Don Juan",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Tamales",
        price: 2.99,
        posCode: "7238",
        description: "Tamales de maíz",
        groups: []
      },
      {
        name: "Flautas (5)",
        price: 14.99,
        posCode: "7008",
        description: "5 flautas fritas con guarnición",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
    ]
  },
  {
    name: "🍽 Platos",
    icon: "🍽",
    sortOrder: 5,
    items: [
      {
        name: "Plato de Guisado",
        price: 11.99,
        posCode: "7120",
        description: "Plato de guisado con arroz y frijoles",
        groups: [
          { name: "Elige tu guisado", required: true, multiSelect: false, mods: [
            { name: "Mole",             price: 0, posCode: "7120" },
            { name: "Chile Verde",      price: 0, posCode: "7120" },
            { name: "Chile Rojo",       price: 0, posCode: "7120" },
            { name: "Calabacitas",      price: 0, posCode: "7120" },
            { name: "Nopales",          price: 0, posCode: "7120" },
          ]},
        ]
      },
      {
        name: "Plato Chile Relleno",
        price: 13.99,
        posCode: "7227",
        description: "Chile relleno con arroz y frijoles",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Plato Enchiladas (4)",
        price: 12.99,
        posCode: "7225",
        description: "4 enchiladas con arroz y frijoles",
        groups: [
          { name: "Tipo de salsa", required: true, multiSelect: false, mods: [
            { name: "Rojas",  price: 0, posCode: "136MOD" },
            { name: "Verdes", price: 0, posCode: "137MOD" },
          ]},
        ]
      },
      {
        name: "Plato Chicken Strips",
        price: 12.99,
        posCode: "7010",
        description: "Chicken strips con guarnición",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Plato de Mojarra",
        price: 15.99,
        posCode: "7223",
        description: "Mojarra frita entera con guarnición",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Fajitas de Bistec",
        price: 14.99,
        posCode: "7216",
        description: "Fajitas de bistec con guarnición",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Fajitas de Pollo",
        price: 13.99,
        posCode: "7215",
        description: "Fajitas de pollo con guarnición",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Fajitas de Camarón",
        price: 15.99,
        posCode: "7214",
        description: "Fajitas de camarón con guarnición",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Fajitas Mix",
        price: 16.99,
        posCode: "7213",
        description: "Fajitas mixtas (bistec, pollo y camarón)",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Barbacoa de Borrego",
        price: 14.99,
        posCode: "7117",
        description: "Plato de barbacoa de borrego",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
    ]
  },
  {
    name: "🍲 Caldos & Sopas",
    icon: "🍲",
    sortOrder: 6,
    items: [
      {
        name: "Pozole",
        price: 14.99,
        posCode: "7001",
        description: "Pozole rojo o blanco",
        groups: [
          { name: "Tipo", required: true, multiSelect: false, mods: [
            { name: "Rojo",   price: 0, posCode: "7001" },
            { name: "Blanco", price: 0, posCode: "7001" },
          ]},
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Caldo de Res",
        price: 14.99,
        posCode: "710",
        description: "Caldo de res con verduras",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Caldo de Pollo",
        price: 13.99,
        posCode: "709",
        description: "Caldo de pollo con verduras",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Caldo 7 Mares",
        price: 15.99,
        posCode: "708",
        description: "Caldo de 7 mares",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
    ]
  },
  {
    name: "🦐 Mariscos",
    icon: "🦐",
    sortOrder: 7,
    items: [
      {
        name: "Camarones a la Diabla",
        price: 14.99,
        posCode: "7219",
        description: "Camarones en salsa diabla picante",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Camarones al Mojo de Ajo",
        price: 14.99,
        posCode: "7218",
        description: "Camarones al mojo de ajo",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Camarones Rancheros",
        price: 14.99,
        posCode: "7220",
        description: "Camarones rancheros",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
    ]
  },
  {
    name: "🍳 Desayunos",
    icon: "🍳",
    sortOrder: 8,
    items: [
      {
        name: "Breakfast Tacos (3)",
        price: 9.99,
        posCode: "7130",
        description: "3 tacos de desayuno con huevo",
        groups: [
          { name: "Elige tu carne", required: true, multiSelect: false, mods: [
            { name: "Huevo con Asada",   price: 0, posCode: "7130" },
            { name: "Huevo con Pollo",   price: 0, posCode: "7130" },
            { name: "Huevo con Chorizo", price: 0, posCode: "7130" },
            { name: "Huevo con Tocino",  price: 0, posCode: "7130" },
          ]},
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Breakfast Burrito",
        price: 10.99,
        posCode: "7255",
        description: "Burrito de desayuno completo con huevo",
        groups: [
          { name: "Elige tu carne", required: true, multiSelect: false, mods: [
            { name: "Huevo con Asada",   price: 0, posCode: "7255" },
            { name: "Huevo con Pollo",   price: 0, posCode: "7255" },
            { name: "Huevo con Chorizo", price: 0, posCode: "7255" },
            { name: "Huevo con Tocino",  price: 0, posCode: "7255" },
          ]},
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Breakfast Burrito 6.99",
        price: 6.99,
        posCode: "7309",
        description: "Burrito de desayuno económico",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Breakfast Torta",
        price: 11.99,
        posCode: "7230",
        description: "Torta de desayuno con huevo",
        groups: [
          { name: "Extras", required: false, multiSelect: true, mods: EXTRAS_COMUNES },
        ]
      },
      {
        name: "Plato Desayuno Buffet",
        price: 6.99,
        posCode: "7243",
        description: "Plato de desayuno estilo buffet",
        groups: []
      },
    ]
  },
  {
    name: "➕ Extras & Sides",
    icon: "➕",
    sortOrder: 9,
    items: [
      { name: "Tortilla de Harina",      price: 3.99,  posCode: "70101", description: "Orden de tortillas de harina", groups: [] },
      { name: "Tortilla de Maíz",        price: 2.00,  posCode: "70100", description: "Orden de tortillas de maíz", groups: [] },
      { name: "Aguacate",                price: 1.09,  posCode: "70201", description: "Aguacate fresco", groups: [] },
      { name: "Side Mini (Arroz/Frijol)",price: 2.99,  posCode: "780",   description: "Side de arroz o frijoles", groups: [] },
      { name: "Tortillas Harina (4 pc)", price: 2.00,  posCode: "7252",  description: "4 tortillas de harina", groups: [] },
      { name: "Tortillas Maíz (6 pc)",   price: 1.50,  posCode: "7253",  description: "6 tortillas de maíz", groups: [] },
      { name: "Orden Tortilla Chips",    price: 2.99,  posCode: "109",   description: "Chips con salsa", groups: [] },
      { name: "Salsa Chica",             price: 3.99,  posCode: "776",   description: "Salsa de la casa (chica)", groups: [] },
      { name: "Salsa Mediana",           price: 5.99,  posCode: "778",   description: "Salsa de la casa (mediana)", groups: [] },
      { name: "Salsa Jumbo",             price: 10.99, posCode: "777",   description: "Salsa de la casa (jumbo)", groups: [] },
    ]
  },
];

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🗑  Borrando inventario actual...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.modifier.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  console.log("✅ Inventario borrado\n");

  let totalItems = 0;
  let totalMods = 0;

  for (const cat of MENU) {
    const category = await prisma.category.create({
      data: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder, active: true },
    });
    console.log(`📂 ${cat.name}`);

    for (const item of cat.items) {
      const menuItem = await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          posCode: item.posCode,
          categoryId: category.id,
          active: true,
          featured: false,
        },
      });

      console.log(`   ✓ ${item.name} — $${item.price.toFixed(2)}`);
      totalItems++;

      for (const group of item.groups) {
        const mg = await prisma.modifierGroup.create({
          data: {
            name: group.name,
            required: group.required,
            multiSelect: group.multiSelect,
            minSelect: group.required ? 1 : 0,
            maxSelect: group.multiSelect ? group.mods.length : 1,
            menuItemId: menuItem.id,
          },
        });

        for (const mod of group.mods) {
          await prisma.modifier.create({
            data: {
              name: mod.name,
              price: mod.price,
              posCode: mod.posCode,
              modifierGroupId: mg.id,
              active: true,
            },
          });
          totalMods++;
        }
        console.log(`      📋 ${group.name} (${group.mods.length} opciones)${group.required ? " *requerido" : ""}`);
      }
    }
    console.log();
  }

  console.log(`\n🎉 Importación completa:`);
  console.log(`   ${totalItems} productos`);
  console.log(`   ${totalMods} modificadores`);
  console.log(`   ${MENU.length} categorías`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
