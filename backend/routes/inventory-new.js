const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleAuth } = require('../middleware/roleAuth');
const { supabase } = require('../config/database');

// Get all inventory items
router.get('/', auth, roleAuth(['admin', 'vendor']), async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('inventory')
      .select('*')
      .order('item_name');

    if (error) throw error;
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get inventory item by ID
router.get('/:id', auth, roleAuth(['admin', 'vendor']), async (req, res) => {
  try {
    const { data: item, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new inventory item
router.post('/', auth, roleAuth(['admin', 'vendor']), async (req, res) => {
  const { item_name, quantity, unit, min_quantity = 0 } = req.body;

  try {
    // Start a Supabase transaction by using RPC
    const { data: result, error } = await supabase.rpc('add_inventory_item', {
      p_item_name: item_name,
      p_quantity: quantity,
      p_unit: unit,
      p_min_quantity: min_quantity
    });

    if (error) throw error;

    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update inventory item
router.patch('/:id', auth, roleAuth(['admin', 'vendor']), async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data: item, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update inventory quantities in bulk
router.post('/bulk-update', auth, roleAuth(['admin', 'vendor']), async (req, res) => {
  const { updates } = req.body;

  try {
    // Use Supabase's RPC call for bulk update
    const { data: result, error } = await supabase.rpc('bulk_update_inventory', {
      items: updates
    });

    if (error) throw error;

    res.json({ message: 'Inventory updated successfully', updated: result });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete inventory item
router.delete('/:id', auth, roleAuth(['admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get low stock items
router.get('/status/low', auth, roleAuth(['admin', 'vendor']), async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('inventory')
      .select('*')
      .lt('quantity', supabase.raw('min_quantity'));

    if (error) throw error;
    res.json(items);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
