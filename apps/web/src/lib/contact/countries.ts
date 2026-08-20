export const supportedCountries = [
  { code: "US", name: "United States", dialCode: "+1" },
] as const;

export type SupportedCountry = (typeof supportedCountries)[number]["code"];

export function isSupportedCountry(value: unknown): value is SupportedCountry {
  return value === "US";
}

export function normalizePhone(
  value: string,
  country: SupportedCountry,
): string | undefined {
  if (country !== "US" || !value.trim() || value.length > 40) return undefined;

  const explicitlyInternational = /^\s*(?:\+|00)/.test(value);
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (
    digits.startsWith("1") &&
    (explicitlyInternational || digits.length === 11)
  )
    digits = digits.slice(1);

  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return undefined;
  return `+1${digits}`;
}
