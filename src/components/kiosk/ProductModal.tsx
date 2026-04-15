"use client";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore, CartModifier } from "@/store/cartStore";

interface Modifier {
  id: string;
  name: string;
  price: number;
  calories?: number | null;
  image?: string | null;
  posCode?: string | null;
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

interface Props {
  item: MenuItem;
  onClose: () => void;
}

function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("avocado") || lower.includes("aguacate") || lower.includes("guacamole")) return "🥑";
  if (lower.includes("bacon") || lower.includes("tocino")) return "🥓";
  if (lower.includes("cheese") || lower.includes("queso")) return "🧀";
  if (lower.includes("pepper") || lower.includes("chile") || lower.includes("jalapeño")) return "🌶️";
  if (lower.includes("onion") || lower.includes("cebolla")) return "🧅";
  if (lower.includes("mayo") || lower.includes("sauce") || lower.includes("salsa")) return "🫙";
  if (lower.includes("lettuce") || lower.includes("lechuga") || lower.includes("salad")) return "🥬";
  if (lower.includes("pickle") || lower.includes("pepinillo")) return "🥒";
  if (lower.includes("mushroom") || lower.includes("hongo")) return "🍄";
  if (lower.includes("tomato") || lower.includes("tomate")) return "🍅";
  if (lower.includes("egg") || lower.includes("huevo")) return "🍳";
  if (lower.includes("burger") || lower.includes("hamburguesa")) return "🍔";
  if (lower.includes("chicken") || lower.includes("pollo")) return "🍗";
  if (lower.includes("shake") || lower.includes("malteada")) return "🥤";
  if (lower.includes("fries") || lower.includes("papas")) return "🍟";
  if (lower.includes("water") || lower.includes("agua")) return "💧";
  return "🍽️";
}

