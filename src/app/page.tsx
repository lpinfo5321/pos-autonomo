"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import MenuItemCard from "@/components/kiosk/MenuItemCard";
import ProductModal from "@/components/kiosk/ProductModal";
import Cart from "@/components/kiosk/Cart";
import CheckoutModal from "@/components/kiosk/CheckoutModal";
import Link from "next/link";

interface Modifier {
  id: string;
  name: string;
  price: number;
  calories?: number | null;
  active: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  minSelect: number;
  maxSelect: number;
  modifiers: Modifier[];
}

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  calories?: number | null;
  featured?: boolean;
  modifierGroups: ModifierGroup[];
}

interface Category {
  id: string;
  name: string;
  icon?: string | null;
  items: MenuItem[];
}

interface Settings {
  restaurant_name: string;
  tax_rate: string;
  welcome_message: string;
  kiosk_url: string;
  primary_color: string;
  logo_url: string;
}

export default function KioskPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({
    restaurant_name: "Mi Restaurante",
    tax_rate: "8.5",
    welcome_message: "¡Bienvenido! Toca para ordenar",
    kiosk_url: "",
    primary_color: "#22c55e",
    logo_url: "",
  });
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  const { getItemCount } = useCartStore();
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/menu").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([menuData, settingsData]) => {
      setCategories(menuData);
      if (menuData.length > 0) setActiveCategory(menuData[0].id);
      setSettings((s) => ({ ...s, ...settingsData }));
      setLoading(false);
    });
  }, []);

  // Intersection observer to track active category on scroll
  useEffect(() => {
    if (categories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace("cat-", ""));
          }
        }
      },
      { threshold: 0.2, rootMargin: "-10% 0px -70% 0px" }
    );
    for (const cat of categories) {
      const el = categoryRefs.current[cat.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [categories]);

  const allItems = categories.flatMap((c) => c.items);
  const filteredItems = searchQuery
    ? allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    setShowSearch(false);
    setSearchQuery("");
    const el = categoryRefs.current[catId];
    if (el && contentRef.current) {
      const offset = el.offsetTop - 16;
      contentRef.current.scrollTo({ top: offset, behavior: "smooth" });
    }
  };

  const handleOrderSuccess = (orderNumber: number) => {
    // No cerramos el modal aquí — se queda abierto para mostrar el ticket
    setOrderSuccess(orderNumber);
    setTimeout(() => setOrderSuccess(null), 8000);
  };

  const taxRate = parseFloat(settings.tax_rate);
  const itemCount = getItemCount();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400 text-sm">Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden select-none">

      {/* ===== LAYOUT PRINCIPAL ===== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===== SIDEBAR IZQUIERDO (Categorías) — estilo Shake Shack ===== */}
        <aside className="w-40 sm:w-48 bg-[#111] flex flex-col flex-shrink-0 overflow-hidden">
          {/* Logo neón */}
          <div className="flex flex-col items-center pt-5 pb-4 border-b border-white/10">
            <motion.div
              whileTap={{ scale: 0.92 }}
              className="w-14 h-14 flex items-center justify-center mb-2"
            >
              {/* Burger neón estilo Shake Shack */}
              <svg viewBox="0 0 64 56" className="w-14 h-12">
                <defs>
                  <filter id="neon" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Bun top (arco) */}
                <path d="M8 22 Q32 4 56 22" stroke="#4ade80" strokeWidth="4.5" fill="none"
                  strokeLinecap="round" filter="url(#neon)" />
                {/* Línea media superior */}
                <rect x="8" y="27" width="48" height="4.5" rx="2.25"
                  fill="#4ade80" filter="url(#neon)" />
                {/* Línea media inferior */}
                <rect x="8" y="36" width="48" height="4.5" rx="2.25"
                  fill="#4ade80" filter="url(#neon)" />
                {/* Bun bottom (arco invertido) */}
                <path d="M8 45 Q32 58 56 45" stroke="#4ade80" strokeWidth="4.5" fill="none"
                  strokeLinecap="round" filter="url(#neon)" />
              </svg>
            </motion.div>
            <span className="text-white text-xs font-semibold text-center leading-tight px-2 line-clamp-2 tracking-wide">
              {settings.restaurant_name}
            </span>
          </div>

          {/* Lista de categorías */}
          <nav className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`w-full text-left px-4 py-2.5 transition-colors relative ${
                    isActive
                      ? "text-white font-bold"
                      : "text-gray-500 hover:text-gray-300 font-normal"
                  }`}
                >
                  <span className="relative text-xs sm:text-sm leading-tight block tracking-wide">
                    {cat.name}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </aside>

        {/* ===== CONTENIDO PRINCIPAL — fondo blanco limpio ===== */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">

          {/* Barra de búsqueda (solo se muestra cuando está activa) */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                key="search"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border-b border-gray-100 flex items-center gap-2 px-5 py-3 flex-shrink-0"
              >
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en el menú..."
                  className="flex-1 text-sm focus:outline-none bg-transparent text-gray-800"
                />
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid de items */}
          <div ref={contentRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {filteredItems ? (
              <div className="px-6 py-6">
                {/* Botón buscar flotante */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-400">
                    {filteredItems.length} resultado{filteredItems.length !== 1 ? "s" : ""} para &quot;{searchQuery}&quot;
                  </p>
                  <button
                    onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-8">
                  {filteredItems.map((item, i) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      index={i}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="pb-8">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    id={`cat-${category.id}`}
                    ref={(el) => { categoryRefs.current[category.id] = el; }}
                  >
                    {/* Título de categoría estilo Shake Shack — grande y limpio */}
                    <div className="px-6 pt-7 pb-4 flex items-center justify-between">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 uppercase tracking-wider">
                        {category.name}
                      </h2>
                      {activeCategory === category.id && (
                        <button
                          onClick={() => setShowSearch(true)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Search className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                    <div className="px-6 grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-8">
                      {category.items.map((item, i) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          index={i}
                          onClick={() => setSelectedItem(item)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ===== SIDEBAR DERECHO — Carrito siempre visible ===== */}
        <Cart
          taxRate={taxRate}
          onCheckout={() => {
            setShowCheckout(true);
          }}
        />
      </div>

      {/* ===== BARRA INFERIOR — estilo Shake Shack ===== */}
      <div className="bg-[#111] flex items-stretch flex-shrink-0">
        <Link
          href="/admin"
          className="flex items-center justify-center px-6 sm:px-8 py-3 text-gray-400 hover:text-white text-xs font-semibold uppercase tracking-widest border-r border-white/10 transition-colors hover:bg-white/5 flex-shrink-0"
        >
          Cancel
        </Link>

        <div className="flex-1 flex items-center justify-center gap-3">
          <span className="text-gray-300 text-xs font-semibold uppercase tracking-widest">
            Offers
          </span>
          <motion.div
            className="w-2 h-2 bg-green-400 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        <div className="flex items-center gap-2 px-6 sm:px-8 py-3 border-l border-white/10 flex-shrink-0">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
            Your Bag
          </span>
          <AnimatePresence>
            {itemCount > 0 && (
              <motion.span
                key={itemCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-green-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
              >
                {itemCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Order success toast */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2"
          >
            <span>✅</span>
            <span className="font-semibold">¡Pedido #{orderSuccess} enviado!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product modal */}
      {selectedItem && (
        <ProductModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* Checkout modal */}
      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={handleOrderSuccess}
          taxRate={taxRate}
          restaurantName={settings.restaurant_name}
          kioskUrl={settings.kiosk_url}
        />
      )}
    </div>
  );
}
