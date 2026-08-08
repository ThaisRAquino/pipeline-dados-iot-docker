// Logger estruturado em JSON, escrito em stdout (12-Factor App: XI - Logs como event streams).
// Não grava em arquivo nem gerencia rotação: isso é responsabilidade da plataforma
// (Docker/Kubernetes coletam stdout/stderr e encaminham para o backend de logs).

function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: process.env.SERVICE_NAME || 'unknown-service',
    message,
    ...meta,
  };
  console.log(JSON.stringify(entry));
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};
