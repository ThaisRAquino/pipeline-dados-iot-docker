-- Script de inicialização executado automaticamente pelo container do Postgres
-- (montado em /docker-entrypoint-initdb.d) na primeira subida do volume.

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id VARCHAR(64) NOT NULL,
    item_id VARCHAR(64) NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    valor NUMERIC(10, 2) NOT NULL CHECK (valor >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'CRIADO',
    transacao_id UUID,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos (cliente_id);

CREATE TABLE IF NOT EXISTS itens (
    item_id VARCHAR(64) PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    quantidade_disponivel INTEGER NOT NULL CHECK (quantidade_disponivel >= 0)
);

-- Dados de exemplo para permitir testar o fluxo completo localmente.
INSERT INTO itens (item_id, nome, quantidade_disponivel) VALUES
    ('sku-001', 'Fone de Ouvido Bluetooth', 50),
    ('sku-002', 'Mouse sem Fio', 120),
    ('sku-003', 'Teclado Mecânico', 30)
ON CONFLICT (item_id) DO NOTHING;
