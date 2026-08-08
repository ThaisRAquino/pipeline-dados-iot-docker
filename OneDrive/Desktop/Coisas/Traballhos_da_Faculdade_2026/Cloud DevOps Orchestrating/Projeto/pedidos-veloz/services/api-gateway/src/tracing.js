// Instrumentação de tracing distribuído com OpenTelemetry.
// Precisa ser importada ANTES de qualquer outro módulo (inclusive 'express'),
// pois a instrumentação automática faz "monkey patching" nos módulos nativos/HTTP.
//
// O SDK propaga automaticamente o header W3C "traceparent" entre chamadas HTTP
// (API Gateway -> Serviço de Pedidos -> Serviço de Pagamentos/Estoque), permitindo
// reconstruir a jornada completa de uma requisição no Jaeger/Grafana Tempo.

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'unknown-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${otlpEndpoint}/v1/traces`,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Reduz ruído: não instrumenta leitura de fs (muito verboso para este caso de uso).
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

try {
  sdk.start();
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: process.env.SERVICE_NAME || 'unknown-service',
      message: `OpenTelemetry tracing iniciado (exportando para ${otlpEndpoint})`,
    })
  );
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Falha ao iniciar OpenTelemetry SDK:', err);
}

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});

module.exports = sdk;
