'use client';

export function ColorShowcase() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-[40px] font-bold tracking-tight">Design System - Click Marido CRM</h1>

      <section>
        <h2 className="text-2xl font-bold mb-4">🟣 Roxo (Primário)</h2>
        <div className="flex gap-4">
          <div className="w-32 h-32 bg-primary-900 rounded-lg flex items-center justify-center text-white text-xs">900</div>
          <div className="w-32 h-32 bg-primary-800 rounded-lg flex items-center justify-center text-white text-xs">800</div>
          <div className="w-32 h-32 bg-primary-700 rounded-lg flex items-center justify-center text-white text-xs">700</div>
          <div className="w-32 h-32 bg-primary-600 rounded-lg flex items-center justify-center text-white text-xs">600</div>
          <div className="w-32 h-32 bg-primary-400 rounded-lg flex items-center justify-center text-white text-xs">400</div>
          <div className="w-32 h-32 bg-primary-50 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-700 text-xs">50</div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">🟢 Verde (Sucesso)</h2>
        <div className="flex gap-4">
          <div className="w-32 h-32 bg-success-900 rounded-lg flex items-center justify-center text-white text-xs">900</div>
          <div className="w-32 h-32 bg-success-800 rounded-lg flex items-center justify-center text-white text-xs">800</div>
          <div className="w-32 h-32 bg-success-700 rounded-lg flex items-center justify-center text-white text-xs">700</div>
          <div className="w-32 h-32 bg-success-600 rounded-lg flex items-center justify-center text-white text-xs">600</div>
          <div className="w-32 h-32 bg-success-400 rounded-lg flex items-center justify-center text-white text-xs">400</div>
          <div className="w-32 h-32 bg-success-50 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-700 text-xs">50</div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">🟠 Laranja (Alerta)</h2>
        <div className="flex gap-4">
          <div className="w-32 h-32 bg-warning-900 rounded-lg flex items-center justify-center text-white text-xs">900</div>
          <div className="w-32 h-32 bg-warning-800 rounded-lg flex items-center justify-center text-white text-xs">800</div>
          <div className="w-32 h-32 bg-warning-700 rounded-lg flex items-center justify-center text-white text-xs">700</div>
          <div className="w-32 h-32 bg-warning-600 rounded-lg flex items-center justify-center text-white text-xs">600</div>
          <div className="w-32 h-32 bg-warning-400 rounded-lg flex items-center justify-center text-white text-xs">400</div>
          <div className="w-32 h-32 bg-warning-50 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-700 text-xs">50</div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">💎 Gradientes</h2>
        <div className="flex gap-4">
          <div className="w-40 h-32 bg-gradient-hero rounded-lg flex items-center justify-center text-white text-xs font-bold">Hero</div>
          <div className="w-40 h-32 bg-gradient-subtle rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-700 text-xs font-bold">Subtle</div>
          <div className="w-40 h-32 bg-gradient-accent rounded-lg flex items-center justify-center text-white text-xs font-bold">Accent</div>
          <div className="w-40 h-32 bg-gradient-dark rounded-lg flex items-center justify-center text-white text-xs font-bold">Dark</div>
          <div className="w-40 h-32 bg-gradient-warning rounded-lg flex items-center justify-center text-white text-xs font-bold">Warning</div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">🔤 Tipografia</h2>
        <div className="space-y-2">
          <p className="text-[40px] font-bold tracking-tight">H1 - Título Principal (40px)</p>
          <p className="text-[32px] font-bold tracking-tight">H2 - Título de Seção (32px)</p>
          <p className="text-[24px] font-semibold">H3 - Título de Card (24px)</p>
          <p className="text-[20px] font-semibold">H4 - Label/Título Menor (20px)</p>
          <p className="text-base">Body - Texto regular (16px)</p>
          <p className="text-sm">Small - Texto auxiliar (14px)</p>
          <p className="text-xs">XS - Texto mínimo (12px)</p>
        </div>
      </section>
    </div>
  );
}
