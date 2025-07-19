const express = require('express');
const router = express.Router();
const { Order, Cart } = require('../models');
const { auth } = require('../middleware/auth');
const { supabase } = require('../config/database');

// Create order from cart
router.post('/', auth, async (req, res) => {
  // Start a Supabase transaction
  const { data: client } = await supabase.getClient();

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
      user_id: req.user.user_id,
      total_amount: total,
      status: 'pending'
    });
          menu_item_id: cartItem.menu_item_id,
          inventory_date: today
        },
        transaction: t
      });

      if (!inventory || inventory.quantity_remaining < cartItem.quantity) {
        await t.rollback();
        return res.status(400).json({
          message: `Not enough ${cartItem.MenuItem.name} available`
        });
      }
    }

    // Create order
    const order = await Order.create({
      user_id: req.user.user_id,
      status: 'pending',
      total_amount: cart.CartItems.reduce((sum, item) => 
        sum + (item.quantity * item.MenuItem.price), 0)
    }, { transaction: t });

    // Create order items and update inventory
    for (const cartItem of cart.CartItems) {
      await OrderItem.create({
        order_id: order.order_id,
        menu_item_id: cartItem.menu_item_id,
        quantity: cartItem.quantity,
        unit_price: cartItem.MenuItem.price
      }, { transaction: t });

      await DailyInventory.decrement('quantity_remaining', {
        by: cartItem.quantity,
        where: {
          menu_item_id: cartItem.menu_item_id,
          inventory_date: today
        },
        transaction: t
      });
    }

    // Clear cart
    await CartItem.destroy({
      where: { cart_id: cart.cart_id },
      transaction: t
    });

    await t.commit();

    res.json({
      message: 'Order created successfully',
      order_id: order.order_id
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.user_id },
      include: [{
        model: OrderItem,
        include: [MenuItem]
      }],
      order: [['created_at', 'DESC']]
    });

    const formattedOrders = orders.map(order => ({
      order_id: order.order_id,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      items: order.OrderItems.map(item => ({
        quantity: item.quantity,
        unit_price: item.unit_price,
        menuItem: {
          item_id: item.MenuItem.item_id,
          name: item.MenuItem.name,
          image_url: item.MenuItem.image_url
        }
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        order_id: req.params.id,
        user_id: req.user.user_id
      },
      include: [{
        model: OrderItem,
        include: [MenuItem]
      }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const formattedOrder = {
      order_id: order.order_id,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      items: order.OrderItems.map(item => ({
        quantity: item.quantity,
        unit_price: item.unit_price,
        menuItem: {
          item_id: item.MenuItem.item_id,
          name: item.MenuItem.name,
          image_url: item.MenuItem.image_url
        }
      }))
    };

    res.json(formattedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel order
router.post('/:id/cancel', auth, async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: {
        order_id: req.params.id,
        user_id: req.user.user_id,
        status: 'pending'
      },
      include: [OrderItem],
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
    }

    // Restore inventory
    const today = new Date().toISOString().split('T')[0];
    for (const orderItem of order.OrderItems) {
      await DailyInventory.increment('quantity_remaining', {
        by: orderItem.quantity,
        where: {
          menu_item_id: orderItem.menu_item_id,
          inventory_date: today
        },
        transaction: t
      });
    }

    order.status = 'cancelled';
    await order.save({ transaction: t });

    await t.commit();
    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
