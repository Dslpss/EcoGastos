const mongoose = require('mongoose');

const featureCardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  icon: {
    type: String,
    required: true,
    default: 'star-outline',
  },
  color: {
    type: String,
    required: true,
    default: '#6366F1',
  },
  backgroundColor: {
    type: String,
    required: true,
    default: '#EEF2FF',
  },
  textColor: {
    type: String,
    required: true,
    default: '#1F2937',
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  action: {
    type: {
      type: String,
      enum: ['navigate', 'modal', 'external'],
      default: 'navigate',
    },
    target: {
      type: String,
      required: true,
    },
    params: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
}, {
  timestamps: true,
});

// Index for efficient queries
featureCardSchema.index({ enabled: 1, order: 1 });

const FeatureCard = mongoose.model('FeatureCard', featureCardSchema);

module.exports = FeatureCard;
