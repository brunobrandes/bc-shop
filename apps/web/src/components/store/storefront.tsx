import { Header } from "./header";
import { ProductCard } from "./product-card";
import { SalesAssistantTrigger } from "./sales-assistant-trigger";
import { listProducts } from "@/lib/products/catalog";
import type { Locale } from "@/lib/i18n/locale";
import type { SupportedCurrency } from "@/lib/currency/currency";

const copy = {
  pt: {
    heroEyebrow: "TECNOLOGIA QUE FAZ SENTIDO",
    title: "O computador certo para o que você precisa.",
    intro:
      "Compare configurações para casa, trabalho ou jogos. Se preferir, conte com ajuda para escolher sem complicação.",
    view: "Ver computadores",
    chips: [
      ["Pronto para trabalhar", "Desempenho sem excesso"],
      ["Escolha inteligente", "Para a sua rotina"],
    ],
    benefits: [
      ["Configurações claras", "Você entende o que está levando"],
      ["Para cada perfil", "Da rotina leve ao uso profissional"],
      ["Ajuda especializada", "Orientação para decidir com confiança"],
    ],
    selection: "NOSSA SELEÇÃO",
    catalogTitle: "Encontre seu próximo computador",
    catalogIntro:
      "Modelos equilibrados para diferentes rotinas, com especificações diretas e sem surpresas.",
    profile: "COMPRE POR PERFIL",
    profileTitle: "Feito para o seu ritmo",
    categories: [
      ["Casa", "Estudos e tarefas do dia a dia"],
      ["Trabalho", "Produtividade com confiança"],
      ["Gaming", "Performance para entrar no jogo"],
      ["Workstation", "Potência para criar sem limites"],
    ],
    doubt: "AINDA EM DÚVIDA?",
    specialistTitle: "Vamos encontrar a configuração ideal juntos.",
    specialistText:
      "Diga como você pretende usar seu computador e receba uma orientação mais direta.",
    tagline: "Computadores para cada jeito de fazer.",
    products: "Produtos",
    computers: "Computadores",
    categoriesLabel: "Categorias",
    support: "Atendimento",
    hours: "Seg–Sex, 9h às 18h",
    rights: "Todos os direitos reservados.",
    benefitsLabel: "Diferenciais",
  },
  en: {
    heroEyebrow: "TECHNOLOGY THAT MAKES SENSE",
    title: "The right computer for what you need.",
    intro:
      "Compare computers for home, work, or gaming. If you prefer, our team can help you choose with confidence.",
    view: "View computers",
    chips: [
      ["Ready for work", "Performance without excess"],
      ["A smarter choice", "Built for your routine"],
    ],
    benefits: [
      ["Clear configurations", "Understand exactly what you are buying"],
      ["For every profile", "From everyday use to professional work"],
      ["Specialist support", "Guidance to choose with confidence"],
    ],
    selection: "OUR SELECTION",
    catalogTitle: "Find your next computer",
    catalogIntro:
      "Balanced computers for different routines, with straightforward specifications and no surprises.",
    profile: "SHOP BY PROFILE",
    profileTitle: "Made for your pace",
    categories: [
      ["Home", "Study and everyday tasks"],
      ["Work", "Reliable productivity"],
      ["Gaming", "Performance to get in the game"],
      ["Workstation", "Power for demanding creative work"],
    ],
    doubt: "STILL NOT SURE?",
    specialistTitle: "Let’s find the right configuration together.",
    specialistText:
      "Tell us how you plan to use your computer and receive direct guidance.",
    tagline: "Computers for every way of working.",
    products: "Products",
    computers: "Computers",
    categoriesLabel: "Categories",
    support: "Support",
    hours: "Mon–Fri, 9am–6pm",
    rights: "All rights reserved.",
    benefitsLabel: "Benefits",
  },
} as const;

export function Storefront({
  locale,
  currency,
}: {
  locale: Locale;
  currency: SupportedCurrency;
}) {
  const text = copy[locale];
  const products = listProducts();
  return (
    <div lang={locale === "en" ? "en" : "pt-BR"}>
      <Header locale={locale} currency={currency} />
      <main>
        <section className="hero">
          <div className="shell hero__grid">
            <div className="hero__content">
              <span className="eyebrow">{text.heroEyebrow}</span>
              <h1>{text.title}</h1>
              <p>{text.intro}</p>
              <div className="hero__actions">
                <a className="button button--accent" href="#computadores">
                  {text.view}
                </a>
                <SalesAssistantTrigger variant="light" locale={locale} />
              </div>
            </div>
            <div className="hero__visual" aria-hidden="true">
              <div className="hero__glow" />
              <div className="hero-laptop">
                <div className="hero-laptop__screen">
                  <div className="screen-mark">
                    BC<span>SHOP</span>
                  </div>
                  <div className="screen-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="hero-laptop__deck" />
              </div>
              <div className="hero-chip hero-chip--top">
                <b>{text.chips[0][0]}</b>
                <span>{text.chips[0][1]}</span>
              </div>
              <div className="hero-chip hero-chip--bottom">
                <b>{text.chips[1][0]}</b>
                <span>{text.chips[1][1]}</span>
              </div>
            </div>
          </div>
        </section>
        <section className="benefits" aria-label={text.benefitsLabel}>
          <div className="shell benefits__grid">
            {text.benefits.map(([title, detail]) => (
              <div key={title}>
                <b>{title}</b>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="catalog shell" id="computadores">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{text.selection}</span>
              <h2>{text.catalogTitle}</h2>
            </div>
            <p>{text.catalogIntro}</p>
          </div>
          <div className="catalog__grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                currency={currency}
              />
            ))}
          </div>
        </section>
        <section className="categories" id="categorias">
          <div className="shell">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{text.profile}</span>
                <h2>{text.profileTitle}</h2>
              </div>
            </div>
            <div className="categories__grid">
              {text.categories.map(([title, detail], index) => (
                <a href="#computadores" key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <b>{title}</b>
                  <small>{detail}</small>
                </a>
              ))}
            </div>
          </div>
        </section>
        <section className="specialist shell" id="atendimento">
          <div>
            <span className="eyebrow">{text.doubt}</span>
            <h2>{text.specialistTitle}</h2>
            <p>{text.specialistText}</p>
          </div>
          <SalesAssistantTrigger variant="light" locale={locale} />
        </section>
      </main>
      <footer>
        <div className="shell footer__inner">
          <div>
            <div className="brand brand--footer">
              <span>BC</span> Shop
            </div>
            <p>{text.tagline}</p>
          </div>
          <div>
            <b>{text.products}</b>
            <a href="#computadores">{text.computers}</a>
            <a href="#categorias">{text.categoriesLabel}</a>
          </div>
          <div>
            <b>{text.support}</b>
            <a href={`/${locale}/contact`}>
              {locale === "en"
                ? "Talk to a specialist"
                : "Falar com especialista"}
            </a>
            <span>{text.hours}</span>
          </div>
        </div>
        <div className="shell footer__bottom">
          © {new Date().getFullYear()} BC-Shop. {text.rights}
        </div>
      </footer>
    </div>
  );
}
