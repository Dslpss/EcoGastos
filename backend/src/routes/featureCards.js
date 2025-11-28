const express = require('express');
const router = express.Router();
const FeatureCard = require('../models/FeatureCard');
const auth = require('../middleware/auth');

// Public route - Get active feature cards (for the app)
router.get('/feature-cards', async (req, res) => {
  try {
    const cards = await FeatureCard.find({ enabled: true })
      .sort({ order: 1 })
      .select('-__v');
    
    res.json(cards);
  } catch (error) {
    console.error('Error fetching feature cards:', error);
    res.status(500).json({ message: 'Error fetching feature cards' });
  }
});

// Admin routes (protected)
// Get all feature cards
router.get('/admin/feature-cards', auth, async (req, res) => {
  try {
    const cards = await FeatureCard.find()
      .sort({ order: 1 })
      .select('-__v');
    
    res.json(cards);
  } catch (error) {
    console.error('Error fetching feature cards:', error);
    res.status(500).json({ message: 'Error fetching feature cards' });
  }
});

// Create new feature card
router.post('/admin/feature-cards', auth, async (req, res) => {
  try {
    const { title, description, icon, color, backgroundColor, textColor, enabled, order, action } = req.body;

    // Validation
    if (!title || !description || !action || !action.target) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const card = new FeatureCard({
      title,
      description,
      icon: icon || 'star-outline',
      color: color || '#6366F1',
      backgroundColor: backgroundColor || '#EEF2FF',
      textColor: textColor || '#1F2937',
      enabled: enabled !== undefined ? enabled : true,
      order: order || 0,
      action: {
        type: action.type || 'navigate',
        target: action.target,
        params: action.params || {},
      },
    });

    await card.save();
    res.status(201).json(card);
  } catch (error) {
    console.error('Error creating feature card:', error);
    res.status(500).json({ message: 'Error creating feature card' });
  }
});

// Update feature card
router.put('/admin/feature-cards/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const card = await FeatureCard.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!card) {
      return res.status(404).json({ message: 'Feature card not found' });
    }

    res.json(card);
  } catch (error) {
    console.error('Error updating feature card:', error);
    res.status(500).json({ message: 'Error updating feature card' });
  }
});

// Toggle feature card enabled status
router.patch('/admin/feature-cards/:id/toggle', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const card = await FeatureCard.findById(id);
    if (!card) {
      return res.status(404).json({ message: 'Feature card not found' });
    }

    card.enabled = !card.enabled;
    await card.save();

    res.json(card);
  } catch (error) {
    console.error('Error toggling feature card:', error);
    res.status(500).json({ message: 'Error toggling feature card' });
  }
});

// Delete feature card
router.delete('/admin/feature-cards/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const card = await FeatureCard.findByIdAndDelete(id);
    if (!card) {
      return res.status(404).json({ message: 'Feature card not found' });
    }

    res.json({ message: 'Feature card deleted successfully' });
  } catch (error) {
    console.error('Error deleting feature card:', error);
    res.status(500).json({ message: 'Error deleting feature card' });
  }
});

// Reorder feature cards
router.patch('/admin/feature-cards/reorder', auth, async (req, res) => {
  try {
    const { cardOrders } = req.body; // Array of { id, order }

    if (!Array.isArray(cardOrders)) {
      return res.status(400).json({ message: 'Invalid request format' });
    }

    // Update orders in bulk
    const updatePromises = cardOrders.map(({ id, order }) =>
      FeatureCard.findByIdAndUpdate(id, { order })
    );

    await Promise.all(updatePromises);

    const cards = await FeatureCard.find().sort({ order: 1 });
    res.json(cards);
  } catch (error) {
    console.error('Error reordering feature cards:', error);
    res.status(500).json({ message: 'Error reordering feature cards' });
  }
});

module.exports = router;
