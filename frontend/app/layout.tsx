import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../lib/animations.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Click Marido CRM",
  description: "Sistema de Gestão para Serviços Residenciais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
