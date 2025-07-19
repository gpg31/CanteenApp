const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { roleAuth } = require('../middleware/roleAuth');
const { supabase } = require('../config/database');

// Get all payments for logged in user (customer view)
router.get('/my', auth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        order:orders (
          order_id,
          order_date,
          status,
          user_id
        )
      `)
      .eq('orders.user_id', req.user.user_id)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment details by ID
router.get('/:payment_id', auth, async (req, res) => {
  try {
    const { payment_id } = req.params;
    
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        order:orders (
          order_id,
          order_date,
          status,
          user_id
        )
      `)
      .eq('payment_id', payment_id)
      .single();

    if (error) throw error;

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if the user is allowed to view this payment
    if (
      req.user.role === 'customer' && 
      payment.order.user_id !== req.user.user_id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create payment record
router.post('/', auth, async (req, res) => {
  try {
    const { order_id, amount, payment_method, payment_status = 'pending' } = req.body;

    // Verify the order exists and belongs to the user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_id, user_id, total_amount')
      .eq('order_id', order_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'customer' && order.user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        order_id,
        amount,
        payment_method,
        payment_status,
        payment_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update order status if payment is successful
    if (payment_status === 'completed') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('order_id', order_id);

      if (updateError) throw updateError;
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment status
router.patch('/:payment_id', auth, roleAuth(['admin', 'vendor']), async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { payment_status } = req.body;

    const { data: payment, error: updateError } = await supabase
      .from('payments')
      .update({ 
        payment_status,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', payment_id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // If payment is marked as completed, update order status
    if (payment_status === 'completed') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('order_id', payment.order_id);

      if (orderError) throw orderError;
    }

    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get summary of payments (admin/vendor only)
router.get('/summary/range', auth, roleAuth(['admin', 'vendor']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const { data: summary, error } = await supabase
      .from('payments')
      .select(`
        payment_method,
        payment_status,
        amount
      `)
      .gte('payment_date', start_date)
      .lte('payment_date', end_date);

    if (error) throw error;

    // Calculate summary statistics
    const stats = summary.reduce((acc, payment) => {
      if (!acc[payment.payment_method]) {
        acc[payment.payment_method] = {
          total_amount: 0,
          count: 0,
          completed: 0,
          pending: 0,
          failed: 0
        };
      }

      acc[payment.payment_method].total_amount += payment.amount;
      acc[payment.payment_method].count += 1;
      acc[payment.payment_method][payment.payment_status] += 1;

      return acc;
    }, {});

    res.json(stats);
  } catch (error) {
    console.error('Error getting payment summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
