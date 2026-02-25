/**
 * formatCurrency — formats a number as currency using the browser/Node
 * native Intl.NumberFormat API. No library needed.
 *
 * @param amount   — the numeric value to format
 * @param currency — ISO 4217 code: "INR", "USD", "GBP", "EUR", ...
 *
 * Examples:
 *   formatCurrency(27170, "INR") → "₹27,170.00"
 *   formatCurrency(27170, "USD") → "$27,170.00"
 *   formatCurrency(27170, "GBP") → "£27,170.00"
 */
export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * getCurrencySymbol — returns just the symbol for a currency code.
 * Useful where you want "₹" without the number.
 *
 * getCurrencySymbol("INR") → "₹"
 * getCurrencySymbol("USD") → "$"
 */
export function getCurrencySymbol(currency = "INR"): string {
  return (
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}
