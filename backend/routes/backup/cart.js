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
        menuItem: {
          item_id: item.menu_item.item_id,
          name: item.menu_item.name,
          price: item.MenuItem.price,
          image_url: item.MenuItem.image_url
        }
      })),
      total: cart.CartItems.reduce((sum, item) => 
        sum + (item.quantity * item.MenuItem.price), 0)
    };

    res.json(formattedCart);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to cart
router.post('/item', auth, async (req, res) => {
  const { item_id, quantity } = req.body;

  if (!item_id || !quantity || quantity < 1) {
    return res.status(400).json({ message: 'Invalid request data' });
  }

  try {
    // Check if item exists and is available
    const menuItem = await MenuItem.findOne({
      where: {
        item_id,
        is_available: true
      }
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found or unavailable' });
    }

    // Get or create cart
    let cart = await Cart.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!cart) {
      cart = await Cart.create({
        user_id: req.user.user_id
      });
    }

    // Check if item already in cart
    let cartItem = await CartItem.findOne({
      where: {
        cart_id: cart.cart_id,
        menu_item_id: item_id
      }
    });

    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cart_id: cart.cart_id,
        menu_item_id: item_id,
        quantity
      });
    }

    res.json({ message: 'Item added to cart successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update cart item quantity
router.put('/item/:id', auth, async (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 0) {
    return res.status(400).json({ message: 'Invalid quantity' });
  }

  try {
    const cart = await Cart.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cartItem = await CartItem.findOne({
      where: {
        cart_item_id: req.params.id,
        cart_id: cart.cart_id
      }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (quantity === 0) {
      await cartItem.destroy();
      res.json({ message: 'Item removed from cart' });
    } else {
      cartItem.quantity = quantity;
      await cartItem.save();
      res.json({ message: 'Cart item updated successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove item from cart
router.delete('/item/:id', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cartItem = await CartItem.findOne({
      where: {
        cart_item_id: req.params.id,
        cart_id: cart.cart_id
      }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await cartItem.destroy();
    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await CartItem.destroy({
      where: { cart_id: cart.cart_id }
    });

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
