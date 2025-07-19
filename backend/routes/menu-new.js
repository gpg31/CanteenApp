const express = require('express');
const router = express.Router();
const { MenuItem } = require('../models');
const { auth } = require('../middleware/auth');

// Get all menu items
router.get('/', auth, async (req, res) => {
  try {
    const menuItems = await MenuItem.findAll();
    
    if (!menuItems) {
      return res.status(404).json({ message: 'No menu items found' });
    }

    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
});

// Get menu item by ID
router.get('/:itemId', auth, async (req, res) => {
  try {
    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('item_id', req.params.itemId)
      .single();

    if (error) throw error;
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ message: 'Error fetching menu item', error: error.message });
  }
});

// Create menu item (vendor/admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const menuItem = await MenuItem.create({
      ...req.body,
      vendor_id: req.user.user_id
    });

    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Error creating menu item', error: error.message });
  }
});

// Update menu item (vendor/admin only)
router.put('/:itemId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const menuItem = await MenuItem.update(req.params.itemId, req.body);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Error updating menu item', error: error.message });
  }
});

// Delete menu item (vendor/admin only)
router.delete('/:itemId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const success = await MenuItem.delete(req.params.itemId);
    
    if (!success) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Error deleting menu item', error: error.message });
  }
});

module.exports = router;
