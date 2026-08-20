import type { Product } from "@/types/product";

export const products = [
  {
    id: "bc-home-14",
    slug: "bc-home-14",
    name: "BC Home 14",
    shortDescription:
      "Leve e prático para estudos, navegação e rotina da família.",
    category: "home",
    price: { amount: 2899, currency: "BRL" },
    specs: { cpu: "Intel Core i3", memory: "8 GB", storage: "SSD 256 GB" },
  },
  {
    id: "bc-home-plus-15",
    slug: "bc-home-plus-15",
    name: "BC Home Plus 15",
    shortDescription:
      "Mais tela e agilidade para trabalho leve e entretenimento.",
    category: "home",
    price: { amount: 3699, currency: "BRL" },
    specs: { cpu: "AMD Ryzen 5", memory: "16 GB", storage: "SSD 512 GB" },
  },
  {
    id: "bc-office-pro",
    slug: "bc-office-pro",
    name: "BC Office Pro",
    shortDescription:
      "Desempenho confiável para produtividade e videoconferências.",
    category: "work",
    price: { amount: 4799, currency: "BRL" },
    specs: { cpu: "Intel Core i5", memory: "16 GB", storage: "SSD 512 GB" },
    featured: true,
  },
  {
    id: "bc-business-mini",
    slug: "bc-business-mini",
    name: "BC Business Mini",
    shortDescription:
      "Desktop compacto, silencioso e pronto para o escritório.",
    category: "work",
    price: { amount: 4299, currency: "BRL" },
    specs: { cpu: "AMD Ryzen 5 Pro", memory: "16 GB", storage: "SSD 512 GB" },
  },
  {
    id: "bc-gamer-x",
    slug: "bc-gamer-x",
    name: "BC Gamer X",
    shortDescription:
      "Frames consistentes para jogar em Full HD com qualidade.",
    category: "gaming",
    price: { amount: 7499, currency: "BRL" },
    specs: {
      cpu: "AMD Ryzen 7",
      memory: "32 GB",
      storage: "SSD 1 TB",
      gpu: "GeForce RTX 4060 8 GB",
    },
  },
  {
    id: "bc-creator-pro",
    slug: "bc-creator-pro",
    name: "BC Creator Pro",
    shortDescription:
      "Potência para projetos 3D, vídeo e fluxos profissionais intensos.",
    category: "workstation",
    price: { amount: 12999, currency: "BRL" },
    specs: {
      cpu: "Intel Core i9",
      memory: "64 GB",
      storage: "SSD 2 TB",
      gpu: "GeForce RTX 4070 12 GB",
    },
  },
] as const satisfies readonly Product[];
