const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { supabase } = require('../config/database');

// Get dashboard statistics for vendor/admin
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get total sales for today
    const { data: todaySales, error: todayError } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (todayError) throw todayError;

    // Get total sales for week
    const { data: weekSales, error: weekError } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', startOfWeek.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (weekError) throw weekError;

    // Get total sales for month
    const { data: monthSales, error: monthError } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', startOfMonth.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (monthError) throw monthError;

    // Calculate totals
    const todayTotal = todaySales.reduce((sum, order) => sum + order.total_amount, 0);
    const weekTotal = weekSales.reduce((sum, order) => sum + order.total_amount, 0);
    const monthTotal = monthSales.reduce((sum, order) => sum + order.total_amount, 0);

    // Get recent orders
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!customer_id(*),
        order_items:order_items(
          *,
          menu_item:menu_items(*)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) throw ordersError;

    // Get top menu items
    const { data: topItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        menu_item_id,
        menu_item:menu_items(*),
        quantity
      `)
      .gte('created_at', startOfMonth.toISOString())
      .order('quantity', { ascending: false })
      .limit(5);

    if (itemsError) throw itemsError;

    res.json({
      sales: {
        today: todayTotal,
        week: weekTotal,
        month: monthTotal
      },
      recentOrders,
      topItems: topItems.reduce((acc, item) => {
        const existingItem = acc.find(i => i.menu_item_id === item.menu_item_id);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          acc.push({
            menu_item_id: item.menu_item_id,
            name: item.menu_item.name,
            quantity: item.quantity
          });
        }
        return acc;
      }, []).sort((a, b) => b.quantity - a.quantity)
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

module.exports = router;
