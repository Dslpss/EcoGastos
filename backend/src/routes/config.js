const express = require('express');
const router = express.Router();
const AppConfig = require('../models/AppConfig');
const auth = require('../middleware/auth');

// @route   GET /api/config
// @desc    Get app configuration (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Find the single config document (we assume there's only one)
    let config = await AppConfig.findOne();

    // If no config exists, create default one (Seed logic)
    if (!config) {
      config = new AppConfig();
      await config.save();
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar configurações' 
    });
  }
});

// @route   PUT /api/config
// @desc    Update app configuration
// @access  Private (Admin only ideally, but using auth for now)
router.put('/', auth, async (req, res) => {
  try {
    const { 
      is_maintenance, 
      maintenance_message, 
      has_update, 
      update_message, 
      update_url, 
      force_update,
      show_warning,
      warning_message
    } = req.body;

    let config = await AppConfig.findOne();

    if (!config) {
      config = new AppConfig();
    }

    // Update fields if provided
    if (is_maintenance !== undefined) config.is_maintenance = is_maintenance;
    if (maintenance_message !== undefined) config.maintenance_message = maintenance_message;
    if (has_update !== undefined) config.has_update = has_update;
    if (update_message !== undefined) config.update_message = update_message;
    if (update_url !== undefined) config.update_url = update_url;
    if (force_update !== undefined) config.force_update = force_update;
    if (show_warning !== undefined) config.show_warning = show_warning;
    if (warning_message !== undefined) config.warning_message = warning_message;

    await config.save();

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data: config,
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar configurações' 
    });
  }
});

module.exports = router;
