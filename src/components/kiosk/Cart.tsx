"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ShoppingBag, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";

interface Props {
  taxRate?: number;
  onCheckout: () => void;
}

function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("burger") || lower.includes("hamburguesa")) return "🍔";
  if (lower.includes("chicken") || lower.includes("pollo")) return "🍗";
  if (lower.includes("shake") || lower.includes("malteada")) return "🥤";
  if (lower.includes("fries") || lower.includes("papas")) return "🍟";
  if (lower.includes("salad") || lower.includes("ensalada")) return "🥗";
  if (lower.includes("dog") || lower.includes("hot dog")) return "🌭";
  if (lower.includes("water") || lower.includes("agua")) return "💧";
  return "🍽️";
}

export default function Cart({ taxRate = 8.5, onCheckout }: Props) {
  const { items, removeItem, getSubtotal, getTax, getItemCount } =
    useCartStore();

  const subtotal = getSubtotal();
  const tax = getTax(taxRate);
  const total = subtotal + tax;
  const itemCount = getItemCount();

  const [bagBounce, setBagBounce] = useState(false);
  const prevCount = useRef(itemCount);
  useEffect(() => {
    if (itemCount > prevCount.current) {
      setBagBounce(true);
      setTimeout(() => setBagBounce(false), 500);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  return (
    <aside className="w-80 bg-[#0f0f0f] flex flex-col flex-shrink-0 overflow-hidden border-l border-white/8">

      {/* Header */}
      <motion.div
        animate={bagBounce ? { scale: [1, 1.05, 0.98, 1.01, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut", type: "tween" }}
        className="flex items-center gap-3 px-5 py-4 border-b border-white/8 flex-shrink-0"
      >
        <motion.div
          animate={bagBounce ? { rotate: [-10, 10, -6, 6, 0], scale: [1, 1.35, 1] } : {}}
          transition={{ duration: 0.4, type: "tween" }}
        >
          <ShoppingBag className="w-5 h-5 text-green-400" />
        </motion.div>
        <span className="text-white font-bold text-sm uppercase tracking-widest flex-1">
          Your Bag
        </span>
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.span
              key={itemCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="bg-green-500 text-white text-xs font-bold min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center"
            >
              {itemCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Items */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a2a transparent" }}
      >
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center px-6"
            >
              <span className="text-5xl mb-4">🛍️</span>
              <p className="text-gray-400 font-semibold text-sm">Tu bolsa está vacía</p>
              <p className="text-gray-600 text-xs mt-1">Agrega algo del menú</p>
            </motion.div>
          ) : (
            items.map((item) => {
              const itemTotal =
                (item.price + item.modifiers.reduce((s, m) => s + m.price, 0)) *
                item.quantity;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="px-4 py-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex gap-3 items-start">

                    {/* Thumbnail + badge cantidad */}
                    <div className="relative flex-shrink-0">
                      <div
                        data-cart-item={item.menuItemId}
                        className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                      >
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-2xl leading-none">
                            {getFoodEmoji(item.name)}
                          </span>
                        )}
                      </div>
                      <motion.span
                        key={item.quantity}
                        initial={{ scale: 1.4 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 18 }}
                        className="absolute -bottom-1.5 -right-1.5 bg-green-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow"
                      >
                        {item.quantity}
                      </motion.span>
                    </div>

                    {/* Info: nombre + extras en lista */}
                    <div className="flex-1 min-w-0">
                      {/* Fila: nombre + precio + eliminar */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white font-bold text-sm leading-snug">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-white font-bold text-sm tabular-nums">
                            {formatPrice(itemTotal)}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => removeItem(item.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Modificadores como lista vertical */}
                      {item.modifiers.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {item.modifiers.map((m) => (
                            <li
                              key={m.id}
                              className="flex items-center gap-1.5 text-xs text-gray-400"
                            >
                              <span className="text-green-500 font-bold leading-none">+</span>
                              <span>{m.name}</span>
                              {m.price > 0 && (
                                <span className="text-gray-600 tabular-nums ml-auto">
                                  +{formatPrice(m.price)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Totales + Checkout */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t border-white/8 px-5 py-4 bg-[#0f0f0f] flex-shrink-0"
          >
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Impuesto ({taxRate}%)</span>
                <span className="tabular-nums">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/8 mt-1">
                <span>Total</span>
                <motion.span
                  key={total}
                  initial={{ scale: 1.08, color: "#22c55e" }}
                  animate={{ scale: 1, color: "#ffffff" }}
                  transition={{ duration: 0.4 }}
                  className="tabular-nums"
                >
                  {formatPrice(total)}
                </motion.span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={onCheckout}
              className="w-full bg-green-500 hover:bg-green-400 text-white font-bold text-sm py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/30"
            >
              Checkout
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
