import { ComputerVisual } from "./computer-visual";
import type { Product } from "@/types/product";
import { formatMoney, type SupportedCurrency } from "@/lib/currency/currency";

const labels = {
  home: "Home",
  work: "Work",
  gaming: "Gaming",
  workstation: "Workstation",
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
  currency,
}: {
  product: Product;
  currency: SupportedCurrency;
}) {
  const description = englishDescriptions[product.id];
  return (
    <article className="product-card">
      <div className="product-card__visual">
        {product.featured && (
          <span className="product-card__badge">Most versatile</span>
        )}
        <ComputerVisual category={product.category} />
      </div>
      <div className="product-card__body">
        <span className="product-card__category">
          {labels[product.category]}
        </span>
        <h3>{product.name}</h3>
        <p>{description}</p>
        <ul aria-label="Specifications">
          <li>{product.specs.cpu}</li>
          <li>{product.specs.memory} RAM</li>
          <li>{product.specs.storage}</li>
          {product.specs.gpu && <li>{product.specs.gpu}</li>}
        </ul>
        <div className="product-card__footer">
          <div>
            <small>Starting at</small>
            <strong>{formatMoney(product.price, currency)}</strong>
          </div>
          <button type="button" aria-label={`View details for ${product.name}`}>
            View details <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
