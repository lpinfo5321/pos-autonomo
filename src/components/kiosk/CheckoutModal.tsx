"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, ChevronRight, Printer, CheckCircle2, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onSuccess: (orderNumber: number) => void;
  taxRate?: number;
  restaurantName?: string;
  kioskUrl?: string;
}

type Step = "review" | "payment" | "processing" | "ticket";

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

export default function CheckoutModal({
  onClose,
  onSuccess,
  taxRate = 8.5,
  restaurantName = "Mi Restaurante",
  kioskUrl = "",
}: Props) {
  const [step, setStep] = useState<Step>("review");
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  // Snapshot de items guardado ANTES de limpiar el carrito
  const [ticketItems, setTicketItems] = useState<ReturnType<typeof useCartStore.getState>["items"]>([]);
  const [ticketSubtotal, setTicketSubtotal] = useState(0);
  const [ticketTax, setTicketTax] = useState(0);
  const [ticketTotal, setTicketTotal] = useState(0);
  const ticketRef = useRef<HTMLDivElement>(null);

  const { items, getSubtotal, getTax, clearCart } = useCartStore();
  const subtotal = getSubtotal();
  const tax = getTax(taxRate);
  const total = subtotal + tax;

  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  const handlePlaceOrder = async () => {
    setStep("processing");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            modifiers: item.modifiers,
            notes: item.notes,
          })),
          paymentMethod: "card",
        }),
      });
      if (!response.ok) throw new Error("Error al crear pedido");
      const order = await response.json();
      // Guardar snapshot ANTES de limpiar el carrito
      setTicketItems([...items]);
      setTicketSubtotal(subtotal);
      setTicketTax(tax);
      setTicketTotal(total);
      // Simular 1.5s de "procesando"
      await new Promise((r) => setTimeout(r, 1500));
      setOrderNumber(order.orderNumber);
      setOrderId(order.id);
      clearCart();
      setStep("ticket");
      onSuccess(order.orderNumber);
    } catch {
      setStep("payment");
    }
  };

  const handlePrint = () => window.print();

  // Usar kiosk_url configurada en admin; si no hay, usar la IP actual de la ventana
  const baseUrl = kioskUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const statusUrl = `${baseUrl}/order/${orderNumber}`;

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -60 }),
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={step === "review" ? onClose : undefined}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-[#111] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto"
          style={{ maxHeight: "calc(100vh - 2rem)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── PASO 1: REVIEW ── */}
          <AnimatePresence mode="wait" custom={1}>
            {step === "review" && (
              <motion.div
                key="review"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.25, 1, 0.3, 1] }}
                className="flex flex-col"
                style={{ maxHeight: "calc(100vh - 2rem)" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
                  <div>
                    <h2 className="text-white font-bold text-2xl">¿Algo más?</h2>
                    <p className="text-gray-500 text-sm mt-0.5">Revisa tu orden antes de pagar</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto px-6 pb-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const itemTotal =
                        (item.price + item.modifiers.reduce((s, m) => s + m.price, 0)) *
                        item.quantity;
                      return (
                        <div key={item.id} className="flex gap-3 items-start bg-white/5 rounded-2xl p-3">
                          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-2xl">{getFoodEmoji(item.name)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-white font-semibold text-sm">{item.quantity}× {item.name}</p>
                              <span className="text-white font-bold text-sm tabular-nums flex-shrink-0">{formatPrice(itemTotal)}</span>
                            </div>
                            {item.modifiers.length > 0 && (
                              <ul className="mt-1 space-y-0.5">
                                {item.modifiers.map((m) => (
                                  <li key={m.id} className="text-xs text-gray-500 flex items-center gap-1">
                                    <span className="text-green-500">+</span>{m.name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals + CTA */}
                <div className="px-6 pb-6 pt-4 border-t border-white/8 flex-shrink-0">
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span><span className="tabular-nums">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Impuesto ({taxRate}%)</span><span className="tabular-nums">{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/8">
                      <span>Total</span><span className="tabular-nums text-green-400">{formatPrice(total)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-2xl bg-white/8 hover:bg-white/12 text-white font-semibold text-sm transition-colors"
                    >
                      Agregar más
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setStep("payment")}
                      className="flex-1 py-3 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      Ir a pagar <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PASO 2: PAGO ── */}
          <AnimatePresence mode="wait" custom={1}>
            {step === "payment" && (
              <motion.div
                key="payment"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.25, 1, 0.3, 1] }}
                className="px-6 py-6"
              >
                <button
                  onClick={() => setStep("review")}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Regresar
                </button>

                <h2 className="text-white font-bold text-2xl mb-1">Método de pago</h2>
                <p className="text-gray-500 text-sm mb-8">Selecciona cómo deseas pagar</p>

                {/* Square card placeholder */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePlaceOrder}
                  className="w-full bg-white/5 border-2 border-white/15 hover:border-green-500/60 hover:bg-green-500/5 rounded-2xl p-5 flex items-center gap-4 transition-all group mb-4"
                >
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-7 h-7 text-gray-800" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-base">Tarjeta de débito o crédito</p>
                    <p className="text-gray-400 text-sm mt-0.5">Visa, Mastercard, Amex · Powered by Square</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-500/15 group-hover:bg-green-500 flex items-center justify-center transition-all">
                    <ChevronRight className="w-4 h-4 text-green-400 group-hover:text-white" />
                  </div>
                </motion.button>

                {/* Square logo badge */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                    <span className="text-black font-black text-xs">■</span>
                  </div>
                  <span className="text-gray-600 text-xs">Pagos seguros procesados por Square</span>
                </div>

                <div className="mt-6 pt-4 border-t border-white/8">
                  <div className="flex justify-between text-white font-bold text-base">
                    <span>Total a pagar</span>
                    <span className="text-green-400 tabular-nums">{formatPrice(total)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PASO 3: PROCESANDO ── */}
          <AnimatePresence mode="wait">
            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 px-6 text-center"
              >
                <div className="relative w-20 h-20 mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-4 border-green-500/20 border-t-green-500"
                  />
                  <div className="absolute inset-3 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Procesando tu pedido</h3>
                <p className="text-gray-500 text-sm">Por favor espera un momento...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PASO 4: TICKET ── */}
          <AnimatePresence mode="wait">
            {step === "ticket" && orderNumber !== null && (
              <motion.div
                key="ticket"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex flex-col"
                style={{ maxHeight: "calc(100vh - 2rem)" }}
              >
                {/* Success header */}
                <div className="px-6 pt-6 pb-4 flex items-center gap-4 flex-shrink-0">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.15 }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-white font-bold text-xl">¡Orden confirmada!</h2>
                    <p className="text-gray-400 text-sm">Imprime tu ticket para pagar en caja</p>
                  </div>
                </div>

                {/* Ticket visual */}
                <div className="flex-1 overflow-y-auto px-6 pb-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                    {/* Ticket printable content */}
                    <div
                      id="thermal-ticket"
                      ref={ticketRef}
                      style={{
                        background: "white",
                        color: "#000",
                        fontFamily: "monospace",
                        padding: "14px 10px",
                        fontSize: 11,
                        width: "100%",
                        maxWidth: 280,
                        margin: "0 auto",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Header */}
                      <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: 10, marginBottom: 10 }}>
                        <p style={{ fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "#000" }}>
                          {restaurantName}
                        </p>
                        <p style={{ fontSize: 10, color: "#000", marginTop: 2 }}>{dateStr} · {timeStr}</p>
                        <div
                          id="order-number-badge"
                          style={{
                            marginTop: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "#000",
                            color: "#fff",
                            padding: "4px 12px",
                            borderRadius: 20,
                            WebkitPrintColorAdjust: "exact",
                            printColorAdjust: "exact",
                          } as React.CSSProperties}>
                          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#fff", background: "transparent" }}>Orden</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", background: "transparent" }}>#{orderNumber}</span>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ marginBottom: 10, width: "100%" }}>
                        {ticketItems.map((item, i) => {
                          const itemTotal = (item.price + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity;
                          return (
                            <div key={i} style={{ marginBottom: 5 }}>
                              <div style={{ display: "table", width: "100%", fontSize: 11, fontWeight: 700, color: "#000" }}>
                                <span style={{ display: "table-cell", textAlign: "left" }}>{item.quantity}× {item.name}</span>
                                <span style={{ display: "table-cell", textAlign: "right", whiteSpace: "nowrap", paddingLeft: 6, width: 1 }}>{formatPrice(itemTotal)}</span>
                              </div>
                              {item.modifiers.map((m) => (
                                <p key={m.id} style={{ fontSize: 9, color: "#000", paddingLeft: 12, margin: "1px 0" }}>+ {m.name}</p>
                              ))}
                            </div>
                          );
                        })}
                      </div>

                      {/* Totals */}
                      <div style={{ borderTop: "1px dashed #000", paddingTop: 8, marginBottom: 10, width: "100%" }}>
                        {[
                          { label: "Subtotal", value: formatPrice(ticketSubtotal) },
                          { label: `Impuesto (${taxRate}%)`, value: formatPrice(ticketTax) },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ display: "table", width: "100%", fontSize: 10, color: "#000", marginBottom: 2 }}>
                            <span style={{ display: "table-cell", textAlign: "left" }}>{label}</span>
                            <span style={{ display: "table-cell", textAlign: "right", whiteSpace: "nowrap", paddingLeft: 6, width: 1 }}>{value}</span>
                          </div>
                        ))}
                        <div style={{ display: "table", width: "100%", fontSize: 13, fontWeight: 900, color: "#000", borderTop: "1px solid #000", paddingTop: 5, marginTop: 3 }}>
                          <span style={{ display: "table-cell", textAlign: "left" }}>TOTAL</span>
                          <span style={{ display: "table-cell", textAlign: "right", whiteSpace: "nowrap", paddingLeft: 6, width: 1 }}>{formatPrice(ticketTotal)}</span>
                        </div>
                      </div>

                      {/* Barcode */}
                      <div style={{ borderTop: "1px dashed #000", paddingTop: 10, marginBottom: 10, textAlign: "center" }}>
                        <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#000", marginBottom: 6 }}>
                          -- Escanea en caja para pagar --
                        </p>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <Barcode
                            value={String(orderNumber)}
                            width={1.6}
                            height={50}
                            fontSize={12}
                            displayValue={true}
                            background="#ffffff"
                            lineColor="#000000"
                            margin={0}
                          />
                        </div>
                      </div>

                      {/* QR */}
                      <div style={{ borderTop: "1px dashed #000", paddingTop: 10, textAlign: "center", paddingBottom: 6 }}>
                        <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#000", marginBottom: 6 }}>
                          -- Seguimiento de tu orden --
                        </p>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                          <QRCodeSVG value={statusUrl} size={80} level="M" fgColor="#000000" bgColor="#ffffff" />
                        </div>
                        <p style={{ fontSize: 9, color: "#000" }}>Escanea para ver cuando este lista</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-white/8 flex gap-3 flex-shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePrint}
                    className="flex-1 py-3.5 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir ticket
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                    className="px-5 py-3.5 rounded-2xl bg-white/8 hover:bg-white/12 text-white font-semibold text-sm transition-colors"
                  >
                    Cerrar
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Portal de ticket oculto para impresión (fuera del modal) */}
      {step === "ticket" && orderNumber !== null && orderId !== null && (
        <div style={{ display: "none" }} aria-hidden>
          {/* El #thermal-ticket dentro del modal ya es visible para print */}
        </div>
      )}
    </>
  );
}
