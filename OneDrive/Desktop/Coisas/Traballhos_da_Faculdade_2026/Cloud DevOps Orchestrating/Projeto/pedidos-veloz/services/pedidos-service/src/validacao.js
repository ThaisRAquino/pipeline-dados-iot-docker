// Validação extraída em módulo puro (sem I/O) para ser facilmente testável
// de forma unitária, sem precisar subir banco de dados ou rede.
function validarPedido(body) {
  const { clienteId, itemId, quantidade, valor } = body || {};

  if (!clienteId || typeof clienteId !== 'string') {
    return { valido: false, erro: 'clienteId é obrigatório e deve ser texto' };
  }
  if (!itemId || typeof itemId !== 'string') {
    return { valido: false, erro: 'itemId é obrigatório e deve ser texto' };
  }
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return { valido: false, erro: 'quantidade deve ser um inteiro positivo' };
  }
  if (typeof valor !== 'number' || valor <= 0) {
    return { valido: false, erro: 'valor deve ser um número positivo' };
  }

  return { valido: true };
}

module.exports = { validarPedido };
