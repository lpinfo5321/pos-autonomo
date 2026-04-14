"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 select-none";

    const variants = {
      primary: "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500 shadow-lg shadow-green-500/25",
      secondary: "bg-gray-800 hover:bg-gray-700 text-white focus:ring-gray-500",
      danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300",
      outline: "border-2 border-green-500 text-green-600 hover:bg-green-50 focus:ring-green-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2.5 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
      xl: "px-8 py-4 text-lg gap-3",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        className={cn(base, variants[variant], sizes[size], disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer", className)}
        disabled={disabled || loading}
        {...(props as React.HTMLAttributes<HTMLButtonElement>)}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
