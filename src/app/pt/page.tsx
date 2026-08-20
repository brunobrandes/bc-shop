import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Storefront } from "@/components/store/storefront";
import { currencyCookieName, resolveCurrency } from "@/lib/currency/currency";

export const metadata: Metadata = {
  title: "BC-Shop | Computadores para cada rotina",
  description:
    "Computadores para casa, trabalho, gaming e criação profissional.",
};

export default async function PortuguesePage() {
  const currency = resolveCurrency(
    (await cookies()).get(currencyCookieName)?.value,
    "pt",
  );
  return <Storefront locale="pt" currency={currency} />;
}
