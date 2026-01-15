// src/lib/utils.js
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function toTitleCase(str) {
    if (!str) return "";
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
