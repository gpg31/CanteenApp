const express = require('express');
const router = express.Router();
const { Payment, Order, User } = require('../models');
const { auth } = require('../middleware/auth');
const { roleAuth } = require('../middleware/roleAuth');
const { Op, Sequelize } = require('sequelize');

// Get all payments for logged in user (customer view)
router.get('/my', auth, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Order,
          where: { UserUserId: req.user.user_id },
          attributes: ['order_id', 'order_date', 'status']
        }
      ],
      order: [['payment_date', 'DESC']]
    });

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
    
    const payment = await Payment.findOne({
      where: { payment_id },
      include: [
        {
          model: Order,
          attributes: ['order_id', 'order_date', 'status', 'UserUserId']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if the user is allowed to view this payment
    if (
      req.user.role === 'customer' && 
      payment.Order.UserUserId !== req.user.user_id
    ) {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create payment record (used during checkout)
router.post('/', auth, async (req, res) => {
  try {
    const { order_id, amount, payment_method, status = 'pending' } = req.body;
    
    if (!order_id || !amount || !payment_method) {
      return res.status(400).json({ message: 'Order ID, amount, and payment method are required' });
    }

    // Verify the order belongs to this user
    const order = await Order.findOne({ 
      where: { 
        order_id, 
        UserUserId: req.user.user_id 
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not owned by user' });
    }

    // Create payment record
    const payment = await Payment.create({
      amount,
      payment_method: payment_method.toUpperCase(),
      status,
      OrderOrderId: order_id
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment status (vendor/admin only)
router.put('/:payment_id', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'successful', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const payment = await Payment.findOne({ where: { payment_id } });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    await payment.save();

    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all payments (vendor/admin view)
router.get('/', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    const { status, method, date, startDate, endDate } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }
    
    // Filter by payment method if provided
    if (method) {
      whereClause.payment_method = method.toUpperCase();
    }
    
    // Filter by date
    if (date) {
      // Single day filter
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);
      
      whereClause.payment_date = {
        [Op.gte]: targetDate,
        [Op.lt]: nextDay
      };
    } else if (startDate && endDate) {
      // Date range filter
      whereClause.payment_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        {
          model: Order,
          attributes: ['order_id', 'order_date', 'status'],
          include: {
            model: User,
            attributes: ['user_id', 'full_name', 'email']
          }
        }
      ],
      order: [['payment_date', 'DESC']]
    });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer payment summary (outstanding dues)
router.get('/customer/dues', roleAuth(['vendor', 'admin']), async (req, res) => {
  try {
    // Get all customers with pending cash payments
    const customers = await User.findAll({
      where: { role: 'customer' },
      attributes: [
        'user_id', 
        'full_name', 
        'email'
      ],
      include: {
        model: Order,
        include: {
          model: Payment,
          where: { 
            payment_method: 'Cash',
            status: 'pending'
          },
          required: false
        },
        required: false
      }
    });

    // Process data to calculate total dues per customer
    const customerDues = customers.map(customer => {
      let totalDue = 0;
      let totalPaid = 0;
      let lastPaymentDate = null;

      // Calculate dues from pending payments
      if (customer.Orders && customer.Orders.length > 0) {
        customer.Orders.forEach(order => {
          if (order.Payment && order.Payment.status === 'pending') {
            totalDue += Number(order.Payment.amount);
          } else if (order.Payment && order.Payment.status === 'successful') {
            totalPaid += Number(order.Payment.amount);
            
            // Track latest payment date
            const paymentDate = new Date(order.Payment.payment_date);
            if (!lastPaymentDate || paymentDate > lastPaymentDate) {
              lastPaymentDate = paymentDate;
            }
          }
        });
      }

      return {
        id: customer.user_id,
        name: customer.full_name,
        email: customer.email,
        total_due: totalDue,
        paid_amount: totalPaid,
        last_payment_date: lastPaymentDate
      };
    });

    // Filter to only return customers with outstanding dues or who have made payments
    const filteredDues = customerDues.filter(
      customer => customer.total_due > 0 || customer.paid_amount > 0
    );

    res.json(filteredDues);
  } catch (error) {
    console.error('Error fetching customer dues:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
