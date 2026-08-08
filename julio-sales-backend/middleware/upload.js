const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Criar diretórios se não existirem
const createUploadDirs = async () => {
  const dirs = [
    './uploads',
    './uploads/photos',
    './uploads/categories',
    './uploads/profile',
    './uploads/logo'
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Erro ao criar diretório ${dir}:`, error);
    }
  }
};

// Chamar na inicialização
createUploadDirs();

// Configuração de storage do Multer
const createStorage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `./uploads/${subfolder}/`);
    },
    filename: (req, file, cb) => {
      // Gerar nome único para o arquivo
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
};

// Filtro para aceitar apenas imagens
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos (JPEG, JPG, PNG, GIF, WebP)'));
  }
};

// Configurações de upload para diferentes tipos
const uploadConfigs = {
  photos: multer({
    storage: createStorage('photos'),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB para fotos
    },
    fileFilter: imageFilter
  }),

  categories: multer({
    storage: createStorage('categories'),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB para capas de categoria
    },
    fileFilter: imageFilter
  }),

  profile: multer({
    storage: createStorage('profile'),
    limits: {
      fileSize: 3 * 1024 * 1024 // 3MB para foto de perfil
    },
    fileFilter: imageFilter
  }),

  logo: multer({
    storage: createStorage('logo'),
    limits: {
      fileSize: 2 * 1024 * 1024 // 2MB para logo
    },
    fileFilter: imageFilter
  })
};

// Middleware para tratar erros de upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Tamanho máximo permitido ultrapassado.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Muitos arquivos. Envie apenas um arquivo por vez.'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Erro no upload: ${error.message}`
    });
  }
  
  if (error.message.includes('Apenas arquivos de imagem')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Função para deletar arquivo
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log(`Arquivo deletado: ${filePath}`);
  } catch (error) {
    console.error(`Erro ao deletar arquivo ${filePath}:`, error);
  }
};

module.exports = {
  uploadConfigs,
  handleUploadError,
  deleteFile,
  createUploadDirs
};