const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleAuth } = require('../middleware/roleAuth');
const { supabase } = require('../config/database');

// Get all orders for vendor
router.get('/', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const { status, start_date, end_date } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_item:menu_items (
            name,
            price
          )
        ),
        user:users (
          name,
          email,
          phone
        )
      `)
      .eq('vendor_id', req.user.vendor_id)
      .order('order_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (start_date && end_date) {
      query = query
        .gte('order_date', start_date)
        .lte('order_date', end_date);
    }

    const { data: orders, error } = await query;

    if (error) throw error;
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific order details
router.get('/:order_id', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_item:menu_items (
            name,
            price
          )
        ),
        user:users (
          name,
          email,
          phone
        )
      `)
      .eq('order_id', req.params.order_id)
      .eq('vendor_id', req.user.vendor_id)
      .single();

    if (error) throw error;

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/:order_id/status', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;

    // First verify vendor owns this order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('vendor_id')
      .eq('order_id', order_id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.vendor_id !== req.user.vendor_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update order status
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_id)
      .select()
      .single();

    if (error) throw error;

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order statistics
router.get('/stats/summary', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const { data, error } = await supabase.rpc('get_vendor_order_stats', {
      p_vendor_id: req.user.vendor_id,
      p_start_date: start_date,
      p_end_date: end_date
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending orders count
router.get('/stats/pending', auth, roleAuth(['vendor']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('order_id', { count: 'exact' })
      .eq('vendor_id', req.user.vendor_id)
      .eq('status', 'pending');

    if (error) throw error;
    
    res.json({ count: data.length });
  } catch (error) {
    console.error('Error fetching pending orders count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
