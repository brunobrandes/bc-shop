import { products } from "@/data/products";
import type { Product } from "@/types/product";
import type { ProductCategory } from "@/types/product";

export type ProductSearchFilters = {
  query?: string;
  category?: ProductCategory;
  maxPrice?: number;
};

function searchableText(product: Product): string {
  return [
    product.name,
    product.shortDescription,
    product.category,
    product.specs.cpu,
    product.specs.memory,
    product.specs.storage,
    product.specs.gpu,
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function listProducts(): readonly Product[] {
  return products;
}

export function findProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function searchProducts(
  filters: ProductSearchFilters = {},
): readonly Product[] {
  const query = filters.query
    ?.normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  return products.filter(
    (product) =>
      (!query || searchableText(product).includes(query)) &&
      (!filters.category || product.category === filters.category) &&
      (filters.maxPrice === undefined ||
        product.price.amount <= filters.maxPrice),
  );
}
