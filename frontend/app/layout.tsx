import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM Serviços Residenciais",
  description: "Sistema de gerenciamento para serviços residenciais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
