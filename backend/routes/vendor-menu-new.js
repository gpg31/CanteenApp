const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleAuth } = require('../middleware/roleAuth');
const { supabase } = require('../config/database');

// Get vendor's menu items
router.get('/', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:categories (
          name,
          description
        )
      `)
      .eq('vendor_id', req.user.vendor_id)
      .order('name');

    if (error) throw error;
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new menu item
router.post('/', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category_id,
      is_available = true,
      image_url = null
    } = req.body;

    const { data: item, error } = await supabase
      .from('menu_items')
      .insert([{
        name,
        description,
        price,
        category_id,
        is_available,
        image_url,
        vendor_id: req.user.vendor_id
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update menu item
router.patch('/:id', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('menu_items')
      .select('vendor_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (existing.vendor_id !== req.user.vendor_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { data: item, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(item);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete menu item
router.delete('/:id', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('menu_items')
      .select('vendor_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (existing.vendor_id !== req.user.vendor_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update availability status in bulk
router.post('/bulk-availability', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const { items } = req.body;

    // Verify ownership of all items
    const { data: existingItems, error: fetchError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('vendor_id', req.user.vendor_id)
      .in('id', items.map(item => item.id));

    if (fetchError) throw fetchError;

    const allowedIds = new Set(existingItems.map(item => item.id));
    const updates = items.filter(item => allowedIds.has(item.id));

    const { error } = await supabase.rpc('update_menu_items_availability', {
      items: updates
    });

    if (error) throw error;

    res.json({ message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get menu item categories
router.get('/categories', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
