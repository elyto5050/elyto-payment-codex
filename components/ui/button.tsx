"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-white text-black shadow-[0_14px_30px_rgba(255,255,255,0.12)] hover:bg-zinc-200",
          variant === "outline" && "border border-border bg-white/[0.03] text-zinc-100 hover:bg-white/[0.06]",
          variant === "ghost" && "text-zinc-300 hover:bg-white/[0.05]",
          variant === "destructive" && "bg-rose-600 text-white hover:bg-rose-700",
          size === "sm" && "px-3 py-1.5 text-xs",
          size === "md" && "px-4 py-2 text-sm",
          size === "lg" && "px-5 py-3 text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
