require('./tracing');

const express = require('express');
const client = require('prom-client');
const logger = require('./logger');
const pool = require('./db');
const { validarReserva } = require('./validacao');

const app = express();
app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'estoque_service_' });
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});
const reservasRecusadas = new client.Counter({
  name: 'estoque_reservas_recusadas_total',
  help: 'Total de reservas de estoque recusadas por falta de saldo',
  registers: [register],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => end({ method: req.method, route: req.path, status_code: res.statusCode }));
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

// Reserva itens de forma atômica (evita condição de corrida em picos de tráfego).
app.post('/estoque/reservar', async (req, res) => {
  const { itemId, quantidade } = req.body || {};
  const validacao = validarReserva(req.body);
  if (!validacao.valido) {
    return res.status(400).json({ error: validacao.erro });
  }

  const client_ = await pool.connect();
  try {
    await client_.query('BEGIN');
    const result = await client_.query(
      `UPDATE itens SET quantidade_disponivel = quantidade_disponivel - $1
       WHERE item_id = $2 AND quantidade_disponivel >= $1
       RETURNING item_id, quantidade_disponivel`,
      [quantidade, itemId]
    );

    if (result.rows.length === 0) {
      await client_.query('ROLLBACK');
      reservasRecusadas.inc();
      logger.warn('estoque_insuficiente', { itemId, quantidade });
      return res.status(409).json({ error: 'Estoque insuficiente', itemId });
    }

    await client_.query('COMMIT');
    logger.info('estoque_reservado', { itemId, quantidade });
    return res.status(200).json({ itemId, reservado: quantidade });
  } catch (err) {
    await client_.query('ROLLBACK');
    logger.error('erro_reservar_estoque', { error: err.message });
    return res.status(500).json({ error: 'Erro interno' });
  } finally {
    client_.release();
  }
});

// Libera uma reserva (compensação, usada quando o pagamento é recusado).
app.post('/estoque/liberar', async (req, res) => {
  const { itemId, quantidade } = req.body || {};
  if (!itemId || !quantidade) {
    return res.status(400).json({ error: 'Campos obrigatórios: itemId, quantidade' });
  }

  try {
    await pool.query(
      `UPDATE itens SET quantidade_disponivel = quantidade_disponivel + $1 WHERE item_id = $2`,
      [quantidade, itemId]
    );
    logger.info('estoque_liberado', { itemId, quantidade });
    return res.status(200).json({ itemId, liberado: quantidade });
  } catch (err) {
    logger.error('erro_liberar_estoque', { error: err.message });
    return res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/estoque/:itemId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM itens WHERE item_id = $1', [req.params.itemId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    logger.error('erro_consultar_item', { error: err.message });
    return res.status(500).json({ error: 'Erro interno' });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => logger.info(`Serviço de Estoque ouvindo na porta ${PORT}`));
