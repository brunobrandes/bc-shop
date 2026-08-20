import { ContactForm } from "./contact-form";
import { Header } from "@/components/store/header";
import type { SupportedCurrency } from "@/lib/currency/currency";

export type ContactLocale = "en" | "pt";

const copy = {
  en: {
    eyebrow: "BC-SHOP SUPPORT",
    title: "Talk to a computer specialist.",
    intro:
      "Choose a convenient time and our team will call to help with products, configurations, or a quote.",
    cardEyebrow: "REQUEST A CALL",
    cardTitle: "Schedule your call",
    required: "All fields are required except the message.",
  },
  pt: {
    eyebrow: "ATENDIMENTO BC-SHOP",
    title: "Converse com um especialista.",
    intro:
      "Escolha o melhor horário e nossa equipe liga para ajudar com produtos, configurações ou orçamento.",
    cardEyebrow: "SOLICITAR CONTATO",
    cardTitle: "Agende sua ligação",
    required: "Todos os campos são obrigatórios, exceto a mensagem.",
  },
} as const;

export function ContactPageContent({
  locale,
  currency,
}: {
  locale: ContactLocale;
  currency: SupportedCurrency;
}) {
  const text = copy[locale];
  return (
    <div lang={locale === "en" ? "en" : "pt-BR"}>
      <Header locale={locale} currency={currency} />
      <main className="contact-page">
        <div className="shell contact-layout">
          <section className="contact-intro">
            <span className="eyebrow">{text.eyebrow}</span>
            <h1>{text.title}</h1>
            <p>{text.intro}</p>
          </section>
          <section className="contact-card" aria-labelledby="schedule-title">
            <div className="contact-card__heading">
              <span className="eyebrow">{text.cardEyebrow}</span>
              <h2 id="schedule-title">{text.cardTitle}</h2>
              <p>{text.required}</p>
            </div>
            <ContactForm locale={locale} currency={currency} />
          </section>
        </div>
      </main>
    </div>
  );
}
