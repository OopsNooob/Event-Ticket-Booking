import { api } from "@/convex/_generated/api";
import { clsx, type ClassValue } from "clsx"
import {Id} from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useStorageUrl(storageId: Id<"_storage"> | undefined) {
 return useQuery(api.storage.getUrl, storageId ? {storageId} : "skip");
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format price to USD currency
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

/**
 * Calculate available tickets
 */
export function calculateTicketAvailability(total: number, sold: number): number {
  return Math.max(0, total - sold)
}