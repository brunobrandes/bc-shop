export const productCategories = [
  "home",
  "work",
  "gaming",
  "workstation",
] as const;

export type ProductCategory = (typeof productCategories)[number];

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: ProductCategory;
  price: Money;
  specs: {
    cpu: string;
    memory: string;
    storage: string;
    gpu?: string;
  };
  featured?: boolean;
};
import type { Money } from "@/lib/currency/currency";
