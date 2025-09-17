import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number) {
  if (Number.isNaN(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function parseTimeMarker(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [, minutes, seconds] = match;
  const total = parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
  if (Number.isNaN(total)) return null;
  return total;
}

export function uuid(prefix = "id") {
  return `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}
