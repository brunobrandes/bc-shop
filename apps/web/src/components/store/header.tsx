import Link from "next/link";
import { CurrencySelector } from "./currency-selector";
import { SalesAssistantTrigger } from "./sales-assistant-trigger";
import type { SupportedCurrency } from "@/lib/currency/currency";

export function Header({ currency }: { currency: SupportedCurrency }) {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="brand" aria-label="BC-Shop, home">
          <span>BC</span> Shop
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/#computers">Computers</Link>
          <Link href="/#categories">Categories</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="site-header__actions">
          <CurrencySelector currency={currency} />
          <button
            className="cart-button"
            type="button"
            aria-label="Cart, empty"
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
          <SalesAssistantTrigger />
        </div>
      </div>
    </header>
  );
}
