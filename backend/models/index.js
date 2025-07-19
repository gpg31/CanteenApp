const { supabase } = require('../config/database');

// User Model
const User = {
  async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async update(userId, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Menu Item Model
const MenuItem = {
  async create(itemData) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([itemData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async findAll() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  async findByVendor(vendorId) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendorId);
    
    if (error) throw error;
    return data;
  },

  async update(itemId, updateData) {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('item_id', itemId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(itemId) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('item_id', itemId);
    
    if (error) throw error;
    return true;
  }
};

// Order Model
const Order = {
  async create(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async findById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_item:menu_items (*)
        )
      `)
      .eq('order_id', orderId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findByCustomer(customerId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_item:menu_items (*)
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async findByVendor(vendorId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_item:menu_items (*)
        )
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateStatus(orderId, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Cart Model
const Cart = {
  async findOrCreate(userId) {
    let { data: cart, error } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!cart && !error) {
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert([{ user_id: userId }])
        .select()
        .single();
      
      if (createError) throw createError;
      cart = newCart;
    } else if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return cart;
  },

  async addItem(cartId, itemData) {
    const { data, error } = await supabase
      .from('cart_items')
      .insert([{ cart_id: cartId, ...itemData }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeItem(cartId, itemId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('item_id', itemId);
    
    if (error) throw error;
    return true;
  },

  async getItems(cartId) {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        menu_item:menu_items (*)
      `)
      .eq('cart_id', cartId);
    
    if (error) throw error;
    return data;
  },

  async clear(cartId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);
    
    if (error) throw error;
    return true;
  }
};

module.exports = {
  User,
  MenuItem,
  Order,
  Cart
};
