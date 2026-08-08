require('./tracing'); // DEVE ser o primeiro require do arquivo

const express = require('express');
const client = require('prom-client');
const logger = require('./logger');
const { caminhoDestino } = require('./rotas');

const app = express();
app.use(express.json());

// ---- Métricas Prometheus ----
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'api_gateway_' });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.path, status_code: res.statusCode });
    logger.info('request_handled', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
  });
  next();
});

// ---- Health checks (usados pelas probes do Kubernetes) ----
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', (req, res) => res.status(200).json({ status: 'ready' }));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ---- Configuração via variáveis de ambiente (12-Factor: III - Config) ----
const SERVICES = {
  pedidos: process.env.PEDIDOS_SERVICE_URL || 'http://pedidos-service:3001',
  pagamentos: process.env.PAGAMENTOS_SERVICE_URL || 'http://pagamentos-service:3002',
  estoque: process.env.ESTOQUE_SERVICE_URL || 'http://estoque-service:3003',
};

// Proxy HTTP simples e explícito (evita dependência extra só para roteamento).
function proxy(base) {
  return async (req, res) => {
    const targetUrl = `${base}${caminhoDestino(req.originalUrl)}`;
    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: { 'content-type': 'application/json' },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {}),
      });
      const data = await response.json().catch(() => ({}));
      res.status(response.status).json(data);
    } catch (err) {
      logger.error('proxy_error', { error: err.message, target: targetUrl });
      res.status(502).json({ error: 'Serviço indisponível', detail: err.message });
    }
  };
}

app.use('/api/pedidos', proxy(SERVICES.pedidos));
app.use('/api/pagamentos', proxy(SERVICES.pagamentos));
app.use('/api/estoque', proxy(SERVICES.estoque));

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`API Gateway ouvindo na porta ${PORT}`));
