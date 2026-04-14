"use client";
import { motion, type Variants } from "framer-motion";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  calories?: number | null;
  featured?: boolean;
  modifierGroups: unknown[];
}

interface Props {
  item: MenuItem;
  onClick: () => void;
  index: number;
}

function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("burger") || lower.includes("shack") || lower.includes("hamburguesa")) return "🍔";
  if (lower.includes("chicken") || lower.includes("pollo")) return "🍗";
  if (lower.includes("shake") || lower.includes("malteada")) return "🥤";
  if (lower.includes("fries") || lower.includes("papas")) return "🍟";
  if (lower.includes("salad") || lower.includes("ensalada")) return "🥗";
  if (
    lower.includes("coke") ||
    lower.includes("sprite") ||
    lower.includes("soda") ||
    lower.includes("agua") ||
    lower.includes("bebida")
  )
    return "🥤";
  if (lower.includes("dog") || lower.includes("hot dog")) return "🌭";
  return "🍽️";
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.28, ease: "easeOut" as const },
  }),
};

export default function MenuItemCard({ item, onClick, index }: Props) {
  const emoji = getFoodEmoji(item.name);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="cursor-pointer group select-none flex flex-col items-center"
    >
      {/* Imagen */}
      <div className="relative w-full h-36 sm:h-44 flex items-center justify-center mb-3">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-7xl sm:text-8xl select-none leading-none">
            {emoji}
          </span>
        )}
      </div>

      {/* Solo el nombre */}
      <div className="w-full text-center px-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
          {item.name}
        </h3>
      </div>
    </motion.div>
  );
}
