import { ComputerVisual } from "./computer-visual";
import type { Product } from "@/types/product";
import type { Locale } from "@/lib/i18n/locale";
import { formatMoney, type SupportedCurrency } from "@/lib/currency/currency";

const labels = {
  pt: {
    home: "Casa",
    work: "Trabalho",
    gaming: "Gaming",
    workstation: "Workstation",
  },
  en: {
    home: "Home",
    work: "Work",
    gaming: "Gaming",
    workstation: "Workstation",
  },
} as const;
const englishDescriptions: Record<string, string> = {
  "bc-home-14":
    "Light and practical for studying, browsing, and everyday family use.",
  "bc-home-plus-15":
    "More screen space and speed for light work and entertainment.",
  "bc-office-pro": "Reliable performance for productivity and video calls.",
  "bc-business-mini": "A compact, quiet desktop ready for the office.",
  "bc-gamer-x": "Consistent Full HD gaming performance with quality settings.",
  "bc-creator-pro":
    "Power for 3D, video, and demanding professional workflows.",
};

export function ProductCard({
  product,
  locale,
  currency,
}: {
  product: Product;
  locale: Locale;
  currency: SupportedCurrency;
}) {
  const description =
    locale === "en"
      ? englishDescriptions[product.id]
      : product.shortDescription;
  return (
    <article className="product-card">
      <div className="product-card__visual">
        {product.featured && (
          <span className="product-card__badge">
            {locale === "en" ? "Most versatile" : "Mais versátil"}
          </span>
        )}
        <ComputerVisual category={product.category} />
      </div>
      <div className="product-card__body">
        <span className="product-card__category">
          {labels[locale][product.category]}
        </span>
        <h3>{product.name}</h3>
        <p>{description}</p>
        <ul aria-label={locale === "en" ? "Specifications" : "Especificações"}>
          <li>{product.specs.cpu}</li>
          <li>{product.specs.memory} RAM</li>
          <li>{product.specs.storage}</li>
          {product.specs.gpu && <li>{product.specs.gpu}</li>}
        </ul>
        <div className="product-card__footer">
          <div>
            <small>{locale === "en" ? "Starting at" : "A partir de"}</small>
            <strong>{formatMoney(product.price, currency, locale)}</strong>
          </div>
          <button
            type="button"
            aria-label={`${locale === "en" ? "View details for" : "Ver detalhes de"} ${product.name}`}
          >
            {locale === "en" ? "View details" : "Ver detalhes"} <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
