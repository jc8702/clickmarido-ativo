# Backend API (Antigo Server Express)

> **Nota Arquitetural:** Originalmente, o projeto utilizava um servidor Express separado. Para maximizar eficiência de custo (R$ 0) e velocidade de deploy, a stack foi otimizada.
> Todo o backend (rotas, middleware de autenticação, acesso ao DB Neon) agora está consolidado dentro da pasta `frontend/pages/api` utilizando **Next.js API Routes**.

Esta pasta pode ser usada para armazenar scripts secundários, migrations, ou ser ignorada caso prefira o monorepo Next.js.

## Endpoints Consolidados (Next.js API Routes)

Todas as requisições devem ser feitas para `/api/...`

* `POST /api/auth/login`
* `GET / POST /api/customers`
* `GET / POST /api/quotations`
* `PATCH /api/quotations/:id/approve`
* `GET / POST /api/service-orders`
* `POST /api/service-orders/:id/complete`
* `GET / PATCH /api/inventory`
* `PATCH /api/inventory/:id`
* `GET /api/payments`
* `PATCH /api/payments/:id/approve`
* `POST /api/webhooks/mercadopago`
* `POST /api/upload`
* `GET /api/dashboard`

**Stack Atual Backend:**
* Next.js API Routes (Node.js)
* PostgreSQL (driver nativo `pg`)
* Banco Hospedado via Neon

**Variáveis necessárias:**
Verifique o `.env` na pasta `frontend/`.
