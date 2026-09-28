const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (value > 0 && value < 0.01) return "< $0.01";
  return usdFmt.format(value);
}

/** Human-friendly token amount: no exponent notation, sensible precision. */
export function formatAmount(value: number, maxSig = 6): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: maxSig,
    maximumFractionDigits: 18,
  }).format(value);
}

/** Plain string (no grouping) suitable for writing back into an input field. */
export function toInputString(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const abs = Math.abs(value);
  const opts: Intl.NumberFormatOptions =
    abs >= 1
      ? { maximumFractionDigits: 6, useGrouping: false }
      : { maximumSignificantDigits: 6, maximumFractionDigits: 18, useGrouping: false };
  return new Intl.NumberFormat("en-US", opts).format(value);
}

/** Keeps only digits and a single decimal point. Accepts "," as decimal separator. */
export function sanitizeAmount(raw: string): string {
  let s = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }
  if (s.startsWith(".")) s = "0" + s;
  // Strip redundant leading zeros ("007" -> "7") but keep "0." prefixes.
  s = s.replace(/^0+(?=\d)/, "");
  return s;
}
