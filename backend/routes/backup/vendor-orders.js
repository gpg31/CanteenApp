const express = require('express');
const router = express.Router();
const { Order, OrderItem, User, MenuItem, Payment } = require('../models');
const { roleAuth } = require('../middleware/roleAuth');
const { Op, literal } = require('sequelize');

// Get all orders (for vendor with filtering)
router.get('/', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { status, date, startDate, endDate } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }
    
    // Filter by date
    if (date) {
      // Single day filter
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);
      
      whereClause.order_date = {
        [Op.gte]: targetDate,
        [Op.lt]: nextDay
      };
    } else if (startDate && endDate) {
      // Date range filter
      whereClause.order_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['user_id', 'full_name', 'email']
        },
        {
          model: OrderItem,
          include: {
            model: MenuItem,
            attributes: ['name', 'category']
          }
        },
        {
          model: Payment,
          attributes: ['payment_id', 'payment_method', 'status', 'amount']
        }
      ],
      order: [['order_date', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active orders (placed, preparing, ready for pickup)
router.get('/active', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        status: {
          [Op.in]: ['placed', 'preparing', 'ready_for_pickup']
        }
      },
      include: [
        {
          model: User,
          attributes: ['user_id', 'full_name', 'email']
        },
        {
          model: OrderItem,
          include: {
            model: MenuItem,
            attributes: ['name', 'category']
          }
        },
        {
          model: Payment,
          attributes: ['payment_id', 'payment_method', 'status', 'amount']
        }
      ],
      order: [['pickup_slot', 'ASC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order by ID
router.get('/:order_id', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { order_id } = req.params;
    
    const order = await Order.findOne({
      where: { order_id },
      include: [
        {
          model: User,
          attributes: ['user_id', 'full_name', 'email']
        },
        {
          model: OrderItem,
          include: {
            model: MenuItem,
            attributes: ['item_id', 'name', 'category', 'image_url']
          }
        },
        {
          model: Payment,
          attributes: ['payment_id', 'payment_method', 'status', 'amount', 'payment_date']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/:order_id/status', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;
    
    if (!status || !['placed', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    await order.update({ status });

    // If order is completed or cancelled, update inventory if needed
    if (['completed', 'cancelled'].includes(status)) {
      // Additional business logic here if needed
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders dashboard stats
router.get('/stats/dashboard', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's orders count
    const totalOrdersToday = await Order.count({
      where: {
        order_date: {
          [Op.between]: [today, endOfDay]
        }
      }
    });

    // Get pending orders count
    const pendingOrders = await Order.count({
      where: {
        status: {
          [Op.in]: ['placed', 'preparing', 'ready_for_pickup']
        }
      }
    });

    // Get today's sales
    const salesResult = await Order.findOne({
      attributes: [
        [literal('SUM(total_amount)'), 'totalSales']
      ],
      where: {
        order_date: {
          [Op.between]: [today, endOfDay]
        },
        status: {
          [Op.not]: 'cancelled'
        }
      },
      raw: true
    });

    // Get completed orders today
    const completedOrdersToday = await Order.count({
      where: {
        status: 'completed',
        order_date: {
          [Op.between]: [today, endOfDay]
        }
      }
    });

    // Get popular items today
    const popularItems = await OrderItem.findAll({
      attributes: [
        'MenuItemItemId',
        [literal('MenuItem.name'), 'name'],
        [literal('SUM(quantity)'), 'total_quantity'],
        [literal('SUM(price_at_order * quantity)'), 'total_revenue']
      ],
      include: {
        model: MenuItem,
        attributes: []
      },
      where: {
        '$Order.order_date$': {
          [Op.between]: [today, endOfDay]
        },
        '$Order.status$': {
          [Op.not]: 'cancelled'
        }
      },
      group: ['MenuItemItemId', 'MenuItem.name'],
      order: [[literal('total_quantity'), 'DESC']],
      limit: 5,
      raw: true
    });

    res.json({
      totalOrdersToday,
      pendingOrders,
      completedOrdersToday,
      totalSales: salesResult?.totalSales || 0,
      popularItems
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
