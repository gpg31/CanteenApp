const express = require('express');
const router = express.Router();
const { MenuItem } = require('../models');
const { auth } = require('../middleware/auth');

// Get all menu items with current inventory
router.get('/', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: menuItems, error } = await MenuItem.findAll();

    const formattedItems = menuItems.map(item => ({
      item_id: item.item_id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image_url: item.image_url,
      quantity_remaining: item.DailyInventories[0]?.quantity_remaining || 0
    }));

    res.json(formattedItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get menu item by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const menuItem = await MenuItem.findOne({
      where: { item_id: req.params.id },
      include: [{
        model: DailyInventory,
        where: {
          inventory_date: today
        },
        required: false
      }]
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const formattedItem = {
      item_id: menuItem.item_id,
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      category: menuItem.category,
      image_url: menuItem.image_url,
      quantity_remaining: menuItem.DailyInventories[0]?.quantity_remaining || 0
    };

    res.json(formattedItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get menu items by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const menuItems = await MenuItem.findAll({
      where: {
        category: req.params.category,
        is_available: true
      },
      include: [{
        model: DailyInventory,
        where: {
          inventory_date: today
        },
        required: false
      }]
    });

    const formattedItems = menuItems.map(item => ({
      item_id: item.item_id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image_url: item.image_url,
      quantity_remaining: item.DailyInventories[0]?.quantity_remaining || 0
    }));

    res.json(formattedItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
