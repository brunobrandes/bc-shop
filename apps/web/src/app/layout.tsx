import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BC-Shop | Computers for every routine",
  description: "Computers for home, work, gaming, and professional creation.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
