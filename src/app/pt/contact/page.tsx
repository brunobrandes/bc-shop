import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ContactPageContent } from "@/components/contact/contact-page";
import { currencyCookieName, resolveCurrency } from "@/lib/currency/currency";

export const metadata: Metadata = {
  title: "Agende uma ligação | BC-Shop",
  description: "Escolha um horário para falar com um especialista da BC-Shop.",
};

export default async function PortugueseContactPage() {
  const currency = resolveCurrency(
    (await cookies()).get(currencyCookieName)?.value,
    "pt",
  );
  return <ContactPageContent locale="pt" currency={currency} />;
}
