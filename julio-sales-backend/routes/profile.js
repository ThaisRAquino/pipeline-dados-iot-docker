const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { uploadConfigs, handleUploadError } = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  updateProfileImage,
  deleteProfileImage
} = require('../controllers/profileController');

// ===== ROTAS PÚBLICAS =====

/**
 * @route   GET /api/profile
 * @desc    Buscar perfil do fotógrafo
 * @access  Public
 */
router.get('/', getProfile);

// ===== ROTAS PRIVADAS (ADMIN) =====

/**
 * @route   PUT /api/profile
 * @desc    Atualizar perfil completo
 * @access  Private
 * @body    { photographerName?, photographerBio?, experienceYears?, specialization?, location?, weddingsCount? }
 * @file    profileImage (opcional)
 */
router.put(
  '/',
  authenticateToken,
  uploadConfigs.profile.single('profileImage'),
  handleUploadError,
  updateProfile
);

/**
 * @route   PUT /api/profile/image
 * @desc    Atualizar apenas foto de perfil
 * @access  Private
 * @file    profileImage (obrigatório)
 */
router.put(
  '/image',
  authenticateToken,
  uploadConfigs.profile.single('profileImage'),
  handleUploadError,
  updateProfileImage
);

/**
 * @route   DELETE /api/profile/image
 * @desc    Deletar foto de perfil
 * @access  Private
 */
router.delete('/image', authenticateToken, deleteProfileImage);

module.exports = router;