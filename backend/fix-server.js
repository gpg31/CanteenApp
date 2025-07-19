const fs = require('fs');
const path = require('path');

const serverContent = `const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, testConnection } = require('./config/database');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/order'));

// Vendor specific routes
app.use('/api/vendor/menu', require('./routes/vendor-menu'));
app.use('/api/vendor/orders', require('./routes/vendor-orders'));
app.use('/api/inventory', require('./routes/inventory'));

// Additional routes
app.use('/api/profile', require('./routes/profile'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/analytics', require('./routes/analytics'));

const PORT = process.env.PORT || 3005;

async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    // Sync models with database
    await sequelize.sync();
    console.log('Database models synchronized successfully.');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(\`Server is running on port \${PORT}\`);
    });
  } catch (error) {
    console.error('Database connection or sync error:', error);
    process.exit(1); // Exit if database connection fails
  }
}

startServer();`;

const serverPath = path.join(__dirname, 'server.js');
fs.writeFileSync(serverPath, serverContent);

console.log('server.js file has been updated successfully.');
