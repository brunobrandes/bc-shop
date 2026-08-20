import type { ProductCategory } from "@/types/product";

export function ComputerVisual({ category }: { category: ProductCategory }) {
  return (
    <div
      className={`computer-visual computer-visual--${category}`}
      aria-hidden="true"
    >
      <div className="computer-visual__screen">
        <span>BC</span>
      </div>
      <div className="computer-visual__stand" />
      <div className="computer-visual__base" />
    </div>
  );
}
