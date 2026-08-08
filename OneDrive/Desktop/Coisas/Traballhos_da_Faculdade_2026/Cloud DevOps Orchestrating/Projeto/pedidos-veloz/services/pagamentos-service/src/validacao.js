function validarPagamento(body) {
  const { clienteId, valor } = body || {};

  if (!clienteId || typeof clienteId !== 'string') {
    return { valido: false, erro: 'clienteId é obrigatório e deve ser texto' };
  }
  if (typeof valor !== 'number' || valor <= 0) {
    return { valido: false, erro: 'valor deve ser um número positivo' };
  }

  return { valido: true };
}

module.exports = { validarPagamento };
