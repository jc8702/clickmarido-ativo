import type { Metadata } from "next";

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
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
