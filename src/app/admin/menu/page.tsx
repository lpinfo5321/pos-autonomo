"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Search, Star, ToggleLeft, ToggleRight, ImagePlus, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon?: string | null;
}

interface Modifier {
  id: string;
  name: string;
  price: number;
  calories?: number | null;
  image?: string | null;
  active: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  modifiers: Modifier[];
}

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  calories?: number | null;
  image?: string | null;
  posCode?: string | null;
  featured: boolean;
  active: boolean;
  categoryId: string;
  category: Category;
  modifierGroups?: ModifierGroup[];
}

interface FormData {
  name: string;
  description: string;
  price: string;
  calories: string;
  categoryId: string;
  image: string;
  posCode: string;
  featured: boolean;
  active: boolean;
}

const emptyForm: FormData = {
  name: "",
  description: "",
  price: "",
  calories: "",
  categoryId: "",
  image: "",
  posCode: "",
  featured: false,
  active: true,
};

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [modUploadingId, setModUploadingId] = useState<string | null>(null);
  const [editItemModifiers, setEditItemModifiers] = useState<ModifierGroup[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [itemsRes, catsRes] = await Promise.all([
      fetch("/api/admin/items").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]);
    setItems(itemsRes);
    setCategories(catsRes);
    setLoading(false);
  }

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || item.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || "" });
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    // Usar siempre la versión más reciente del item desde el estado
    const fresh = items.find((i) => i.id === item.id) ?? item;
    setEditItem(fresh);
    setForm({
      name: fresh.name,
      description: fresh.description || "",
      price: fresh.price.toString(),
      calories: fresh.calories?.toString() || "",
      categoryId: fresh.categoryId,
      image: fresh.image || "",
      posCode: fresh.posCode || "",
      featured: fresh.featured,
      active: fresh.active,
    });
    setEditItemModifiers(fresh.modifierGroups || []);
    setShowModal(true);
  };

  const handleModifierImageChange = async (modId: string, file: File) => {
    setModUploadingId(modId);
    try {
      // 1. Subir archivo
      const uploadData = new window.FormData();
      uploadData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
      const uploaded = await uploadRes.json();
      if (!uploaded.url) return;

      // 2. Guardar URL en DB
      await fetch(`/api/admin/modifiers/${modId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploaded.url }),
      });

      // 3. Actualizar vista local
      setEditItemModifiers((prev) =>
        prev.map((g) => ({
          ...g,
          modifiers: g.modifiers.map((m) =>
            m.id === modId ? { ...m, image: uploaded.url } : m
          ),
        }))
      );

      // 4. Refrescar lista para persistir entre aperturas del modal
      const refreshed = await fetch("/api/admin/items").then((r) => r.json());
      setItems(refreshed);
    } catch (err) {
      console.error("Error subiendo imagen de modificador:", err);
    } finally {
      setModUploadingId(null);
    }
  };

  const handleModifierImageRemove = async (modId: string) => {
    await fetch(`/api/admin/modifiers/${modId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: null }),
    });
    setEditItemModifiers((prev) =>
      prev.map((g) => ({
        ...g,
        modifiers: g.modifiers.map((m) =>
          m.id === modId ? { ...m, image: null } : m
        ),
      }))
    );
    const refreshed = await fetch("/api/admin/items").then((r) => r.json());
    setItems(refreshed);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, image: data.url }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) return;
    setSaving(true);

    try {
      const method = editItem ? "PUT" : "POST";
      const url = editItem ? `/api/admin/items/${editItem.id}` : "/api/admin/items";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        await loadData();
        setShowModal(false);
        setForm(emptyForm);
        setEditItem(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/items/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems(items.filter((i) => i.id !== id));
      setDeleteConfirm(null);
    }
  };

  const toggleActive = async (item: MenuItem) => {
    const res = await fetch(`/api/admin/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, active: !item.active, price: item.price.toString(), calories: item.calories?.toString() || "" }),
    });
    if (res.ok) loadData();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
          <p className="text-sm text-gray-500">{items.length} items en total</p>
        </div>
        <Button onClick={openCreate} size="md">
          <Plus className="w-4 h-4" />
          Nuevo item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar items..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <span className="text-4xl block mb-2">🍽️</span>
            <p>No hay items</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors ${!item.active ? "opacity-50" : ""}`}
              >
                {/* Emoji/Image */}
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl overflow-hidden">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{item.category?.icon || "🍽️"}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm truncate">{item.name}</span>
                    {item.featured && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                    {!item.active && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactivo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {item.category?.icon} {item.category?.name}
                    </span>
                    {item.calories && (
                      <span className="text-xs text-gray-400">• {item.calories} cal</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <span className="font-bold text-green-600 text-sm flex-shrink-0">
                  {formatPrice(item.price)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(item)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={item.active ? "Desactivar" : "Activar"}
                  >
                    {item.active ? (
                      <ToggleRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
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

      {/* Create/Edit Modal */}
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
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-5">
                  {editItem ? "Editar item" : "Nuevo item"}
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Nombre <span className="text-green-600">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:border-green-500 placeholder:text-gray-400"
                      placeholder="Nombre del producto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-green-500 resize-none placeholder:text-gray-400"
                      rows={2}
                      placeholder="Descripción del producto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1.5">Precio <span className="text-green-600">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          className="w-full border-2 border-gray-200 rounded-xl pl-7 pr-3 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:border-green-500 placeholder:text-gray-400"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1.5">Calorías</label>
                      <input
                        type="number"
                        value={form.calories}
                        onChange={(e) => setForm({ ...form, calories: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-green-500 placeholder:text-gray-400"
                        placeholder="0 kcal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Categoría <span className="text-green-600">*</span></label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:border-green-500 bg-white"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Imagen</label>

                    {/* Preview */}
                    {form.image ? (
                      <div className="relative w-full h-40 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 mb-2 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.image}
                          alt="preview"
                          className="h-full w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image: "" })}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1 shadow transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-green-400 hover:bg-green-50/40 transition-colors mb-2 cursor-pointer"
                      >
                        <ImagePlus className="w-7 h-7 text-gray-400" />
                        <span className="text-sm text-gray-500 font-medium">
                          {uploading ? "Subiendo…" : "Haz clic para subir imagen"}
                        </span>
                        <span className="text-xs text-gray-400">JPG, PNG, WebP · máx 5 MB</span>
                      </button>
                    )}

                    {/* Input oculto */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {/* O pegar URL */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400">o pega una URL</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <input
                      type="url"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-green-500 mt-2 placeholder:text-gray-400"
                      placeholder="https://..."
                    />
                  </div>

                  {/* Código PLU para Cash Register Express */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <label className="block text-sm font-bold text-blue-900 mb-1.5">
                      🖨 Código PLU
                      <span className="ml-2 text-xs font-semibold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Cash Register Express</span>
                    </label>
                    <input
                      type="text"
                      value={form.posCode}
                      onChange={(e) => setForm({ ...form, posCode: e.target.value })}
                      className="w-full border-2 border-blue-200 bg-white rounded-xl px-4 py-3 text-base font-bold text-gray-900 focus:outline-none focus:border-blue-500 font-mono placeholder:text-gray-400 placeholder:font-normal"
                      placeholder="Ej: 1001"
                    />
                    <p className="text-xs font-medium text-blue-600 mt-2">
                      Al escanear el ticket del cliente, este código se teclea automáticamente en CRE.
                    </p>
                  </div>

                  <div className="flex gap-6 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        className="w-5 h-5 accent-green-500 rounded"
                      />
                      <span className="text-sm font-bold text-gray-900">⭐ Destacado</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => setForm({ ...form, active: e.target.checked })}
                        className="w-5 h-5 accent-green-500 rounded"
                      />
                      <span className="text-sm font-bold text-gray-900">✅ Activo</span>
                    </label>
                  </div>

                  {/* Imágenes de modificadores — solo al editar */}
                  {editItem && editItemModifiers.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Imágenes de ingredientes
                      </label>
                      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                        {editItemModifiers.flatMap((g) => g.modifiers).map((mod) => (
                          <div key={mod.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                            {/* Preview o placeholder */}
                            <div className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                              {mod.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={mod.image} alt={mod.name} className="w-full h-full object-contain" />
                              ) : (
                                <ImagePlus className="w-4 h-4 text-gray-300" />
                              )}
                            </div>

                            {/* Nombre */}
                            <span className="flex-1 text-sm text-gray-700 font-medium truncate">{mod.name}</span>

                            {/* Botones */}
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => modFileRefs.current[mod.id]?.click()}
                                disabled={modUploadingId === mod.id}
                                className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {modUploadingId === mod.id ? "…" : "Subir"}
                              </button>
                              {mod.image && (
                                <button
                                  type="button"
                                  onClick={() => handleModifierImageRemove(mod.id)}
                                  className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded-lg transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Input oculto */}
                            <input
                              ref={(el) => { modFileRefs.current[mod.id] = el; }}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleModifierImageChange(mod.id, file);
                                e.target.value = "";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <Button onClick={handleSave} loading={saving} className="flex-1 py-3 font-bold">
                    {editItem ? "💾 Guardar cambios" : "➕ Crear item"}
                  </Button>
                </div>
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
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar item?</h3>
              <p className="text-gray-500 text-sm mb-5">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
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
