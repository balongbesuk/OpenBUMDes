import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function slugify(text: string): string {
  if (!text) return ""
  
  const lower = text.toLowerCase()
  let result = ""
  
  // Keep only alphanumeric characters, spaces, underscores, and hyphens
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i]
    if (
      (char >= "a" && char <= "z") ||
      (char >= "0" && char <= "9") ||
      char === " " ||
      char === "_" ||
      char === "-"
    ) {
      result += char
    }
  }
  
  // Collapse multiple spaces/underscores/hyphens into a single hyphen
  let slug = ""
  let inSeparator = false
  
  for (let i = 0; i < result.length; i++) {
    const char = result[i]
    if (char === " " || char === "_" || char === "-") {
      if (!inSeparator) {
        slug += "-"
        inSeparator = true
      }
    } else {
      slug += char
      inSeparator = false
    }
  }
  
  // Trim leading/trailing hyphens
  if (slug.startsWith("-")) {
    slug = slug.substring(1)
  }
  if (slug.endsWith("-")) {
    slug = slug.slice(0, -1)
  }
  return slug
}

export function angkaKeKata(n: number): string {
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"]
  const num = Math.floor(Math.abs(n))
  if (num < 12) return satuan[num]
  if (num < 20) return angkaKeKata(num - 10) + " Belas"
  if (num < 100) return angkaKeKata(Math.floor(num / 10)) + " Puluh " + satuan[num % 10]
  if (num < 200) return "Seratus " + angkaKeKata(num - 100)
  if (num < 1000) return angkaKeKata(Math.floor(num / 100)) + " Ratus " + angkaKeKata(num % 100)
  if (num < 2000) return "Seribu " + angkaKeKata(num - 1000)
  if (num < 1000000) return angkaKeKata(Math.floor(num / 1000)) + " Ribu " + angkaKeKata(num % 1000)
  if (num < 1000000000) return angkaKeKata(Math.floor(num / 1000000)) + " Juta " + angkaKeKata(num % 1000000)
  if (num < 1000000000000) return angkaKeKata(Math.floor(num / 1000000000)) + " Miliar " + angkaKeKata(num % 1000000000)
  return angkaKeKata(Math.floor(num / 1000000000000)) + " Triliun " + angkaKeKata(num % 1000000000000)
}

export function terbilang(amount: number): string {
  if (amount === 0) return "Nol Rupiah"
  const hasil = angkaKeKata(amount).replace(/\s+/g, " ").trim()
  return `${hasil} Rupiah`
}

