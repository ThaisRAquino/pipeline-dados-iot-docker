const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarReserva } = require('../src/validacao');

test('rejeita reserva sem itemId', () => {
  const r = validarReserva({ quantidade: 1 });
  assert.equal(r.valido, false);
});

test('rejeita quantidade zero', () => {
  const r = validarReserva({ itemId: 'sku-001', quantidade: 0 });
  assert.equal(r.valido, false);
});

test('aceita reserva válida', () => {
  const r = validarReserva({ itemId: 'sku-001', quantidade: 3 });
  assert.equal(r.valido, true);
});
