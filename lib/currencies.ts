// ─── Supported currencies ───────────────────────────────────────────────────
// Add more entries here to expand supported currencies.
// `code` must be a valid ISO 4217 currency code (used by Intl.NumberFormat).

export interface Currency {
  code: string;
  symbol: string;
  flag: string;
  label: string;
}

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", flag: "🇮🇳", label: "Indian Rupee" },
  { code: "USD", symbol: "$", flag: "🇺🇸", label: "US Dollar" },
  { code: "GBP", symbol: "£", flag: "🇬🇧", label: "British Pound" },
  { code: "EUR", symbol: "€", flag: "🇪🇺", label: "Euro" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", flag: "🇨🇦", label: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", flag: "🇸🇬", label: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", flag: "🇦🇪", label: "UAE Dirham" },
];

// Quick lookup by code — e.g. getCurrency("USD") → { code: "USD", ... }
export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
