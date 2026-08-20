import { cookies } from "next/headers";
import { Storefront } from "@/components/store/storefront";
import { currencyCookieName, resolveCurrency } from "@/lib/currency/currency";

export default async function Home() {
  const currency = resolveCurrency(
    (await cookies()).get(currencyCookieName)?.value,
  );
  return <Storefront currency={currency} />;
}
