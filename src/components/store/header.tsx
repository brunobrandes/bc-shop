import Link from "next/link";
import { LocaleSwitcher } from "./locale-switcher";
import { CurrencySelector } from "./currency-selector";
import { SalesAssistantTrigger } from "./sales-assistant-trigger";
import type { Locale } from "@/lib/i18n/locale";
import type { SupportedCurrency } from "@/lib/currency/currency";

export function Header({
  locale = "pt",
  currency,
}: {
  locale?: Locale;
  currency: SupportedCurrency;
}) {
  const home = `/${locale}`;
  const contact = `/${locale}/contact`;
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link
          href={home}
          className="brand"
          aria-label={
            locale === "en" ? "BC-Shop, home" : "BC-Shop, página inicial"
          }
        >
          <span>BC</span> Shop
        </Link>
        <nav
          aria-label={
            locale === "en" ? "Main navigation" : "Navegação principal"
          }
        >
          <Link href={`${home}#computadores`}>
            {locale === "en" ? "Computers" : "Computadores"}
          </Link>
          <Link href={`${home}#categorias`}>
            {locale === "en" ? "Categories" : "Categorias"}
          </Link>
          <Link href={contact}>
            {locale === "en" ? "Contact" : "Atendimento"}
          </Link>
        </nav>
        <div className="site-header__actions">
          <LocaleSwitcher locale={locale} />
          <CurrencySelector currency={currency} />
          <button
            className="cart-button"
            type="button"
            aria-label={locale === "en" ? "Cart, empty" : "Carrinho, vazio"}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M3 4h2l2 11h10l2-7H6" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="17" cy="19" r="1" />
            </svg>
            <span>0</span>
          </button>
          <SalesAssistantTrigger locale={locale} />
        </div>
      </div>
    </header>
  );
}
