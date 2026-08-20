import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ContactPageContent } from "@/components/contact/contact-page";
import { currencyCookieName, resolveCurrency } from "@/lib/currency/currency";

export const metadata: Metadata = {
  title: "Request a call | BC-Shop",
  description:
    "Speak with a BC-Shop computer specialist now or schedule a call.",
};

export default async function ContactPage() {
  const currency = resolveCurrency(
    (await cookies()).get(currencyCookieName)?.value,
  );
  return <ContactPageContent currency={currency} />;
}
