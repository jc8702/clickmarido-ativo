import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Bem-vindo ao CRM Serviços Residenciais</h1>
      <p>O sistema está em execução.</p>
      <ul style={{ marginTop: "1rem" }}>
        <li><Link href="/dashboard" style={{ color: "blue", textDecoration: "underline" }}>Acessar Dashboard</Link></li>
      </ul>
    </main>
  );
}
