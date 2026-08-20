import Link from "next/link";
import type { Locale } from "@/lib/i18n/locale";

export function SalesAssistantTrigger({
  variant = "dark",
  locale = "pt",
}: {
  variant?: "dark" | "light";
  locale?: Locale;
}) {
  return (
    <Link className={`button button--${variant}`} href={`/${locale}/contact`}>
      {locale === "en" ? "Talk to a specialist" : "Falar com especialista"}
    </Link>
  );
}
