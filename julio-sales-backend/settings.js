const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// Modelo para Configurações do Site
const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Conteúdo do site
  siteTitle: {
    type: DataTypes.STRING,
    defaultValue: 'JULIO SALES FOTOGRAFIAS'
  },
  heroSubtitle: {
    type: DataTypes.STRING,
    defaultValue: 'JULIO SALES'
  },
  heroDescription: {
    type: DataTypes.TEXT,
    defaultValue: 'Capturando momentos únicos com arte e sensibilidade. Explore nossos trabalhos através das diferentes categorias.'
  },
  aboutDescription: {
    type: DataTypes.TEXT,
    defaultValue: 'Com mais de uma década de experiência em fotografia, Julio Sales especializou-se em capturar a essência dos momentos mais importantes da vida.'
  },
  
  // Informações de contato
  contactEmail: {
    type: DataTypes.STRING,
    defaultValue: 'contato@juliosales.com',
    validate: {
      isEmail: true
    }
  },
  contactPhone: {
    type: DataTypes.STRING,
    defaultValue: '(11) 99999-9999'
  },
  
  // WhatsApp
  whatsappPhone: {
    type: DataTypes.STRING,
    defaultValue: '5511999999999'
  },
  whatsappMessage: {
    type: DataTypes.TEXT,
    defaultValue: 'Olá! Gostaria de saber mais sobre os serviços de fotografia do Julio Sales.'
  },
  
  // Logo
  logoImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logoImageUrl: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.logoImage ? 
        `${process.env.BASE_URL}/uploads/logo/${this.logoImage}` : null;
    }
  },
  
  // Configurações gerais
  isMaintenanceMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allowRegistration: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'settings'
});

// Modelo para Usuários Admin
const AdminUser = sequelize.define('AdminUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    defaultValue: 'admin'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'admin_users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Método para verificar senha
AdminUser.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = {
  Settings,
  AdminUser
};