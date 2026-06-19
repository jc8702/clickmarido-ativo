-- ============================================
-- SCHEMA NEON POSTGRESQL - CRM SERVIÇOS
-- 15 Tabelas com RLS, Otimizações de Índices e JSONB
-- ============================================

-- 1. tenants (empresas clientes do SaaS)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. users (usuários do sistema: admin, gerente, tecnico, cliente)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'gerente', 'tecnico', 'cliente')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- 3. customers (clientes finais)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  cpf_cnpj VARCHAR(18),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_customers_tenant_status ON customers(tenant_id, is_active);

-- 4. customer_addresses (com geocoding base)
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  street VARCHAR(255) NOT NULL,
  number VARCHAR(20) NOT NULL,
  neighborhood VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) DEFAULT 'SC',
  postal_code VARCHAR(10) NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_customer_addresses_customer_created ON customer_addresses(customer_id, created_at);

-- 5. service_categories (categorias de serviços)
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. services (catálogo de serviços)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. quotations (orçamentos)
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  number VARCHAR(50) UNIQUE,
  items JSONB NOT NULL DEFAULT '[]', -- Armazena os serviços cotados com flexibilidade
  total DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_quotations_tenant_status ON quotations(tenant_id, status);
CREATE INDEX idx_quotations_customer_created ON quotations(customer_id, created_at);

-- 8. service_orders (ordens de serviço)
CREATE TABLE service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'agendada',
  items_used JSONB DEFAULT '[]', -- Armazena materiais ou itens extras usados na OS
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_service_orders_tenant_status ON service_orders(tenant_id, status);
CREATE INDEX idx_service_orders_customer_created ON service_orders(customer_id, created_at);

-- 9. inventory_items (estoque)
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity_on_hand INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. inventory_movements (movimentações / auditoria de estoque)
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- Ex: 'in', 'out'
  quantity INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. payments (MercadoPago webhooks)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_payments_tenant_status ON payments(tenant_id, status);

-- 12. warranties (garantias com duração em meses)
CREATE TABLE warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  months_duration INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ativa',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_warranties_tenant_status ON warranties(tenant_id, status);
CREATE INDEX idx_warranties_customer_created ON warranties(customer_id, created_at);

-- 13. after_sales (NPS, feedback e follow-up)
CREATE TABLE after_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  nps_score INT DEFAULT 0,
  feedback JSONB DEFAULT '{}', -- Flexível para múltiplos campos do formulário
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_after_sales_tenant_status ON after_sales(tenant_id, status);
CREATE INDEX idx_after_sales_customer_created ON after_sales(customer_id, created_at);

-- 14. scheduled_jobs (jobs em background para Bull/Redis)
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_scheduled_jobs_tenant_status ON scheduled_jobs(tenant_id, status);

-- 15. audit_logs (quem fez o quê)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_tenant_action ON audit_logs(tenant_id, action);


-- ============================================
-- RLS POLICIES (ISOLAMENTO MULTI-TENANT)
-- O Postgres permite definir o contexto da query através do set_config() ex: 
-- set_config('app.current_tenant_id', 'UUID_AQUI', false);
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenants_isolation_policy ON tenants
  USING (id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_isolation_policy ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_isolation_policy ON customers
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY customer_addresses_isolation_policy ON customer_addresses
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_categories_isolation_policy ON service_categories
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_isolation_policy ON services
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY quotations_isolation_policy ON quotations
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_orders_isolation_policy ON service_orders
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_items_isolation_policy ON inventory_items
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_movements_isolation_policy ON inventory_movements
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_isolation_policy ON payments
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
CREATE POLICY warranties_isolation_policy ON warranties
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE after_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY after_sales_isolation_policy ON after_sales
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY scheduled_jobs_isolation_policy ON scheduled_jobs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_isolation_policy ON audit_logs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- ============================================
-- SEED DATA OPCIONAL (Exemplo de Categorias)
-- (Descomente ao utilizar após criar um tenant válido)
-- ============================================

/*
INSERT INTO service_categories (id, tenant_id, name) VALUES 
(gen_random_uuid(), 'SEU-TENANT-UUID-AQUI', 'Elétrica'),
(gen_random_uuid(), 'SEU-TENANT-UUID-AQUI', 'Hidráulica'),
(gen_random_uuid(), 'SEU-TENANT-UUID-AQUI', 'Climatização');
*/
