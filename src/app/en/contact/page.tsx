import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ContactPageContent } from "@/components/contact/contact-page";
import { currencyCookieName, resolveCurrency } from "@/lib/currency/currency";

export const metadata: Metadata = {
  title: "Schedule a call | BC-Shop",
  description: "Choose a time to speak with a BC-Shop computer specialist.",
};

export default async function EnglishContactPage() {
  const currency = resolveCurrency(
    (await cookies()).get(currencyCookieName)?.value,
    "en",
  );
  return <ContactPageContent locale="en" currency={currency} />;
}
