const { test } = require('node:test');
const assert = require('node:assert/strict');
const { caminhoDestino } = require('../src/rotas');

test('remove o prefixo /api do caminho', () => {
  assert.equal(caminhoDestino('/api/pedidos/123'), '/pedidos/123');
});

test('mantém query string', () => {
  assert.equal(caminhoDestino('/api/estoque/sku-001?campo=x'), '/estoque/sku-001?campo=x');
});
