const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
  is_maintenance: {
    type: Boolean,
    default: false,
  },
  maintenance_message: {
    type: String,
    default: 'O aplicativo está em manutenção. Voltaremos em breve!',
  },
  has_update: {
    type: Boolean,
    default: false,
  },
  update_message: {
    type: String,
    default: 'Uma nova versão está disponível. Atualize para continuar.',
  },
  update_url: {
    type: String,
    default: '',
  },
  force_update: {
    type: Boolean,
    default: false,
  },
  show_warning: {
    type: Boolean,
    default: false,
  },
  warning_message: {
    type: String,
    default: '',
  },
}, {
  timestamps: { updatedAt: 'updated_at' }, // Maps updatedAt to updated_at
});

module.exports = mongoose.model('AppConfig', appConfigSchema);
