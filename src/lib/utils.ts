import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: tr });
}

export function generatePaymentPackageName(amount: number) {
  return `${amount} TL Kredi Paketi`;
}
