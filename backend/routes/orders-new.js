const express = require('express');
const router = express.Router();
const { Order, Cart } = require('../models');
const { auth } = require('../middleware/auth');
const { supabase } = require('../config/database');

// Create order from cart
router.post('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOrCreate(req.user.user_id);
    const cartItems = await Cart.getItems(cart.cart_id);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total amount and prepare order items
    const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.menu_item.price), 0);
    
    // Create the order
    const order = await Order.create({
      customer_id: req.user.user_id,
      total_amount: total,
      status: 'pending'
    });

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.order_id,
      menu_item_id: item.menu_item.item_id,
      quantity: item.quantity,
      price: item.menu_item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Clear the cart
    await Cart.clear(cart.cart_id);

    // Get the complete order with items
    const completeOrder = await Order.findById(order.order_id);

    res.status(201).json(completeOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.findByCustomer(req.user.user_id);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get specific order
router.get('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user has access to this order
    if (order.customer_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Update order status (for admin/vendor)
router.patch('/:orderId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user has permission to update order
    if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedOrder = await Order.updateStatus(req.params.orderId, status);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

module.exports = router;
