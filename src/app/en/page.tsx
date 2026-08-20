import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Storefront } from "@/components/store/storefront";
import { currencyCookieName, resolveCurrency } from "@/lib/currency/currency";

export const metadata: Metadata = {
  title: "BC-Shop | Computers for every routine",
  description: "Computers for home, work, gaming, and professional creation.",
};

export default async function EnglishPage() {
  const currency = resolveCurrency(
    (await cookies()).get(currencyCookieName)?.value,
    "en",
  );
  return <Storefront locale="en" currency={currency} />;
}
