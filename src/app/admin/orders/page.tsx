"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Eye, ChevronDown, Filter } from "lucide-react";
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers: string;
  notes?: string | null;
}

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string | null;
  customerName?: string | null;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "preparing", label: "Preparando" },
  { value: "ready", label: "Listos" },
  { value: "completed", label: "Completados" },
  { value: "cancelled", label: "Cancelados" },
];

const NEXT_STATUS: Record<string, string> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  pending: "Preparar",
  preparing: "Listo",
  ready: "Completar",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadOrders = useCallback(async () => {
    const url = statusFilter === "all" ? "/api/orders?limit=50" : `/api/orders?status=${statusFilter}&limit=50`;
    const data = await fetch(url).then((r) => r.json());
    setOrders(data.orders || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        const updated = await res.json();
        setSelectedOrder(updated);
      }
    }
    setUpdating(null);
  };

  const parseModifiers = (modifiersStr: string) => {
    try {
      return JSON.parse(modifiersStr) as { name: string; price: number }[];
    } catch {
      return [];
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500">{total} en total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              autoRefresh ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
            Auto
          </button>
          <Button variant="outline" onClick={loadOrders} size="md">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === value
                ? "bg-green-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <span className="text-4xl block mb-2">📋</span>
          <p>No hay pedidos con este filtro</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Order number */}
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">#{order.orderNumber}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">
                      {order.customerName || "Cliente"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(order.createdAt)} • {order.items.length} items
                    {order.paymentMethod && ` • ${order.paymentMethod}`}
                  </p>
                </div>

                {/* Total */}
                <span className="font-bold text-green-600 text-sm flex-shrink-0">
                  {formatPrice(order.total)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {NEXT_STATUS[order.status] && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(order.id, NEXT_STATUS[order.status])}
                      loading={updating === order.id}
                    >
                      {NEXT_STATUS_LABEL[order.status]}
                    </Button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Expanded view */}
              <AnimatePresence>
                {selectedOrder?.id === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50">
                      <div className="space-y-2">
                        {order.items.map((item) => {
                          const mods = parseModifiers(item.modifiers);
                          return (
                            <div key={item.id} className="text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="text-green-600 font-semibold">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                              {mods.length > 0 && (
                                <p className="text-xs text-gray-500 ml-4">
                                  + {mods.map((m) => m.name).join(", ")}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-gray-400 italic ml-4">{item.notes}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Impuesto</span><span>{formatPrice(order.tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-800 text-sm">
                          <span>Total</span><span>{formatPrice(order.total)}</span>
                        </div>
                      </div>
                      {order.notes && (
                        <p className="mt-2 text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                          📝 {order.notes}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
