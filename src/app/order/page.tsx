"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function OrderHomePage() {
  const router = useRouter();
  const [orderNum, setOrderNum] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = orderNum.trim();
    if (!num || isNaN(Number(num))) {
      setError("Ingresa un número de orden válido");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/status/${num}`);
      if (res.status === 404) {
        setError("No se encontró la orden #" + num);
      } else {
        router.push(`/order/${num}`);
      }
    } catch {
      setError("Error de conexión, intenta de nuevo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      {/* Logo / ícono */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="text-7xl mb-6"
      >
        🍔
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-white font-black text-3xl text-center mb-2"
      >
        Seguimiento de orden
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-gray-400 text-center text-base mb-10 max-w-xs"
      >
        Ingresa tu número de orden para ver si ya está lista o fue entregada
      </motion.p>

      {/* Formulario */}
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-xs flex flex-col gap-4"
      >
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xl select-none">
            #
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Número de orden"
            value={orderNum}
            onChange={(e) => { setOrderNum(e.target.value); setError(""); }}
            className="w-full bg-white/8 border border-white/10 text-white text-xl font-bold
                       rounded-2xl pl-10 pr-4 py-4 outline-none focus:border-green-500
                       placeholder:text-gray-600 transition-colors"
            autoFocus
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm text-center"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={loading || !orderNum.trim()}
          whileTap={{ scale: 0.97 }}
          className="bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed
                     text-white font-black text-lg rounded-2xl py-4 transition-colors flex items-center
                     justify-center gap-2"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>Buscar mi orden</>
          )}
        </motion.button>
      </motion.form>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-10 bg-white/5 rounded-2xl px-5 py-4 max-w-xs text-center"
      >
        <p className="text-gray-500 text-xs leading-relaxed">
          💡 También puedes escanear el <span className="text-gray-300">código QR</span> de tu ticket para ver el estado de tu orden en tiempo real
        </p>
      </motion.div>
    </div>
  );
}