export default function ProductModal({ item, onClose }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [exitMode, setExitMode] = useState<"idle" | "cancel" | "add">("idle");
  const [flyImg, setFlyImg] = useState<{
    src: string; x: number; y: number; w: number; h: number;
    destCX: number; destCY: number;
  } | null>(null);
  const imgRef = useRef<HTMLImageElement | HTMLSpanElement | null>(null);
  const { addItem, items: cartItems } = useCartStore();

  function handleClose() {
    setExitMode("cancel");
    setTimeout(onClose, 300);
  }

  function handleAdd() {
    // Capturar posición de la imagen ANTES de cerrar el modal
    const rect = imgRef.current?.getBoundingClientRect();

    // ¿El item ya existe en el carrito? → su thumbnail ya está renderizado
    const alreadyInCart = cartItems.some((i) => i.menuItemId === item.id);

    addItem({
      id: crypto.randomUUID(),
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      modifiers: getSelectedModifiersFlat(),
      image: item.image || undefined,
    });

    setExitMode("add");

    if (!rect || !item.image) {
      setTimeout(onClose, 600);
      return;
    }

    // flyDelay: cuánto esperar antes de iniciar la animación de vuelo
    // closeDelay: flyDelay + duración del vuelo (600ms) + buffer (80ms)
    // → el modal no se desmonta hasta que el vuelo termina
    const flyDelay = alreadyInCart ? 0 : 220;
    setTimeout(onClose, flyDelay + 820);

    const resolveDestination = () => {
      const thumbEl = document.querySelector(`[data-cart-item="${item.id}"]`);
      const thumbRect = thumbEl?.getBoundingClientRect();
      const cartW = 320;
      const thumbSize = 48;
      setFlyImg({
        src: item.image!,
        x: rect.left, y: rect.top,
        w: rect.width, h: rect.height,
        destCX: thumbRect
          ? thumbRect.left + thumbRect.width / 2
          : window.innerWidth - cartW + 16 + thumbSize / 2,
        destCY: thumbRect
          ? thumbRect.top + thumbRect.height / 2
          : 96,
      });
    };

    if (alreadyInCart) {
      requestAnimationFrame(resolveDestination);
    } else {
      setTimeout(resolveDestination, flyDelay);
    }
  }

  const toggleModifier = (groupId: string, modifierId: string, multiSelect: boolean) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      if (multiSelect) {
        return {
          ...prev,
          [groupId]: current.includes(modifierId)
            ? current.filter((id) => id !== modifierId)
            : [...current, modifierId],
        };
      }
      return { ...prev, [groupId]: current.includes(modifierId) ? [] : [modifierId] };
    });
  };

  const getSelectedModifiersFlat = (): CartModifier[] => {
    const result: CartModifier[] = [];
    for (const group of item.modifierGroups) {
      for (const modId of selectedModifiers[group.id] || []) {
        const mod = group.modifiers.find((m) => m.id === modId);
        if (mod) result.push({ id: mod.id, name: mod.name, price: mod.price, posCode: mod.posCode ?? undefined });
      }
    }
    return result;
  };

  const modifiersTotal = getSelectedModifiersFlat().reduce((s, m) => s + m.price, 0);
  const totalPrice = (item.price + modifiersTotal) * quantity;

  const getTotalCalories = () => {
    let cal = item.calories || 0;
    for (const group of item.modifierGroups) {
      for (const modId of selectedModifiers[group.id] || []) {
        const mod = group.modifiers.find((m) => m.id === modId);
        if (mod?.calories) cal += mod.calories;
      }
    }
    return cal;
  };

  const allModifiers = item.modifierGroups.flatMap((g) =>
    g.modifiers
      .filter((m) => m.active)
      .map((m) => ({ ...m, groupId: g.id, multiSelect: g.multiSelect }))
  );
  const hasModifiers = allModifiers.length > 0;

  const isExiting = exitMode !== "idle";

  return (
    <>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{
          duration: isExiting ? (exitMode === "cancel" ? 0.4 : 0.6) : 0.2,
          delay: isExiting ? (exitMode === "add" ? 0.32 : 0.05) : 0,
          type: "tween",
          ease: isExiting ? "easeIn" : "easeOut",
        }}
        className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-6"
        onClick={exitMode === "idle" ? handleClose : undefined}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20, filter: "blur(12px)" }}
          animate={
            exitMode === "cancel"
              ? {
                  opacity: 0,
                  scale: 0.88,
                  y: 20,
                  filter: "blur(12px)",
                  transition: { duration: 0.25, type: "tween", ease: [0.4, 0, 1, 1] },
                }
              : exitMode === "add"
              ? {
                  opacity: 0,
                  scale: 0.94,
                  filter: "blur(6px)",
                  transition: { duration: 0.22, type: "tween", ease: "easeIn" },
                }
              : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
          }
          transition={{ type: "tween", duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full flex flex-col rounded-2xl overflow-hidden shadow-2xl relative"
          style={{
            maxWidth: hasModifiers ? 920 : 460,
            maxHeight: "calc(100vh - 3rem)",
            willChange: "transform, opacity, filter",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >

          {/* ══════════════════════════════════════
              CUERPO: panel blanco izq + panel oscuro der
          ══════════════════════════════════════ */}
          <div
            className="flex flex-1 overflow-hidden"
            style={{ minHeight: 0, transform: "translateZ(0)", isolation: "isolate" }}
          >

            {/* ══════════════════════════════════════════════════════
                LAYOUT DE FILAS que cruzan ambos paneles:
                BLANCO izq (info + producto + imágenes ingredientes)
                OSCURO der (header + checkboxes)
            ══════════════════════════════════════════════════════ */}

            {/* ── COLUMNA IZQUIERDA BLANCA — solo info + imagen del producto ── */}
            <div className={`${hasModifiers ? "w-96" : "w-full"} bg-white flex flex-col flex-shrink-0 relative z-10`}
              style={{ marginRight: hasModifiers ? "-2px" : 0 }}
            >

              {/* Info del producto */}
              <div className="px-5 pt-5 pb-2 flex-shrink-0">
                <h2 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h2>
                {getTotalCalories() > 0 && (
                  <p className="text-green-600 text-sm font-medium mt-0.5">{getTotalCalories()} cal</p>
                )}
                {item.description && (
                  <p className="text-gray-500 text-xs mt-2 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Imagen del producto */}
              <div className="flex-1 flex items-center justify-center overflow-hidden relative">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    ref={(el) => { imgRef.current = el; }}
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    style={{ maxHeight: hasModifiers ? 340 : 400 }}
                  />
                ) : (
                  <span
                    ref={(el) => { imgRef.current = el; }}
                    className="leading-none select-none"
                    style={{ fontSize: "10rem", display: "block" }}
                  >
                    {getFoodEmoji(item.name)}
                  </span>
                )}

                {/* portal de animación — montado fuera del modal para no ser recortado */}
              </div>
            </div>

            {/* ── COLUMNA DERECHA OSCURA — franja blanca absoluta + contenido ── */}
            {hasModifiers && (
              <div className="flex-1 bg-[#111] flex flex-col overflow-hidden relative" style={{ transform: "translateZ(0)" }}>

                {/* Franja blanca continua de arriba a abajo — cubre toda la columna de imágenes */}
                <div className="absolute left-0 top-0 bottom-0 bg-white z-0" style={{ width: 89 }} />

                {/* Header — sobre la franja */}
                <div className="flex items-stretch flex-shrink-0 relative z-10">
                  <div className="flex-shrink-0" style={{ width: 88 }} />
                  <div className="flex-1 px-5 pt-5 pb-10">
                    <h3 className="text-white font-bold text-xl">Customize Your Item</h3>
                    <p className="text-gray-400 text-sm mt-0.5">Ingredients</p>
                  </div>
                </div>

                {/* Lista — sobre la franja */}
                <div
                  className="flex-1 overflow-y-auto relative z-10"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "#444 transparent" }}
                >
                  {allModifiers.map((mod) => {
                    const isSelected = (selectedModifiers[mod.groupId] || []).includes(mod.id);
                    return (
                      <motion.button
                        key={mod.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleModifier(mod.groupId, mod.id, mod.multiSelect)}
                        className="w-full flex items-stretch text-left"
                      >
                        {/* Celda imagen — tamaño fijo siempre, imagen aparece/desaparece dentro */}
                        <div
                          className="flex items-center justify-center flex-shrink-0 overflow-hidden"
                          style={{ width: 88, height: 72 }}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.3 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.3 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                className="w-full h-full flex items-center justify-center"
                              >
                                {mod.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={mod.image}
                                    alt={mod.name}
                                    className="w-full h-full object-contain"
                                    style={{ transform: "scale(1.6)", transformOrigin: "center" }}
                                  />
                                ) : (
                                  <span className="text-4xl leading-none select-none">
                                    {getFoodEmoji(mod.name)}
                                  </span>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Resto — oscuro, misma altura fija que la celda imagen */}
                        <div className="flex-1 flex items-center gap-3 px-3 hover:bg-white/5 transition-colors" style={{ height: 72 }}>
                          {/* Checkbox */}
                          <div
                            className={`w-5 h-5 rounded-sm flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-green-500 border-green-500"
                                : "border-gray-500 bg-transparent"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>

                          {/* Nombre */}
                          <span className="flex-1 text-white text-sm font-medium truncate">{mod.name}</span>

                          {/* Precio */}
                          {mod.price > 0 && (
                            <span className="text-gray-400 text-sm flex-shrink-0 w-12 text-right">
                              ${mod.price.toFixed(2)}
                            </span>
                          )}

                          {/* Calorías */}
                          {mod.calories != null && mod.calories !== 0 && (
                            <span className="text-gray-500 text-xs flex-shrink-0 w-14 text-right">
                              {mod.calories} cal
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════
              BARRA INFERIOR
          ══════════════════════════════════════ */}
          <div className="bg-[#0a0a0a] flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ transform: "translateZ(0)" }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors flex-shrink-0"
            >
              Close
            </motion.button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <Minus className="w-3.5 h-3.5 text-white" />
              </motion.button>
              <motion.span
                key={quantity}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-white font-bold text-base w-6 text-center"
              >
                {quantity}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
              </motion.button>
            </div>

            <span className="text-white font-bold text-base ml-auto flex-shrink-0">
              {formatPrice(totalPrice)}
            </span>

            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleAdd}
              disabled={isExiting}
              className="bg-green-500 hover:bg-green-400 text-white font-bold text-sm px-7 py-2.5 rounded-xl transition-colors flex-shrink-0"
            >
              Add
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

    </AnimatePresence>

    {/* ── Portal: imagen volando al carrito ── */}
    {flyImg && typeof document !== "undefined" && (() => {
      const FLY_SIZE = 120; // tamaño fijo del recuadro, siempre igual
      const thumbSize = 48;
      const { destCX, destCY } = flyImg;

      // Centro de la imagen del producto en pantalla
      const srcCX = flyImg.x + flyImg.w / 2;
      const srcCY = flyImg.y + flyImg.h / 2;

      // Desplazamiento del centro al destino
      const dx = destCX - srcCX;
      const dy = destCY - srcCY;

      // Escala final: de 120px → 36px
      const finalScale = thumbSize / FLY_SIZE;

      return createPortal(
        <motion.div
          key="fly-to-cart"
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: srcCX - FLY_SIZE / 2,
            top: srcCY - FLY_SIZE / 2,
            width: FLY_SIZE,
            height: FLY_SIZE,
            borderRadius: 16,
            overflow: "hidden",
            background: "white",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
          initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
          animate={{
            opacity: 1,
            scale: [0.5, 1.08, finalScale],
            x: dx,
            y: dy,
          }}
          transition={{
            x: { type: "spring", stiffness: 210, damping: 26, mass: 0.85 },
            y: { type: "spring", stiffness: 210, damping: 26, mass: 0.85 },
            scale: { type: "tween", duration: 0.7, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.14, 1] },
            opacity: { type: "tween", duration: 0.18, ease: "easeOut" },
          }}
          onAnimationComplete={() => setFlyImg(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flyImg.src}
            alt=""
            className="w-full h-full object-contain"
          />
        </motion.div>,
        document.body
      );
    })()}
    </>
  );
}
