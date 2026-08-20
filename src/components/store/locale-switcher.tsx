"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  localeCookieName,
  switchLocalePath,
  type Locale,
} from "@/lib/i18n/locale";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  function remember(nextLocale: Locale) {
    document.cookie = `${localeCookieName}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  return (
    <div
      className="locale-switcher"
      aria-label={locale === "pt" ? "Idioma" : "Language"}
    >
      <Link
        href={switchLocalePath(pathname, "pt")}
        aria-current={locale === "pt" ? "page" : undefined}
        onClick={() => remember("pt")}
      >
        PT
      </Link>
      <span aria-hidden="true">|</span>
      <Link
        href={switchLocalePath(pathname, "en")}
        aria-current={locale === "en" ? "page" : undefined}
        onClick={() => remember("en")}
      >
        EN
      </Link>
    </div>
  );
}
