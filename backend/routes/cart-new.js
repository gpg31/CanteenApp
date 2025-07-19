const express = require('express');
const router = express.Router();
const { Cart } = require('../models');
const { auth } = require('../middleware/auth');

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOrCreate(req.user.user_id);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const items = await Cart.getItems(cart.cart_id);
    
    const formattedCart = {
      cart_id: cart.cart_id,
      user_id: cart.user_id,
      items: items.map(item => ({
        cart_item_id: item.cart_item_id,
        quantity: item.quantity,
        menuItem: item.menu_item
      }))
    };

    res.json(formattedCart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
});

// Add item to cart
router.post('/items', auth, async (req, res) => {
  try {
    const { menu_item_id, quantity } = req.body;
    
    const cart = await Cart.findOrCreate(req.user.user_id);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await Cart.addItem(cart.cart_id, {
      menu_item_id,
      quantity
    });

    const updatedItems = await Cart.getItems(cart.cart_id);
    res.status(201).json(updatedItems);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Error adding item to cart', error: error.message });
  }
});

// Update cart item quantity
router.put('/items/:itemId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOrCreate(req.user.user_id);
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Remove if quantity is 0
    if (quantity === 0) {
      await Cart.removeItem(cart.cart_id, req.params.itemId);
      const updatedItems = await Cart.getItems(cart.cart_id);
      return res.json(updatedItems);
    }

    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('cart_id', cart.cart_id)
      .eq('item_id', req.params.itemId)
      .select();

    if (error) throw error;

    const updatedItems = await Cart.getItems(cart.cart_id);
    res.json(updatedItems);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Error updating cart item', error: error.message });
  }
});

// Remove item from cart
router.delete('/items/:itemId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOrCreate(req.user.user_id);
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await Cart.removeItem(cart.cart_id, req.params.itemId);
    const updatedItems = await Cart.getItems(cart.cart_id);
    res.json(updatedItems);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Error removing item from cart', error: error.message });
  }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOrCreate(req.user.user_id);
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await Cart.clear(cart.cart_id);
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
});

module.exports = router;
