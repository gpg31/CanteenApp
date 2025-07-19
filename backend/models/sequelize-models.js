const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('customer', 'vendor', 'admin'),
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profile_picture_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const MenuItem = sequelize.define('MenuItem', {
  item_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50)
  },
  image_url: {
    type: DataTypes.STRING(255)
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

const DailyInventory = sequelize.define('DailyInventory', {
  inventory_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  inventory_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  quantity_initial: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_remaining: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

const Order = sequelize.define('Order', {
  order_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('placed', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'),
    defaultValue: 'placed'
  },
  pickup_slot: {
    type: DataTypes.TIME,
    allowNull: false
  }
});

const OrderItem = sequelize.define('OrderItem', {
  order_item_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price_at_order: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

const Payment = sequelize.define('Payment', {
  payment_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('UPI', 'Cash'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'successful', 'failed'),
    allowNull: false
  }
});

// Relationships
MenuItem.hasMany(DailyInventory);
DailyInventory.belongsTo(MenuItem);

User.hasMany(Order);
Order.belongsTo(User);

Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);

MenuItem.hasMany(OrderItem);
OrderItem.belongsTo(MenuItem);

Order.hasOne(Payment);
Payment.belongsTo(Order);

module.exports = {
  User,
  MenuItem,
  DailyInventory,
  Order,
  OrderItem,
  Payment
};
