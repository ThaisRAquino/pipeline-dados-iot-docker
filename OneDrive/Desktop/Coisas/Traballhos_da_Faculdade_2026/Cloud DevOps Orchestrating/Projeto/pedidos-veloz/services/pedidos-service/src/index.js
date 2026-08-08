require('./tracing');

const express = require('express');
const client = require('prom-client');
const logger = require('./logger');
const pool = require('./db');
const { validarPedido } = require('./validacao');

const app = express();
app.use(express.json());

// ---- Métricas ----
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'pedidos_service_' });
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});
const pedidosCriados = new client.Counter({
  name: 'pedidos_criados_total',
  help: 'Total de pedidos criados com sucesso',
  registers: [register],
});
const pedidosRecusados = new client.Counter({
  name: 'pedidos_recusados_total',
  help: 'Total de pedidos recusados (estoque ou pagamento)',
  labelNames: ['motivo'],
  registers: [register],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.path, status_code: res.statusCode });
  });
  next();
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    logger.error('readiness_check_failed', { error: err.message });
    res.status(503).json({ status: 'not-ready' });
  }
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const ESTOQUE_URL = process.env.ESTOQUE_SERVICE_URL || 'http://estoque-service:3003';
const PAGAMENTOS_URL = process.env.PAGAMENTOS_SERVICE_URL || 'http://pagamentos-service:3002';

// ---- POST /pedidos: cria um novo pedido ----
// Orquestração síncrona simples (adequada ao escopo do MVP):
//   1. reserva o item no Serviço de Estoque
//   2. processa o pagamento no Serviço de Pagamentos
//   3. persiste o pedido como CONFIRMADO
//   4. em caso de falha em qualquer etapa, aplica COMPENSAÇÃO (libera estoque)
// Ver README/relatório técnico para a justificativa de não usar mensageria
// no MVP e a evolução recomendada para um padrão de eventos (outbox + broker).
app.post('/pedidos', async (req, res) => {
  const { clienteId, itemId, quantidade, valor } = req.body || {};

  const validacao = validarPedido(req.body);
  if (!validacao.valido) {
    return res.status(400).json({ error: validacao.erro });
  }

  let estoqueReservado = false;

  try {
    // 1. Reserva de estoque
    const estoqueResp = await fetch(`${ESTOQUE_URL}/estoque/reservar`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ itemId, quantidade }),
    });

    if (!estoqueResp.ok) {
      pedidosRecusados.inc({ motivo: 'estoque_insuficiente' });
      const detalhe = await estoqueResp.json().catch(() => ({}));
      return res.status(409).json({ error: 'Estoque insuficiente', detalhe });
    }
    estoqueReservado = true;

    // 2. Processamento de pagamento
    const pagamentoResp = await fetch(`${PAGAMENTOS_URL}/pagamentos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clienteId, valor }),
    });
    const pagamento = await pagamentoResp.json().catch(() => ({}));

    if (!pagamentoResp.ok || pagamento.status !== 'aprovado') {
      // Compensação: libera o estoque reservado
      await fetch(`${ESTOQUE_URL}/estoque/liberar`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId, quantidade }),
      }).catch((err) => logger.error('falha_compensacao_estoque', { error: err.message }));

      pedidosRecusados.inc({ motivo: 'pagamento_recusado' });
      return res.status(402).json({ error: 'Pagamento recusado', pagamento });
    }

    // 3. Persistência do pedido confirmado
    const result = await pool.query(
      `INSERT INTO pedidos (cliente_id, item_id, quantidade, valor, status, transacao_id, criado_em)
       VALUES ($1, $2, $3, $4, 'CONFIRMADO', $5, NOW())
       RETURNING id, cliente_id, item_id, quantidade, valor, status, transacao_id, criado_em`,
      [clienteId, itemId, quantidade, valor, pagamento.transacaoId]
    );

    const pedido = result.rows[0];
    pedidosCriados.inc();

    // Evento de domínio "PedidoCriado" — hoje apenas logado de forma estruturada;
    // é o ponto de extensão natural para publicar em um broker (Kafka/RabbitMQ)
    // quando o volume/necessidade de desacoplamento justificar a mensageria.
    logger.info('PedidoCriado', { pedidoId: pedido.id, clienteId, itemId, quantidade });

    return res.status(201).json(pedido);
  } catch (err) {
    logger.error('erro_criar_pedido', { error: err.message });

    if (estoqueReservado) {
      await fetch(`${ESTOQUE_URL}/estoque/liberar`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId, quantidade }),
      }).catch(() => {});
    }

    return res.status(500).json({ error: 'Erro interno ao processar o pedido' });
  }
});

app.get('/pedidos/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    logger.error('erro_consultar_pedido', { error: err.message });
    return res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/pedidos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC LIMIT 100');
    return res.status(200).json(result.rows);
  } catch (err) {
    logger.error('erro_listar_pedidos', { error: err.message });
    return res.status(500).json({ error: 'Erro interno' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => logger.info(`Serviço de Pedidos ouvindo na porta ${PORT}`));
