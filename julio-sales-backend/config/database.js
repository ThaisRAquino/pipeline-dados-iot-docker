const { Sequelize } = require('sequelize');
const path = require('path');

// Criar conexão com SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    underscored: false, // Usar camelCase ao invés de snake_case
  }
});

// Função para testar conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error);
  }
};

// Função para sincronizar modelos com banco
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // alter: true atualiza tabelas existentes
    console.log('✅ Modelos sincronizados com banco de dados!');
  } catch (error) {
    console.error('❌ Erro ao sincronizar banco de dados:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};