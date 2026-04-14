"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChefHat, CheckCircle2, Clock, Package, Barcode } from "lucide-react";

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pendiente",    color: "text-yellow-400", bg: "bg-yellow-400/10" },
  preparing: { label: "En cocina",    color: "text-blue-400",   bg: "bg-blue-400/10"  },
  ready:     { label: "Lista",        color: "text-green-400",  bg: "bg-green-400/10" },
  completed: { label: "Entregada",    color: "text-gray-400",   bg: "bg-white/5"      },
};

function parseMods(raw: string): { name: string; price: number }[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}

export default function CashierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [scanning, setScanning] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const scanBuffer = useRef("");
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?limit=50");
      const data = await res.json();
      const active = (data.orders as Order[]).filter(
        (o) => o.status !== "completed"
      );
      setOrders(active);
      // Refresh selected order data
      setSelected((prev) =>
        prev ? (active.find((o) => o.id === prev.id) ?? prev) : null
      );
    } catch { /* keep showing */ }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Barcode scanner: listens for rapid keystrokes from scanner (ends with Enter)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if user is typing in search box
      if (document.activeElement === searchRef.current) return;

      if (e.key === "Enter") {
        const num = parseInt(scanBuffer.current);
        if (!isNaN(num) && num > 0) {
          handleBarcodeInput(num);
        }
        scanBuffer.current = "";
        if (scanTimer.current) clearTimeout(scanTimer.current);
      } else if (e.key.length === 1 && /\d/.test(e.key)) {
        scanBuffer.current += e.key;
        if (scanTimer.current) clearTimeout(scanTimer.current);
        scanTimer.current = setTimeout(() => { scanBuffer.current = ""; }, 200);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const handleBarcodeInput = (orderNum: number) => {
    const found = orders.find((o) => o.orderNumber === orderNum);
    if (found) {
      setSelected(found);
      setScanning(true);
      setTimeout(() => setScanning(false), 1000);
    } else {
      // Fetch from API in case it's not in the active list
      fetch(`/api/orders/status/${orderNum}`)
        .then((r) => r.json())
        .then((order: Order) => {
          setSelected(order);
          setScanning(true);
          setTimeout(() => setScanning(false), 1000);
        })
        .catch(() => showNotification("Orden no encontrada"));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(searchVal.trim());
    if (!isNaN(num)) handleBarcodeInput(num);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated: Order = await res.json();
      setSelected(updated);
      setOrders((prev) =>
        newStatus === "completed"
          ? prev.filter((o) => o.id !== orderId)
          : prev.map((o) => (o.id === orderId ? updated : o))
      );
      showNotification(
        newStatus === "preparing"
          ? `Orden #${updated.orderNumber} enviada a cocina`
          : newStatus === "ready"
          ? `Orden #${updated.orderNumber} marcada lista`
          : `Orden #${updated.orderNumber} completada`
      );
    } catch {
      showNotification("Error al actualizar la orden");
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const pendingCount  = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount    = orders.filter((o) => o.status === "ready").length;

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base">Estación de Cajero</h1>
            <p className="text-gray-500 text-xs">Actualiza cada 5s</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {[
            { count: pendingCount,   label: "Pendientes", color: "bg-yellow-400/10 text-yellow-400" },
            { count: preparingCount, label: "En cocina",  color: "bg-blue-400/10   text-blue-400"   },
            { count: readyCount,     label: "Listas",     color: "bg-green-400/10  text-green-400"  },
          ].map(({ count, label, color }) => (
            <div key={label} className={`px-3 py-1.5 rounded-xl ${color} text-center`}>
              <p className="font-black text-lg leading-none">{count}</p>
              <p className="text-xs font-medium opacity-80">{label}</p>
            </div>
          ))}
        </div>

        {/* Search / scanner input */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={searchRef}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="# de orden o escanear"
              className="w-52 bg-white/8 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-green-500/50"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Scan flash */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 border-4 border-green-400 rounded-none"
          />
        )}
      </AnimatePresence>

      {/* Notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-xl"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Orders list */}
        <div className="w-80 border-r border-white/8 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Órdenes activas</p>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#222 transparent" }}>
            <AnimatePresence initial={false}>
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <Package className="w-10 h-10 text-gray-700 mb-3" />
                  <p className="text-gray-500 text-sm">Sin órdenes activas</p>
                </div>
              ) : (
                orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                  const isActive = selected?.id === order.id;
                  return (
                    <motion.button
                      key={order.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => setSelected(order)}
                      className={`w-full text-left px-4 py-3.5 border-b border-white/5 transition-colors ${
                        isActive ? "bg-white/8" : "hover:bg-white/4"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                          <span className="text-white font-bold text-sm">#{order.orderNumber}</span>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                        <span className="text-gray-400 font-semibold">${order.total.toFixed(2)}</span>
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-600 text-xs">{timeAgo(order.createdAt)}</span>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Order detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center px-6"
              >
                <Barcode className="w-16 h-16 text-gray-700 mb-4" />
                <h2 className="text-gray-400 font-bold text-xl mb-2">Selecciona una orden</h2>
                <p className="text-gray-600 text-sm max-w-xs">
                  Elige una orden de la lista, ingresa el número manualmente, o escanea el código de barras del ticket del cliente
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Detail header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
                  <div>
                    <h2 className="text-white font-black text-2xl">Orden #{selected.orderNumber}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const cfg = STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.pending;
                        return (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color} ${cfg.bg}`}>
                            {cfg.label}
                          </span>
                        );
                      })()}
                      <span className="text-gray-600 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(selected.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">Total</p>
                    <p className="text-white font-black text-2xl tabular-nums">${selected.total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#222 transparent" }}>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">Detalle de la orden</p>
                  <div className="space-y-2">
                    {selected.items.map((item) => {
                      const mods = parseMods(item.modifiers);
                      return (
                        <div key={item.id} className="bg-white/5 rounded-2xl px-4 py-3">
                          <div className="flex justify-between items-start">
                            <span className="text-white font-bold text-sm">{item.quantity}× {item.name}</span>
                            <span className="text-gray-400 text-sm tabular-nums">
                              ${((item.price + mods.reduce((s, m) => s + m.price, 0)) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          {mods.length > 0 && (
                            <ul className="mt-1.5 space-y-0.5">
                              {mods.map((m, i) => (
                                <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                                  <span className="text-green-500 font-bold">+</span>{m.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Totals */}
                  <div className="mt-4 bg-white/5 rounded-2xl px-4 py-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Subtotal</span><span className="tabular-nums">${selected.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Impuesto</span><span className="tabular-nums">${selected.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-base pt-1.5 border-t border-white/8">
                      <span>Total</span><span className="tabular-nums text-green-400">${selected.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-6 py-4 border-t border-white/8 flex-shrink-0">
                  <div className="flex gap-3">
                    {selected.status === "pending" && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => updateStatus(selected.id, "preparing")}
                        className="flex-1 py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <ChefHat className="w-4 h-4" />
                        Enviar a cocina
                      </motion.button>
                    )}
                    {selected.status === "preparing" && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => updateStatus(selected.id, "ready")}
                        className="flex-1 py-3.5 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Lista para recoger
                      </motion.button>
                    )}
                    {selected.status === "ready" && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => updateStatus(selected.id, "completed")}
                        className="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        Marcar entregada
                      </motion.button>
                    )}
                    <button
                      onClick={() => setSelected(null)}
                      className="px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 font-semibold text-sm transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
