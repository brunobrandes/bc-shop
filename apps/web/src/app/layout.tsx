import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BC-Shop | Computadores para cada rotina",
  description:
    "Computadores para casa, trabalho, gaming e criação profissional.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
