"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingBag, DollarSign, Clock,
  BarChart2, RefreshCw, Star
} from "lucide-react";

type Range = "today" | "week" | "month" | "all";

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  topProducts: { name: string; qty: number; revenue: number }[];
  byHour: Record<string, number>;
  byDay: Record<string, number>;
  recentOrders: {
    orderNumber: number;
    total: number;
    status: string;
    itemCount: number;
    createdAt: string;
  }[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pendiente",  color: "bg-yellow-100 text-yellow-700" },
  preparing:  { label: "Preparando", color: "bg-blue-100 text-blue-700" },
  ready:      { label: "Lista",      color: "bg-green-100 text-green-700" },
  completed:  { label: "Entregada",  color: "bg-gray-100 text-gray-600" },
};

export default function ReportesPage() {
  const [range, setRange] = useState<Range>("today");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reports?range=${range}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }).format(n);

  const rangeLabel = { today: "Hoy", week: "7 días", month: "Este mes", all: "Todo" };

  // Para la gráfica de horas
  const hourEntries = data
    ? Array.from({ length: 24 }, (_, h) => ({
        h,
        val: data.byHour[h] ?? 0,
      })).filter((e) => e.val > 0)
    : [];
  const maxHour = Math.max(...hourEntries.map((e) => e.val), 1);

  // Para la gráfica de días
  const dayEntries = data ? Object.entries(data.byDay) : [];
  const maxDay = Math.max(...dayEntries.map(([, v]) => v), 1);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Reportes de Ventas</h1>
          <p className="text-gray-500 text-sm">Resumen de órdenes del kiosco</p>
        </div>
        <div className="flex items-center gap-2">
          {(["today", "week", "month", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                range === r
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {rangeLabel[r]}
            </button>
          ))}
          <button
            onClick={load}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-gray-400" : "text-gray-600"} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={32} className="animate-spin text-gray-400" />
        </div>
      ) : data ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <DollarSign size={22} />,
                label: "Ingresos totales",
                value: fmt(data.totalRevenue),
                color: "bg-green-500",
              },
              {
                icon: <ShoppingBag size={22} />,
                label: "Órdenes",
                value: data.totalOrders.toString(),
                color: "bg-blue-500",
              },
              {
                icon: <TrendingUp size={22} />,
                label: "Ticket promedio",
                value: fmt(data.avgTicket),
                color: "bg-purple-500",
              },
            ].map((kpi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-gray-100"
              >
                <div className={`${kpi.color} rounded-xl p-3 text-white`}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Productos más vendidos */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-yellow-500" />
                <h2 className="font-bold text-gray-900">Productos más vendidos</h2>
              </div>
              {data.topProducts.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Sin datos para este período</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((p, i) => {
                    const maxQty = data.topProducts[0]?.qty ?? 1;
                    const pct = Math.round((p.qty / maxQty) * 100);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 w-4">
                              {i + 1}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">
                              {p.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs text-gray-500">×{p.qty}</span>
                            <span className="text-sm font-bold text-gray-900">
                              {fmt(p.revenue)}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Ventas por hora */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-blue-500" />
                <h2 className="font-bold text-gray-900">Ventas por hora</h2>
              </div>
              {hourEntries.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Sin datos para este período</p>
              ) : (
                <div className="flex items-end gap-1 h-40">
                  {hourEntries.map(({ h, val }) => (
                    <div key={h} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.round((val / maxHour) * 100)}%` }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="w-full bg-blue-500 rounded-t-md min-h-[4px]"
                        title={`${h}:00 - ${fmt(val)}`}
                      />
                      <span className="text-[10px] text-gray-400">{h}h</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Ventas por día */}
          {dayEntries.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-purple-500" />
                <h2 className="font-bold text-gray-900">Ventas por día</h2>
              </div>
              <div className="flex items-end gap-2 h-32">
                {dayEntries.map(([day, val]) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-700">{fmt(val)}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.round((val / maxDay) * 80)}%` }}
                      transition={{ duration: 0.5 }}
                      className="w-full bg-purple-500 rounded-t-md min-h-[4px]"
                    />
                    <span className="text-[10px] text-gray-400 text-center">{day}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Órdenes recientes */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <h2 className="font-bold text-gray-900 mb-4">Órdenes recientes</h2>
            {data.recentOrders.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin órdenes en este período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-2 font-semibold">Orden</th>
                      <th className="pb-2 font-semibold">Hora</th>
                      <th className="pb-2 font-semibold">Ítems</th>
                      <th className="pb-2 font-semibold">Estado</th>
                      <th className="pb-2 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentOrders.map((o) => {
                      const st = STATUS_LABELS[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-600" };
                      return (
                        <tr key={o.orderNumber} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 font-bold text-gray-900">#{o.orderNumber}</td>
                          <td className="py-2.5 text-gray-500">
                            {new Date(o.createdAt).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2.5 text-gray-600">{o.itemCount} ítem{o.itemCount !== 1 ? "s" : ""}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.color}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-bold text-gray-900">
                            {fmt(o.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      ) : (
        <p className="text-center text-gray-400">Error cargando datos</p>
      )}
    </div>
  );
}
