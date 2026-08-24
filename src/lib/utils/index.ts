import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | { toNumber(): number }): string {
  const num = typeof amount === "object" ? amount.toNumber() : Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateInput(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0];
}

export function getMonthName(monthIndex: number): string {
  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
    new Date(2024, monthIndex, 1)
  );
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfPrevMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

export function endOfPrevMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999);
}
