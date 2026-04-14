"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import Button from "@/components/ui/Button";

interface Category {
  id: string;
  name: string;
  icon?: string | null;
  sortOrder: number;
  active: boolean;
  _count: { items: number };
}

const COMMON_EMOJIS = ["🍔", "🍗", "🥗", "🍟", "🥤", "🍦", "🌭", "🍕", "🌮", "🍣", "⭐", "🔥", "🆕", "🥩", "🍰"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", icon: "🍽️", sortOrder: "0" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    const data = await fetch("/api/admin/categories").then((r) => r.json());
    setCategories(data);
    setLoading(false);
  }

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: "", icon: "🍽️", sortOrder: String(categories.length) });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setForm({ name: cat.name, icon: cat.icon || "🍽️", sortOrder: String(cat.sortOrder) });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const method = editCat ? "PUT" : "POST";
      const url = editCat ? `/api/admin/categories/${editCat.id}` : "/api/admin/categories";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: parseInt(form.sortOrder) }),
      });
      if (res.ok) {
        await loadCategories();
        setShowModal(false);
        setEditCat(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories(categories.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    }
  };

  const toggleActive = async (cat: Category) => {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !cat.active }),
    });
    loadCategories();
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500">{categories.length} categorías</p>
        </div>
        <Button onClick={openCreate} size="md">
          <Plus className="w-4 h-4" />
          Nueva categoría
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {categories.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <span className="text-4xl block mb-2">📂</span>
              <p>No hay categorías</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors ${!cat.active ? "opacity-50" : ""}`}
                >
                  <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
                  
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {cat.icon || "📂"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat._count.items} items • Orden: {cat.sortOrder}</p>
                  </div>

                  {!cat.active && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0">
                      Inactiva
                    </span>
                  )}

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(cat)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        cat.active
                          ? "bg-green-50 text-green-600 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {cat.active ? "Activa" : "Inactiva"}
                    </button>
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cat.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                {editCat ? "Editar categoría" : "Nueva categoría"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nombre de la categoría"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Icono (emoji)</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-2xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="🍽️"
                    maxLength={4}
                  />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setForm({ ...form, icon: emoji })}
                        className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          form.icon === emoji ? "bg-green-100 ring-2 ring-green-400" : "hover:bg-gray-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Orden</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <Button onClick={handleSave} loading={saving} className="flex-1">
                  {editCat ? "Guardar" : "Crear"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-bold mb-2">¿Eliminar categoría?</h3>
              <p className="text-gray-500 text-sm mb-5">Se eliminarán todos los items asociados.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <Button
                  onClick={() => handleDelete(deleteConfirm)}
                  variant="danger"
                  className="flex-1"
                >
                  Eliminar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
