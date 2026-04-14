"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { use } from "react";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers: string;
}

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  customerName: string | null;
  items: OrderItem[];
  createdAt: string;
}

type Status = "pending" | "preparing" | "ready" | "completed";

const STEPS: { key: Status; label: string; emoji: string; desc: string }[] = [
  { key: "pending",   label: "Recibida",        emoji: "📋", desc: "Tu orden fue registrada" },
  { key: "preparing", label: "En preparación",  emoji: "👨‍🍳", desc: "Estamos preparando tu comida" },
  { key: "ready",     label: "¡Lista!",          emoji: "🎉", desc: "Pasa a recoger tu orden" },
  { key: "completed", label: "Entregada",        emoji: "✅", desc: "¡Buen provecho!" },
];

function getStepIndex(status: string): number {
  return STEPS.findIndex((s) => s.key === status);
}

function parseMods(raw: string): { name: string; price: number }[] {
  try { return JSON.parse(raw); } catch { return []; }
}

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [justReady, setJustReady] = useState(false);
  const [countdown, setCountdown] = useState(6);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/status/${orderNumber}`);
      if (res.status === 404) { setNotFound(true); return; }
      const data: Order = await res.json();
      setOrder((prev) => {
        if (prev && prev.status !== data.status && data.status === "ready") {
          setJustReady(true);
        }
        return data;
      });
    } catch { /* keep showing */ }
    finally { setLoading(false); }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  useEffect(() => {
    if (justReady) {
      const t = setTimeout(() => setJustReady(false), 6000);
      return () => clearTimeout(t);
    }
  }, [justReady]);

  // Cuando está "completed", cuenta regresiva y redirige al inicio
  useEffect(() => {
    if (order?.status !== "completed") return;
    setCountdown(6);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push("/order");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [order?.status, router]);

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 border-4 border-green-500/20 border-t-green-500 rounded-full" />
    </div>
  );

  /* ── Not found ── */
  if (notFound || !order) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-white font-bold text-2xl mb-2">Orden no encontrada</h1>
      <p className="text-gray-500">Verifica el número de orden en tu ticket</p>
    </div>
  );

  const isReady = order.status === "ready";
  const isDone  = order.status === "completed";
  const currentIdx  = getStepIndex(order.status);

  /* ── PANTALLA COMPLETA "LISTA" ── */
  if (isReady) return (
    <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      {/* Pulsos de fondo */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10 pointer-events-none"
          style={{ width: i * 220, height: i * 220 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.05, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="text-8xl mb-6 relative z-10"
      >
        🎉
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-white font-black text-5xl mb-3 relative z-10"
      >
        ¡LISTA!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-white/90 font-bold text-2xl mb-2 relative z-10"
      >
        Orden #{order.orderNumber}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-white/80 text-lg mb-10 relative z-10"
      >
        Pasa a recoger tu orden en la ventanilla
      </motion.p>

      {/* Confetti dots */}
      {justReady && [...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: ["#fff", "#fef08a", "#bbf7d0", "#fde68a"][i % 4],
            left: `${6 + i * 6}%`,
            top: "50%",
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -400, opacity: 0, x: (i % 2 === 0 ? 1 : -1) * (30 + i * 12), scale: 0.5 }}
          transition={{ duration: 1.5, delay: i * 0.06 }}
        />
      ))}

      {/* Indicador pulsante "ve a recoger" */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="relative z-10 bg-white rounded-3xl px-8 py-4 shadow-xl"
      >
        <p className="text-green-600 font-black text-xl">👆 Ve a la caja</p>
      </motion.div>

      <p className="text-white/50 text-xs mt-8 relative z-10">
        Actualizando automáticamente
      </p>
    </div>
  );

  /* ── PANTALLA "ENTREGADA" ── */
  if (isDone) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="text-7xl mb-5"
      >
        ✅
      </motion.div>
      <h1 className="text-white font-black text-4xl mb-2">¡Buen provecho!</h1>
      <p className="text-gray-400 text-lg mb-2">Orden #{order.orderNumber}</p>
      <p className="text-gray-600 text-sm mb-8">Gracias por tu visita</p>

      {/* Cuenta regresiva */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <motion.circle
              cx="28" cy="28" r="24"
              fill="none" stroke="#22c55e" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={150.8}
              animate={{ strokeDashoffset: 150.8 - (150.8 * countdown / 6) }}
              transition={{ duration: 0.9, ease: "linear" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg">
            {countdown}
          </span>
        </div>
        <p className="text-gray-500 text-xs">Volviendo al inicio...</p>
        <button
          onClick={() => router.push("/order")}
          className="mt-2 text-green-400 text-sm underline underline-offset-2"
        >
          Ir ahora
        </button>
      </div>
    </div>
  );

  /* ── PANTALLA NORMAL (pending / preparing) ── */
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 text-center">
        <p className="text-gray-500 text-xs mb-1 uppercase tracking-widest font-semibold">Orden</p>
        <h1 className="text-white font-black text-5xl">#{order.orderNumber}</h1>
      </div>

      {/* Status card */}
      <div className="px-4 mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={order.status}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="rounded-3xl p-8 text-center bg-white/5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 16, delay: 0.1 }}
              className="text-6xl mb-4"
            >
              {STEPS[currentIdx]?.emoji ?? "📋"}
            </motion.div>
            <h2 className="text-white font-black text-3xl mb-2">{STEPS[currentIdx]?.label}</h2>
            <p className="text-gray-400 text-base">{STEPS[currentIdx]?.desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress steps */}
      <div className="px-6 mb-6">
        <div className="flex items-center">
          {STEPS.map((step, idx) => {
            const isPast    = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isFuture  = idx > currentIdx;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <motion.div
                    animate={{
                      backgroundColor: isCurrent ? "#22c55e" : isPast ? "#16a34a" : "rgba(255,255,255,0.1)",
                      scale: isCurrent ? 1.15 : 1,
                    }}
                    transition={{ duration: 0.4 }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
                  >
                    {isPast ? <span className="text-white font-bold">✓</span> : <span>{step.emoji}</span>}
                  </motion.div>
                  <span className={`text-[10px] font-semibold text-center leading-tight w-14 ${isFuture ? "text-gray-600" : "text-gray-300"}`}>
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <motion.div
                    className="flex-1 h-0.5 mx-1 mb-5 rounded-full"
                    animate={{ backgroundColor: isPast ? "#22c55e" : "rgba(255,255,255,0.1)" }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Order items */}
      <div className="flex-1 px-4 pb-8">
        <div className="bg-white/5 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide">Tu orden</h3>
          </div>
          <div className="divide-y divide-white/5">
            {order.items.map((item) => {
              const mods = parseMods(item.modifiers);
              return (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex justify-between items-start">
                    <span className="text-white text-sm font-semibold">{item.quantity}× {item.name}</span>
                    <span className="text-gray-400 text-sm tabular-nums">
                      ${((item.price + mods.reduce((s, m) => s + m.price, 0)) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  {mods.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {mods.map((m, i) => (
                        <li key={i} className="text-xs text-gray-500">+ {m.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-white/8 flex justify-between">
            <span className="text-white font-bold">Total</span>
            <span className="text-green-400 font-black tabular-nums">${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-gray-600 text-xs">Actualizando automáticamente</span>
        </div>
      </div>
    </div>
  );
}
