// Função pura extraída para poder ser testada sem subir um servidor HTTP real.
function caminhoDestino(originalUrl) {
  return originalUrl.replace(/^\/api/, '');
}

module.exports = { caminhoDestino };
