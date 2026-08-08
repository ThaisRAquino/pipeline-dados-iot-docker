const { Pool } = require('pg');

// Configuração via variáveis de ambiente (12-Factor: III - Config).
// Nunca há credenciais hardcoded no código-fonte.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
});

module.exports = pool;
