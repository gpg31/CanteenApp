const express = require('express');
const router = express.Router();
const { MenuItem } = require('../models');
const { roleAuth } = require('../middleware/roleAuth');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all menu items (vendor/admin version with all items including unavailable)
router.get('/all', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const menuItems = await MenuItem.findAll({
      order: [
        ['category', 'ASC'],
        ['name', 'ASC']
      ]
    });
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new menu item
router.post('/', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { name, description, price, category, image_url, is_available } = req.body;
    
    // Basic validation
    if (!name || !price || price <= 0) {
      return res.status(400).json({ message: 'Name and valid price are required' });
    }

    // Check if menu item with this name already exists
    const existingItem = await MenuItem.findOne({ where: { name } });
    if (existingItem) {
      return res.status(400).json({ message: 'Menu item with this name already exists' });
    }

    const menuItem = await MenuItem.create({
      name,
      description: description || '',
      price,
      category: category || 'Other',
      image_url: image_url || null,
      is_available: is_available !== undefined ? is_available : true
    });

    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update menu item
router.put('/:item_id', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { item_id } = req.params;
    const { name, description, price, category, image_url, is_available } = req.body;
    
    const menuItem = await MenuItem.findByPk(item_id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Check for name conflict if name is being changed
    if (name !== menuItem.name) {
      const existingItem = await MenuItem.findOne({ where: { name } });
      if (existingItem) {
        return res.status(400).json({ message: 'Another menu item with this name already exists' });
      }
    }

    await menuItem.update({
      name: name || menuItem.name,
      description: description !== undefined ? description : menuItem.description,
      price: price || menuItem.price,
      category: category || menuItem.category,
      image_url: image_url !== undefined ? image_url : menuItem.image_url,
      is_available: is_available !== undefined ? is_available : menuItem.is_available
    });

    res.json(menuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete menu item
router.delete('/:item_id', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { item_id } = req.params;
    
    const menuItem = await MenuItem.findByPk(item_id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await menuItem.destroy();
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle menu item availability
router.patch('/:item_id/toggle-availability', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { item_id } = req.params;
    const { is_available } = req.body;
    
    if (is_available === undefined) {
      return res.status(400).json({ message: 'Availability status is required' });
    }

    const menuItem = await MenuItem.findByPk(item_id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await menuItem.update({ is_available });
    res.json(menuItem);
  } catch (error) {
    console.error('Error updating menu item availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update menu items availability
router.patch('/bulk/availability', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid menu items data' });
    }

    const results = [];
    for (const item of items) {
      const { item_id, is_available } = item;
      
      if (!item_id || is_available === undefined) {
        continue; // Skip invalid items
      }

      const menuItem = await MenuItem.findByPk(item_id);
      if (!menuItem) continue;

      await menuItem.update({ is_available });
      results.push(menuItem);
    }

    res.json(results);
  } catch (error) {
    console.error('Error bulk updating menu items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
