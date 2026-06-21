'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/Card';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';
import { Navigation } from '@/components/Navigation';
import { FormBuilder } from '@/components/FormBuilder';

export default function TestPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error' | 'warning' | 'info'; title: string }[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title: `Toast ${type}` }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navigation
        logo={<span className="text-lg font-bold text-white">Test Components</span>}
        links={[
          { href: '#colors', label: 'Cores' },
          { href: '#buttons', label: 'Botões' },
          { href: '#cards', label: 'Cards' },
        ]}
      />

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 w-80">
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} title={t.title} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">

        {/* Colors */}
        <section id="colors">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Cores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['primary', 'success', 'warning'].map((palette) =>
              [50, 100, 200, 400, 500, 600, 700, 800, 900].map((shade) => (
                <div
                  key={`${palette}-${shade}`}
                  className={`h-16 rounded-lg flex items-center justify-center text-xs font-mono`}
                  style={{ backgroundColor: `var(--tw-${palette}-${shade})` }}
                >
                  {/* Color chips use Tailwind classes */}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Buttons */}
        <section id="buttons">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Botões</h2>
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
                <div className="flex flex-wrap gap-3 items-end">
                  <Button size="xs">XS</Button>
                  <Button size="sm">SM</Button>
                  <Button size="md">MD</Button>
                  <Button size="lg">LG</Button>
                  <Button size="xl">XL</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button isLoading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button fullWidth>Full Width</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section id="cards">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Padrão</CardTitle>
                <CardDescription>Com subtle gradient</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700">Conteúdo do card com sombra md e gradient subtle.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Ok</Button>
                <Button size="sm" variant="outline">Cancelar</Button>
              </CardFooter>
            </Card>

            <Card gradient="none" shadow="lg" interactive>
              <CardHeader>
                <CardTitle>Card Interativo</CardTitle>
                <CardDescription>Hover scale + shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700">Passe o mouse para ver a animação.</p>
              </CardContent>
            </Card>

            <Card gradient="subtle" shadow="sm">
              <CardHeader>
                <CardTitle>Card Sutil</CardTitle>
                <CardDescription>Sombra pequena</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700">Card com gradiente subtle e sombra sm.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Inputs */}
        <section id="inputs">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Inputs</h2>
          <Card>
            <CardContent className="space-y-4">
              <Input label="Texto Normal" placeholder="Digite algo..." />
              <Input label="Com Erro" placeholder="Email inválido" error="Email inválido" type="email" />
              <Input label="Com Ajuda" placeholder="Seu telefone" helperText="Formato: (11) 99999-9999" />
              <Input label="Desabilitado" placeholder="Campo bloqueado" disabled />
              <Input label="Obrigatório" placeholder="Campo obrigatório" required />
            </CardContent>
          </Card>
        </section>

        {/* Badges */}
        <section id="badges">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Badges</h2>
          <Card>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="neutral">Neutral</Badge>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Badge variant="primary" size="sm">Pequeno</Badge>
                <Badge variant="primary" size="md">Médio</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Modal + Toast */}
        <section id="interactions">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Modal & Toast</h2>
          <Card>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button onClick={() => setModalOpen(true)}>Abrir Modal</Button>
                <Button variant="secondary" onClick={() => addToast('success')}>Toast Success</Button>
                <Button variant="secondary" onClick={() => addToast('error')}>Toast Error</Button>
                <Button variant="secondary" onClick={() => addToast('warning')}>Toast Warning</Button>
                <Button variant="secondary" onClick={() => addToast('info')}>Toast Info</Button>
              </div>
            </CardContent>
          </Card>

          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Modal de Teste" size="md">
            <p className="text-neutral-700 mb-4">Este é um modal com animação scale-in.</p>
            <div className="flex gap-3">
              <Button onClick={() => setModalOpen(false)}>Confirmar</Button>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            </div>
          </Modal>
        </section>

        {/* Table */}
        <section id="table">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Tabela</h2>
          <Card shadow="lg">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Nome</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Ações</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {[
                  { name: 'João Silva', email: 'joao@email.com', status: 'Ativo' },
                  { name: 'Maria Santos', email: 'maria@email.com', status: 'Inativo' },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'Ativo' ? 'success' : 'neutral'} size="sm">{row.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="xs" variant="outline">Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        </section>

        {/* FormBuilder */}
        <section id="form">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">FormBuilder</h2>
          <div className="max-w-lg">
            <FormBuilder
              title="Formulário de Teste"
              description="Demonstração do FormBuilder com validação"
              fields={[
                { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome' },
                { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'email@exemplo.com' },
                { name: 'phone', label: 'Telefone', type: 'phone', placeholder: '(11) 99999-9999' },
                { name: 'type', label: 'Tipo', type: 'select', options: [{ label: 'Residencial', value: 'res' }, { label: 'Comercial', value: 'com' }] },
                { name: 'notes', label: 'Observações', type: 'textarea', placeholder: 'Observações...' },
              ]}
              onSubmit={async (data) => {
                console.log('Form submitted:', data);
              }}
              submitText="Salvar"
            />
          </div>
        </section>

        {/* Animações */}
        <section id="animations">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Animações</h2>
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 animate-fade-in text-center text-neutral-900 dark:text-neutral-100">fade-in</div>
                <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 animate-slide-down text-center text-neutral-900 dark:text-neutral-100">slide-down</div>
                <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 animate-slide-up text-center text-neutral-900 dark:text-neutral-100">slide-up</div>
                <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 animate-scale-in text-center text-neutral-900 dark:text-neutral-100">scale-in</div>
                <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 animate-bounce-subtle text-center text-neutral-900 dark:text-neutral-100">bounce-subtle</div>
                <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 animate-pulse-subtle text-center text-neutral-900 dark:text-neutral-100">pulse</div>
                <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 animate-float text-center text-neutral-900 dark:text-neutral-100">float</div>
                <div className="p-6 bg-gradient-hero text-white rounded-lg shadow-md animate-shimmer text-center bg-gradient-animated">
                  gradient anim
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </main>
    </div>
  );
}
