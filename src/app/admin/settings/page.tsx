"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Eye, EyeOff, ExternalLink, CheckCircle, Wifi } from "lucide-react";
import Button from "@/components/ui/Button";

interface SettingsData {
  restaurant_name: string;
  tax_rate: string;
  currency: string;
  square_access_token: string;
  square_location_id: string;
  square_environment: string;
  welcome_message: string;
  logo_url: string;
  primary_color: string;
  kiosk_url: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    restaurant_name: "",
    tax_rate: "8.5",
    currency: "USD",
    square_access_token: "",
    square_location_id: "",
    square_environment: "sandbox",
    welcome_message: "",
    logo_url: "",
    primary_color: "#22c55e",
    kiosk_url: "",
  });
  const [detectingIp, setDetectingIp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings((s) => ({ ...s, ...data }));
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof SettingsData, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const autoDetectIp = async () => {
    setDetectingIp(true);
    try {
      const res = await fetch("/api/network-url");
      const data = await res.json();
      update("kiosk_url", data.url);
    } finally {
      setDetectingIp(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500">Ajusta tu restaurante y pagos</p>
        </div>
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">¡Guardado!</span>
          </motion.div>
        )}
      </div>

      <div className="space-y-5">
        {/* General */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">🏪 General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre del restaurante
              </label>
              <input
                type="text"
                value={settings.restaurant_name}
                onChange={(e) => update("restaurant_name", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Mi Restaurante"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mensaje de bienvenida
              </label>
              <input
                type="text"
                value={settings.welcome_message}
                onChange={(e) => update("welcome_message", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="¡Bienvenido! Toca para ordenar"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                URL del logo
              </label>
              <input
                type="url"
                value={settings.logo_url}
                onChange={(e) => update("logo_url", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                URL del kiosco <span className="text-gray-400 font-normal">(para el QR de seguimiento)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={settings.kiosk_url}
                  onChange={(e) => update("kiosk_url", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                  placeholder="http://192.168.1.100:3000"
                />
                <button
                  type="button"
                  onClick={autoDetectIp}
                  disabled={detectingIp}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl border border-blue-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  <Wifi className="w-4 h-4" />
                  {detectingIp ? "Detectando..." : "Auto-detectar"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                La IP de red que los celulares usarán para escanear el QR. Haz click en &quot;Auto-detectar&quot; para obtenerla automáticamente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tasa de impuesto (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={settings.tax_rate}
                  onChange={(e) => update("tax_rate", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Moneda
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => update("currency", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="USD">USD - Dólar</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="ARS">ARS - Peso Argentino</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Color principal
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => update("primary_color", e.target.value)}
                  className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => update("primary_color", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="#22c55e"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Square */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">💳 Square Payments</h2>
            <a
              href="https://developer.squareup.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 flex items-center gap-1 hover:underline"
            >
              Obtener credenciales <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-700">
              <strong>Cómo configurar Square:</strong> Ve a{" "}
              <a href="https://developer.squareup.com" target="_blank" rel="noopener noreferrer" className="underline">
                developer.squareup.com
              </a>
              , crea una app y copia tu Access Token y Location ID. Usa Sandbox para pruebas.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Ambiente
              </label>
              <div className="flex gap-3">
                {["sandbox", "production"].map((env) => (
                  <button
                    key={env}
                    onClick={() => update("square_environment", env)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      settings.square_environment === env
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {env === "sandbox" ? "🧪 Sandbox" : "🚀 Producción"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Access Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={settings.square_access_token}
                  onChange={(e) => update("square_access_token", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                  placeholder={settings.square_environment === "sandbox" ? "sandbox-sq0idb-..." : "sq0atp-..."}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Location ID
              </label>
              <input
                type="text"
                value={settings.square_location_id}
                onChange={(e) => update("square_location_id", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                placeholder="L..."
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <Button onClick={handleSave} loading={saving} size="lg" className="w-full">
          <Save className="w-5 h-5" />
          Guardar configuración
        </Button>

        {/* Sección CRE */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🖨</span>
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Integración Cash Register Express</h3>
              <p className="text-sm text-blue-600">Carga automática de ítems al escanear el ticket</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <p>Ve a <strong>Menú → editar cada ítem</strong> y escribe el <strong>código PLU</strong> que ese ítem tiene en tu CRE.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <p>Instala <strong>AutoHotKey v1.x</strong> en la PC donde corre CRE (<a href="https://www.autohotkey.com" target="_blank" className="underline">autohotkey.com</a>).</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <p>Descarga el script bridge, <strong>edita la línea API_BASE</strong> con la IP de esta PC, y ejecútalo.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <p>Con CRE abierto en la pantalla de venta, <strong>escanea el código de barras</strong> del ticket del cliente → todos los ítems se agregan solos.</p>
            </div>
          </div>

          <a
            href="/cre-bridge.ahk"
            download="cre-bridge.ahk"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 transition-colors"
          >
            <span>⬇</span> Descargar script CRE Bridge (.ahk)
          </a>

          <p className="text-xs text-blue-500 text-center">
            Requiere AutoHotKey v1 · La IP del kiosco debe ser accesible desde la PC del cajero
          </p>
        </div>
      </div>
    </div>
  );
}
