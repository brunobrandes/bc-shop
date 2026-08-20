export const supportedLocales = ["pt", "en"] as const;
export type Locale = (typeof supportedLocales)[number];
export const localeCookieName = "bc_locale";

export function isLocale(value: unknown): value is Locale {
  return value === "pt" || value === "en";
}

export function resolveLocale(
  saved?: string,
  acceptedLanguage?: string,
): Locale {
  if (isLocale(saved)) return saved;
  const first = acceptedLanguage?.split(",", 1)[0]?.trim().toLowerCase();
  if (first === "pt" || first?.startsWith("pt-")) return "pt";
  if (first) return "en";
  return "pt";
}

export function switchLocalePath(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) segments[1] = locale;
  else segments.splice(1, 0, locale);
  return segments.join("/") || `/${locale}`;
}
