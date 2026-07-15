import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function formatCurrency(amount: number | string, currency = "INR") {
  const num = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(num);
}
