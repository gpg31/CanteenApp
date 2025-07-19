const express = require('express');
const router = express.Router();
const { Order, OrderItem, MenuItem, Payment, User, DailyInventory } = require('../models');
const { roleAuth } = require('../middleware/roleAuth');
const { Op, Sequelize, literal } = require('sequelize');

// Get dashboard statistics for vendor/admin
router.get('/dashboard', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get total sales for today
    const todaySales = await Order.sum('total_amount', {
      where: {
        order_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Get total orders for today
    const totalOrders = await Order.count({
      where: {
        order_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Get pending orders
    const pendingOrders = await Order.count({
      where: {
        status: {
          [Op.in]: ['placed', 'preparing', 'ready_for_pickup']
        }
      }
    });

    // Get completed orders for today
    const completedOrders = await Order.count({
      where: {
        status: 'completed',
        order_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Get sold out items
    const soldOutItems = await DailyInventory.count({
      where: {
        inventory_date: today.toISOString().split('T')[0],
        quantity_remaining: 0
      }
    });

    // Get most popular items
    const popularItems = await OrderItem.findAll({
      attributes: [
        'MenuItemItemId',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_sold'],
        [Sequelize.literal('SUM(quantity * price_at_order)'), 'revenue']
      ],
      where: {
        '$Order.order_date$': {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      include: [
        {
          model: MenuItem,
          attributes: ['name', 'category']
        },
        {
          model: Order,
          attributes: [],
          where: {
            status: {
              [Op.ne]: 'cancelled'
            }
          }
        }
      ],
      group: ['MenuItemItemId'],
      order: [[Sequelize.literal('total_sold'), 'DESC']],
      limit: 5
    });

    // Format popular items
    const formattedPopularItems = popularItems.map(item => ({
      id: item.MenuItemItemId,
      name: item.MenuItem.name,
      category: item.MenuItem.category,
      totalSold: parseInt(item.dataValues.total_sold),
      revenue: parseFloat(item.dataValues.revenue)
    }));

    // Get sales by hour for today
    const salesByHour = await Order.findAll({
      attributes: [
        [Sequelize.fn('HOUR', Sequelize.col('order_date')), 'hour'],
        [Sequelize.fn('COUNT', Sequelize.col('order_id')), 'order_count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'sales']
      ],
      where: {
        order_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      group: [Sequelize.fn('HOUR', Sequelize.col('order_date'))],
      order: [[Sequelize.literal('hour'), 'ASC']]
    });

    // Get sales by day for this week
    const salesByDay = await Order.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('order_date')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('order_id')), 'order_count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'sales']
      ],
      where: {
        order_date: {
          [Op.gte]: startOfWeek
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('order_date'))],
      order: [[Sequelize.literal('date'), 'ASC']]
    });

    res.json({
      stats: {
        totalSales: todaySales || 0,
        totalOrders,
        pendingOrders,
        completedOrders,
        soldOutItems
      },
      popularItems: formattedPopularItems,
      salesByHour: salesByHour.map(item => ({
        hour: item.dataValues.hour,
        orderCount: parseInt(item.dataValues.order_count),
        sales: parseFloat(item.dataValues.sales || 0)
      })),
      salesByDay: salesByDay.map(item => ({
        date: item.dataValues.date,
        orderCount: parseInt(item.dataValues.order_count),
        sales: parseFloat(item.dataValues.sales || 0)
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sales analytics with filters (vendor/admin)
router.get('/sales', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // Default to last 30 days if no dates provided
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate 
      ? new Date(startDate) 
      : new Date(endDateObj.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let timeFormat;
    let groupByClause;
    
    // Format time based on groupBy parameter
    switch (groupBy) {
      case 'hour':
        timeFormat = '%Y-%m-%d %H:00';
        groupByClause = Sequelize.literal("DATE_FORMAT(order_date, '%Y-%m-%d %H:00')");
        break;
      case 'day':
        timeFormat = '%Y-%m-%d';
        groupByClause = Sequelize.literal("DATE_FORMAT(order_date, '%Y-%m-%d')");
        break;
      case 'week':
        timeFormat = '%Y-%u';
        groupByClause = Sequelize.literal("DATE_FORMAT(order_date, '%Y-%u')");
        break;
      case 'month':
        timeFormat = '%Y-%m';
        groupByClause = Sequelize.literal("DATE_FORMAT(order_date, '%Y-%m')");
        break;
      default:
        timeFormat = '%Y-%m-%d';
        groupByClause = Sequelize.literal("DATE_FORMAT(order_date, '%Y-%m-%d')");
    }
    
    // Get sales data grouped by the specified time unit
    const salesData = await Order.findAll({
      attributes: [
        [groupByClause, 'time_unit'],
        [Sequelize.fn('COUNT', Sequelize.col('order_id')), 'order_count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_sales']
      ],
      where: {
        order_date: {
          [Op.between]: [startDateObj, endDateObj]
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      group: ['time_unit'],
      order: [[Sequelize.col('time_unit'), 'ASC']]
    });

    res.json({
      salesData: salesData.map(item => ({
        timeUnit: item.dataValues.time_unit,
        orderCount: parseInt(item.dataValues.order_count),
        totalSales: parseFloat(item.dataValues.total_sales || 0)
      })),
      summary: {
        totalSales: salesData.reduce((sum, item) => sum + parseFloat(item.dataValues.total_sales || 0), 0),
        totalOrders: salesData.reduce((sum, item) => sum + parseInt(item.dataValues.order_count), 0),
        averageSalePerOrder: salesData.reduce((sum, item) => sum + parseFloat(item.dataValues.total_sales || 0), 0) / 
                             salesData.reduce((sum, item) => sum + parseInt(item.dataValues.order_count), 0) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get top selling items (vendor/admin)
router.get('/popular-items', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, limit = 10, category } = req.query;
    
    // Default to last 30 days if no dates provided
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate 
      ? new Date(startDate) 
      : new Date(endDateObj.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Build where clause
    const whereClause = {
      '$Order.order_date$': {
        [Op.between]: [startDateObj, endDateObj]
      },
      '$Order.status$': {
        [Op.ne]: 'cancelled'
      }
    };
    
    if (category) {
      whereClause['$MenuItem.category$'] = category;
    }
    
    // Get top selling items
    const popularItems = await OrderItem.findAll({
      attributes: [
        'MenuItemItemId',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_quantity'],
        [Sequelize.literal('SUM(quantity * price_at_order)'), 'total_revenue']
      ],
      where: whereClause,
      include: [
        {
          model: MenuItem,
          attributes: ['name', 'category', 'price', 'image_url']
        },
        {
          model: Order,
          attributes: []
        }
      ],
      group: ['MenuItemItemId'],
      order: [[Sequelize.literal('total_quantity'), 'DESC']],
      limit: parseInt(limit)
    });

    res.json(popularItems.map(item => ({
      id: item.MenuItemItemId,
      name: item.MenuItem.name,
      category: item.MenuItem.category,
      price: parseFloat(item.MenuItem.price),
      imageUrl: item.MenuItem.image_url,
      totalQuantitySold: parseInt(item.dataValues.total_quantity),
      totalRevenue: parseFloat(item.dataValues.total_revenue)
    })));
  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get peak ordering times (vendor/admin)
router.get('/peak-times', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate 
      ? new Date(startDate) 
      : new Date(endDateObj.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get orders by hour of day
    const ordersByHour = await Order.findAll({
      attributes: [
        [Sequelize.fn('HOUR', Sequelize.col('order_date')), 'hour'],
        [Sequelize.fn('COUNT', Sequelize.col('order_id')), 'order_count']
      ],
      where: {
        order_date: {
          [Op.between]: [startDateObj, endDateObj]
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      group: [Sequelize.fn('HOUR', Sequelize.col('order_date'))],
      order: [[Sequelize.literal('hour'), 'ASC']]
    });

    // Get orders by day of week (0 = Sunday, 6 = Saturday)
    const ordersByDayOfWeek = await Order.findAll({
      attributes: [
        [Sequelize.fn('DAYOFWEEK', Sequelize.col('order_date')), 'day_of_week'],
        [Sequelize.fn('COUNT', Sequelize.col('order_id')), 'order_count']
      ],
      where: {
        order_date: {
          [Op.between]: [startDateObj, endDateObj]
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      group: [Sequelize.fn('DAYOFWEEK', Sequelize.col('order_date'))],
      order: [[Sequelize.literal('day_of_week'), 'ASC']]
    });

    res.json({
      byHour: ordersByHour.map(item => ({
        hour: parseInt(item.dataValues.hour),
        orderCount: parseInt(item.dataValues.order_count)
      })),
      byDayOfWeek: ordersByDayOfWeek.map(item => ({
        dayOfWeek: parseInt(item.dataValues.day_of_week) - 1, // Convert to 0-indexed (0 = Sunday)
        orderCount: parseInt(item.dataValues.order_count)
      }))
    });
  } catch (error) {
    console.error('Error fetching peak times:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
