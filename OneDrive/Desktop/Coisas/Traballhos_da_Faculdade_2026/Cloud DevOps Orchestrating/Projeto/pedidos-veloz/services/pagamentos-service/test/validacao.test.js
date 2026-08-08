const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarPagamento } = require('../src/validacao');

test('rejeita pagamento sem clienteId', () => {
  const r = validarPagamento({ valor: 10 });
  assert.equal(r.valido, false);
});

test('rejeita valor zero', () => {
  const r = validarPagamento({ clienteId: 'c1', valor: 0 });
  assert.equal(r.valido, false);
});

test('aceita pagamento válido', () => {
  const r = validarPagamento({ clienteId: 'c1', valor: 99.9 });
  assert.equal(r.valido, true);
});
