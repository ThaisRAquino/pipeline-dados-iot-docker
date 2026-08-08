const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarPedido } = require('../src/validacao');

test('rejeita pedido sem clienteId', () => {
  const r = validarPedido({ itemId: 'sku-001', quantidade: 1, valor: 10 });
  assert.equal(r.valido, false);
});

test('rejeita quantidade não inteira', () => {
  const r = validarPedido({ clienteId: 'c1', itemId: 'sku-001', quantidade: 1.5, valor: 10 });
  assert.equal(r.valido, false);
});

test('rejeita valor negativo', () => {
  const r = validarPedido({ clienteId: 'c1', itemId: 'sku-001', quantidade: 1, valor: -5 });
  assert.equal(r.valido, false);
});

test('aceita pedido válido', () => {
  const r = validarPedido({ clienteId: 'c1', itemId: 'sku-001', quantidade: 2, valor: 59.9 });
  assert.equal(r.valido, true);
});
