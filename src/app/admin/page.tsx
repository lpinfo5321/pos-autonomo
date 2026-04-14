"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { TrendingUp, ShoppingBag, DollarSign, Clock, Package, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingOrders: number;
  totalItems: number;
  recentOrders: RecentOrder[];
  last7Days: { date: string; revenue: number }[];
}

interface RecentOrder {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  customerName?: string | null;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const statCards = [
  {
    key: "todayRevenue" as keyof Stats,
    label: "Ventas hoy",
    icon: DollarSign,
    color: "bg-green-500",
    format: (v: number) => formatPrice(v),
  },
  {
    key: "todayOrders" as keyof Stats,
    label: "Pedidos hoy",
    icon: ShoppingBag,
    color: "bg-blue-500",
    format: (v: number) => v.toString(),
  },
  {
    key: "pendingOrders" as keyof Stats,
    label: "Pendientes",
    icon: Clock,
    color: "bg-yellow-500",
    format: (v: number) => v.toString(),
  },
  {
    key: "totalRevenue" as keyof Stats,
    label: "Total histórico",
    icon: TrendingUp,
    color: "bg-purple-500",
    format: (v: number) => formatPrice(v),
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const maxRevenue = Math.max(...stats.last7Days.map((d) => d.revenue), 1);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Resumen de tu negocio</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ key, label, icon: Icon, color, format }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-gray-500 text-xs font-medium">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {format(stats[key] as number)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
      >
        <h2 className="font-bold text-gray-900 mb-4">Ventas últimos 7 días</h2>
        <div className="flex items-end gap-2 h-32">
          {stats.last7Days.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                transition={{ delay: i * 0.05 + 0.5, duration: 0.5, ease: "easeOut" }}
                className={`w-full rounded-t-lg min-h-[4px] ${day.revenue > 0 ? "bg-green-400" : "bg-gray-100"}`}
                style={{ minHeight: day.revenue > 0 ? "8px" : "4px" }}
              />
              <span className="text-xs text-gray-400 text-center truncate w-full text-center">
                {day.date}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Pedidos recientes</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
          >
            Ver todos <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay pedidos aún</p>
            </div>
          ) : (
            stats.recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">#{order.orderNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.customerName || "Cliente"} • {formatDate(order.createdAt)}
                  </p>
                </div>
                <span className="font-bold text-green-600 text-sm">{formatPrice(order.total)}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-3"
      >
        <Link href="/admin/menu">
          <div className="bg-blue-50 hover:bg-blue-100 rounded-2xl p-4 flex items-center gap-3 transition-colors cursor-pointer border border-blue-100">
            <Package className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-semibold text-blue-900 text-sm">Gestionar Menú</p>
              <p className="text-xs text-blue-600">{stats.totalItems} items activos</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/orders">
          <div className="bg-orange-50 hover:bg-orange-100 rounded-2xl p-4 flex items-center gap-3 transition-colors cursor-pointer border border-orange-100">
            <Clock className="w-8 h-8 text-orange-500" />
            <div>
              <p className="font-semibold text-orange-900 text-sm">Ver Pedidos</p>
              <p className="text-xs text-orange-600">{stats.pendingOrders} pendientes</p>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
