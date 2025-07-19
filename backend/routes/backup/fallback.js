const express = require('express');
const router = express.Router();
const { mockData } = require('../config/database');

// Mock user data
const mockUsers = [
  { id: 'cust1', email: 'customer@example.com', full_name: 'Test Customer', role: 'customer', password: 'password' },
  { id: 'vend1', email: 'vendor@example.com', full_name: 'Test Vendor', role: 'vendor', password: 'password' },
  { id: 'adm1', email: 'admin@example.com', full_name: 'Test Admin', role: 'admin', password: 'password' }
];

// Mock menu items
const mockMenuItems = [
  { id: '1', name: 'Burger', price: 8.99, description: 'Delicious beef burger', category: 'Main', vendorId: 'vend1' },
  { id: '2', name: 'Pizza', price: 11.99, description: 'Margherita pizza', category: 'Main', vendorId: 'vend1' },
  { id: '3', name: 'Fries', price: 3.99, description: 'Crispy french fries', category: 'Side', vendorId: 'vend1' },
  { id: '4', name: 'Salad', price: 6.99, description: 'Fresh garden salad', category: 'Side', vendorId: 'vend1' },
  { id: '5', name: 'Soda', price: 1.99, description: 'Refreshing cola', category: 'Drink', vendorId: 'vend1' }
];

// Mock orders
const mockOrders = [
  {
    id: 'order1',
    customerId: 'cust1',
    vendorId: 'vend1',
    items: [
      { menuItemId: '1', quantity: 2, price: 8.99 },
      { menuItemId: '3', quantity: 1, price: 3.99 }
    ],
    status: 'delivered',
    totalAmount: 21.97,
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 'order2',
    customerId: 'cust1',
    vendorId: 'vend1',
    items: [
      { menuItemId: '2', quantity: 1, price: 11.99 },
      { menuItemId: '5', quantity: 2, price: 1.99 }
    ],
    status: 'in-progress',
    totalAmount: 15.97,
    createdAt: new Date().toISOString() // now
  }
];

// Initialize mock data
mockData.users = mockUsers;
mockData.menuItems = mockMenuItems;
mockData.orders = mockOrders;

// Authentication middleware for mock mode
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Mock token validation
  const role = token === 'mock-token-customer' ? 'customer' : 
               token === 'mock-token-vendor' ? 'vendor' : 
               token === 'mock-token-admin' ? 'admin' : null;
  
  if (!role) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // Add user info to request
  req.user = mockUsers.find(user => user.role === role);
  next();
};

// Setup fallback routes
const setupFallbackRoutes = (app) => {
  console.log('Setting up fallback routes for development');
  
  // Authentication routes
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      const tokenSuffix = user.role === 'customer' ? 'customer' : 
                          user.role === 'vendor' ? 'vendor' : 'admin';
      res.json({
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        token: `mock-token-${tokenSuffix}`
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
  
  // Menu routes
  app.get('/api/menu', (req, res) => {
    res.json({ items: mockMenuItems });
  });
  
  // Vendor menu routes
  app.get('/api/vendor/menu', authMiddleware, (req, res) => {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const vendorMenuItems = mockMenuItems.filter(item => item.vendorId === req.user.id);
    res.json({ items: vendorMenuItems });
  });
  
  app.post('/api/vendor/menu', authMiddleware, (req, res) => {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const newItem = {
      id: `${mockMenuItems.length + 1}`,
      ...req.body,
      vendorId: req.user.id
    };
    
    mockMenuItems.push(newItem);
    res.status(201).json(newItem);
  });
  
  // Order routes
  app.get('/api/orders', authMiddleware, (req, res) => {
    let orders;
    if (req.user.role === 'customer') {
      orders = mockOrders.filter(order => order.customerId === req.user.id);
    } else if (req.user.role === 'vendor') {
      orders = mockOrders.filter(order => order.vendorId === req.user.id);
    } else {
      orders = mockOrders;
    }
    
    res.json({ orders });
  });
  
  app.post('/api/orders', authMiddleware, (req, res) => {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const newOrder = {
      id: `order${mockOrders.length + 1}`,
      customerId: req.user.id,
      vendorId: 'vend1', // Default to the mock vendor
      items: req.body.items,
      status: 'pending',
      totalAmount: req.body.totalAmount,
      createdAt: new Date().toISOString()
    };
    
    mockOrders.push(newOrder);
    res.status(201).json(newOrder);
  });
  
  // Catch-all for other API routes in development
  app.use('/api/*', (req, res) => {
    console.log(`Fallback route handler for: ${req.method} ${req.originalUrl}`);
    res.status(200).json({ 
      message: 'Mock API response',
      endpoint: req.originalUrl,
      method: req.method,
      mockMode: true
    });
  });
};

module.exports = { setupFallbackRoutes };
