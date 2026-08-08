require('./tracing');

const express = require('express');
const crypto = require('crypto');
const client = require('prom-client');
const logger = require('./logger');
const { validarPagamento } = require('./validacao');

const app = express();
app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'pagamentos_service_' });
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});
const pagamentosProcessados = new client.Counter({
  name: 'pagamentos_processados_total',
  help: 'Total de pagamentos processados',
  labelNames: ['status'],
  registers: [register],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => end({ method: req.method, route: req.path, status_code: res.statusCode }));
  next();
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', (req, res) => res.status(200).json({ status: 'ready' }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Taxa de recusa simulada do gateway externo (parametrizável por env var).
// Em produção, este serviço encapsularia a integração real (ex.: Stripe, Pagar.me).
const TAXA_RECUSA = Number(process.env.TAXA_RECUSA_PAGAMENTO) || 0.1;
const LATENCIA_MIN_MS = Number(process.env.LATENCIA_MIN_MS) || 100;
const LATENCIA_MAX_MS = Number(process.env.LATENCIA_MAX_MS) || 400;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post('/pagamentos', async (req, res) => {
  const { clienteId, valor } = req.body || {};

  const validacao = validarPagamento(req.body);
  if (!validacao.valido) {
    return res.status(400).json({ error: validacao.erro });
  }

  const latencia = LATENCIA_MIN_MS + Math.random() * (LATENCIA_MAX_MS - LATENCIA_MIN_MS);
  await delay(latencia);

  const aprovado = Math.random() > TAXA_RECUSA;
  const transacaoId = crypto.randomUUID();

  if (!aprovado) {
    pagamentosProcessados.inc({ status: 'recusado' });
    logger.warn('pagamento_recusado', { clienteId, valor, transacaoId });
    return res.status(402).json({ status: 'recusado', transacaoId });
  }

  pagamentosProcessados.inc({ status: 'aprovado' });
  logger.info('pagamento_aprovado', { clienteId, valor, transacaoId });
  return res.status(200).json({ status: 'aprovado', transacaoId });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => logger.info(`Serviço de Pagamentos ouvindo na porta ${PORT}`));
