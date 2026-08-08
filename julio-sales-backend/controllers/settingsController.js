const { Settings } = require('../models/Settings');
const { Category, Subcategory } = require('../models/Category');
const { Photo } = require('../models/Photo');
const { deleteFile } = require('../middleware/upload');
const path = require('path');

// Buscar configurações do site
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // Se não existir configurações, criar padrão
    if (!settings) {
      settings = await Settings.create({
        siteTitle: 'JULIO SALES FOTOGRAFIAS',
        heroSubtitle: 'JULIO SALES',
        heroDescription: 'Capturando momentos únicos com arte e sensibilidade. Explore nossos trabalhos através das diferentes categorias.',
        aboutDescription: 'Com mais de uma década de experiência em fotografia, Julio Sales especializou-se em capturar a essência dos momentos mais importantes da vida.',
        contactEmail: 'contato@juliosales.com',
        contactPhone: '(11) 99999-9999',
        whatsappPhone: '5511999999999',
        whatsappMessage: 'Olá! Gostaria de saber mais sobre os serviços de fotografia do Julio Sales.'
      });
    }

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar configurações do site
const updateSettings = async (req, res) => {
  try {
    const {
      siteTitle,
      heroSubtitle,
      heroDescription,
      aboutDescription,
      contactEmail,
      contactPhone,
      whatsappPhone,
      whatsappMessage,
      isMaintenanceMode,
      allowRegistration
    } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      // Criar configurações se não existir
      const settingsData = {
        siteTitle,
        heroSubtitle,
        heroDescription,
        aboutDescription,
        contactEmail,
        contactPhone,
        whatsappPhone,
        whatsappMessage,
        isMaintenanceMode: isMaintenanceMode === 'true' || isMaintenanceMode === true,
        allowRegistration: allowRegistration === 'true' || allowRegistration === true
      };

      // Se houver arquivo de logo
      if (req.file) {
        settingsData.logoImage = req.file.filename;
      }

      settings = await Settings.create(settingsData);
    } else {
      // Atualizar configurações existentes
      const updateData = {};

      if (siteTitle) updateData.siteTitle = siteTitle;
      if (heroSubtitle) updateData.heroSubtitle = heroSubtitle;
      if (heroDescription !== undefined) updateData.heroDescription = heroDescription;
      if (aboutDescription !== undefined) updateData.aboutDescription = aboutDescription;
      if (contactEmail) updateData.contactEmail = contactEmail;
      if (contactPhone) updateData.contactPhone = contactPhone;
      if (whatsappPhone) updateData.whatsappPhone = whatsappPhone;
      if (whatsappMessage !== undefined) updateData.whatsappMessage = whatsappMessage;
      
      if (isMaintenanceMode !== undefined) {
        updateData.isMaintenanceMode = isMaintenanceMode === 'true' || isMaintenanceMode === true;
      }
      
      if (allowRegistration !== undefined) {
        updateData.allowRegistration = allowRegistration === 'true' || allowRegistration === true;
      }

      // Se houver novo logo
      if (req.file) {
        // Deletar logo anterior se existir
        if (settings.logoImage) {
          const oldLogoPath = path.join('./uploads/logo/', settings.logoImage);
          await deleteFile(oldLogoPath);
        }
        updateData.logoImage = req.file.filename;
      }

      await settings.update(updateData);
    }

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data: settings
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    
    // Se houve erro e novo logo foi enviado, deletar
    if (req.file) {
      await deleteFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar apenas WhatsApp
const updateWhatsAppSettings = async (req, res) => {
  try {
    const { whatsappPhone, whatsappMessage } = req.body;

    if (!whatsappPhone || !whatsappMessage) {
      return res.status(400).json({
        success: false,
        message: 'Telefone e mensagem do WhatsApp são obrigatórios'
      });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        whatsappPhone,
        whatsappMessage
      });
    } else {
      await settings.update({
        whatsappPhone,
        whatsappMessage
      });
    }

    res.json({
      success: true,
      message: 'Configurações do WhatsApp atualizadas com sucesso',
      data: {
        whatsappPhone: settings.whatsappPhone,
        whatsappMessage: settings.whatsappMessage
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Upload apenas do logo
const updateLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo de logo é obrigatório'
      });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        logoImage: req.file.filename
      });
    } else {
      // Deletar logo anterior se existir
      if (settings.logoImage) {
        const oldLogoPath = path.join('./uploads/logo/', settings.logoImage);
        await deleteFile(oldLogoPath);
      }

      await settings.update({
        logoImage: req.file.filename
      });
    }

    res.json({
      success: true,
      message: 'Logo atualizado com sucesso',
      data: {
        logoImageUrl: settings.logoImageUrl
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar logo:', error);
    
    // Se houve erro, deletar arquivo enviado
    if (req.file) {
      await deleteFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Deletar logo
const deleteLogo = async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (!settings || !settings.logoImage) {
      return res.status(404).json({
        success: false,
        message: 'Logo não encontrado'
      });
    }

    // Deletar arquivo de imagem
    const logoPath = path.join('./uploads/logo/', settings.logoImage);
    await deleteFile(logoPath);

    // Atualizar banco removendo referência do logo
    await settings.update({
      logoImage: null
    });

    res.json({
      success: true,
      message: 'Logo removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar logo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar estatísticas gerais do site
const getStatistics = async (req, res) => {
  try {
    const totalCategories = await Category.count({
      where: { isActive: true }
    });

    const totalSubcategories = await Subcategory.count({
      where: { isActive: true }
    });

    const totalPhotos = await Photo.count({
      where: { isActive: true }
    });

    // Estatísticas por categoria
    const categoriesWithStats = await Category.findAll({
      where: { isActive: true },
      attributes: ['id', 'name'],
      include: [
        {
          model: Subcategory,
          as: 'subcategories',
          where: { isActive: true },
          attributes: ['id'],
          required: false
        },
        {
          model: Photo,
          as: 'photos',
          where: { isActive: true },
          attributes: ['id'],
          required: false
        }
      ]
    });

    const categoryStats = categoriesWithStats.map(category => ({
      id: category.id,
      name: category.name,
      subcategoriesCount: category.subcategories.length,
      photosCount: category.photos.length
    }));

    // Últimas fotos adicionadas
    const recentPhotos = await Photo.findAll({
      where: { isActive: true },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'title', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        totals: {
          categories: totalCategories,
          subcategories: totalSubcategories,
          photos: totalPhotos
        },
        categoryStats,
        recentPhotos
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Modo de manutenção
const toggleMaintenanceMode = async (req, res) => {
  try {
    const { isMaintenanceMode } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        isMaintenanceMode: isMaintenanceMode === true
      });
    } else {
      await settings.update({
        isMaintenanceMode: isMaintenanceMode === true
      });
    }

    res.json({
      success: true,
      message: `Modo de manutenção ${settings.isMaintenanceMode ? 'ativado' : 'desativado'}`,
      data: {
        isMaintenanceMode: settings.isMaintenanceMode
      }
    });

  } catch (error) {
    console.error('Erro ao alterar modo de manutenção:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updateWhatsAppSettings,
  updateLogo,
  deleteLogo,
  getStatistics,
  toggleMaintenanceMode
};