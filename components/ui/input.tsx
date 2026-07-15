import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition-all",
        "hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function FormField({ label, error, children, required }: { label?: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-zinc-300">{label} {required && <span className="text-rose-500">*</span>}</label>}
      {children}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
