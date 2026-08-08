function validarReserva(body) {
  const { itemId, quantidade } = body || {};

  if (!itemId || typeof itemId !== 'string') {
    return { valido: false, erro: 'itemId é obrigatório e deve ser texto' };
  }
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return { valido: false, erro: 'quantidade deve ser um inteiro positivo' };
  }

  return { valido: true };
}

module.exports = { validarReserva };
