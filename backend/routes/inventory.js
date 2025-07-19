const express = require('express');
const router = express.Router();
const { MenuItem, DailyInventory } = require('../models');
const { roleAuth } = require('../middleware/roleAuth');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Get all inventory items for today with menu item details
router.get('/today', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get inventory with menu items for today
    const inventory = await DailyInventory.findAll({
      where: {
        inventory_date: today
      },
      include: {
        model: MenuItem,
        attributes: ['item_id', 'name', 'price', 'category', 'image_url', 'is_available']
      }
    });

    // If no inventory for today, get all menu items with null inventory
    if (inventory.length === 0) {
      const menuItems = await MenuItem.findAll({
        attributes: ['item_id', 'name', 'price', 'category', 'image_url', 'is_available']
      });

      const inventoryWithDefaults = menuItems.map(item => ({
        inventory_id: null,
        inventory_date: today,
        quantity_initial: 0,
        quantity_remaining: 0,
        MenuItem: item
      }));

      return res.json(inventoryWithDefaults);
    }

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set initial inventory for the day (bulk create or update)
router.post('/set-today', roleAuth(['vendor', 'admin']), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { inventoryItems } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
      return res.status(400).json({ message: 'Invalid inventory data' });
    }

    const results = [];

    // Process each inventory item
    for (const item of inventoryItems) {
      const { item_id, quantity_initial } = item;
      
      // Validate required fields
      if (!item_id || quantity_initial === undefined) {
        continue; // Skip invalid items
      }

      // Find existing inventory for this item and date
      const existingInventory = await DailyInventory.findOne({
        where: {
          MenuItemItemId: item_id,
          inventory_date: today
        },
        transaction
      });

      if (existingInventory) {
        // Update existing inventory
        await existingInventory.update({
          quantity_initial,
          quantity_remaining: quantity_initial, // Reset remaining to initial when updating
        }, { transaction });
        
        results.push(existingInventory);
      } else {
        // Create new inventory entry
        const newInventory = await DailyInventory.create({
          MenuItemItemId: item_id,
          inventory_date: today,
          quantity_initial,
          quantity_remaining: quantity_initial
        }, { transaction });
        
        results.push(newInventory);
      }
    }

    await transaction.commit();
    res.status(201).json(results);
  } catch (error) {
    await transaction.rollback();
    console.error('Error setting inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update remaining quantity for a specific inventory item
router.patch('/:inventory_id', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { inventory_id } = req.params;
    const { quantity_remaining } = req.body;

    if (quantity_remaining === undefined) {
      return res.status(400).json({ message: 'Quantity remaining is required' });
    }

    const inventory = await DailyInventory.findByPk(inventory_id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    // Ensure quantity_remaining doesn't exceed quantity_initial
    const updatedQuantity = Math.min(
      Math.max(0, quantity_remaining), // Ensure non-negative
      inventory.quantity_initial // Cap at initial quantity
    );

    await inventory.update({ quantity_remaining: updatedQuantity });
    res.json(inventory);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update remaining quantities
router.patch('/bulk/update', roleAuth(['vendor', 'admin']), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid inventory data' });
    }

    const results = [];

    for (const item of items) {
      const { inventory_id, quantity_remaining } = item;
      
      if (!inventory_id || quantity_remaining === undefined) {
        continue; // Skip invalid items
      }

      const inventory = await DailyInventory.findByPk(inventory_id, { transaction });
      if (!inventory) continue;

      // Ensure quantity_remaining doesn't exceed quantity_initial
      const updatedQuantity = Math.min(
        Math.max(0, quantity_remaining),
        inventory.quantity_initial
      );

      await inventory.update({ quantity_remaining: updatedQuantity }, { transaction });
      results.push(inventory);
    }

    await transaction.commit();
    res.json(results);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get inventory history
router.get('/history', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 7 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate) 
      : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const inventory = await DailyInventory.findAll({
      where: {
        inventory_date: {
          [Op.between]: [start, end]
        }
      },
      include: {
        model: MenuItem,
        attributes: ['item_id', 'name', 'price', 'category']
      },
      order: [['inventory_date', 'DESC']]
    });

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
