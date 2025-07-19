# Food Order Tracking System - Backend Structure

## Backend Organization

The backend for the food order tracking system is built using Node.js with Express. It follows a structured approach with the following components:

### Core Components
- **Server**: Main entry point that configures middleware and routes
- **Routes**: API endpoints organized by functionality 
- **Models**: Sequelize models defining database schema
- **Middleware**: Authentication and role-based access control
- **Config**: Database connection and environment configuration

### API Routes

#### Authentication
- `/api/auth` - User authentication (login, signup, token refresh)

#### Customer-Facing Routes
- `/api/menu` - Public menu browsing
- `/api/cart` - Shopping cart operations
- `/api/orders` - Customer order management
- `/api/profile` - User profile management
- `/api/payments` - Payment processing

#### Vendor-Facing Routes
- `/api/vendor/menu` - Menu management for vendors
- `/api/vendor/orders` - Order processing for vendors
- `/api/inventory` - Inventory management
- `/api/analytics` - Business insights and reporting

### Role-Based Access Control

The system implements role-based access control with three user types:
- **Customer**: Regular users who place food orders
- **Vendor**: Food service staff who manage menu, inventory and fulfill orders
- **Admin**: System administrators with full access

### Database Models

1. **User**
   - User accounts with authentication and role information
   - Fields: user_id, full_name, email, password_hash, role, created_at

2. **MenuItem**
   - Food items available for ordering
   - Fields: item_id, name, description, price, category, image_url, is_available

3. **DailyInventory**
   - Daily stock levels for menu items
   - Fields: inventory_id, inventory_date, quantity_initial, quantity_remaining

4. **Order**
   - Customer orders with status tracking
   - Fields: order_id, order_date, total_amount, status, pickup_slot

5. **OrderItem**
   - Individual items within an order
   - Fields: order_item_id, quantity, price_at_order

6. **Payment**
   - Payment records for orders
   - Fields: payment_id, payment_date, amount, payment_method, status

### Feature Implementation Details

#### Analytics System
The analytics system provides vendors with critical business insights:
- Dashboard statistics (daily sales, order counts, popular items)
- Sales trends by time period (hourly, daily, weekly, monthly)
- Item popularity analysis with revenue breakdowns
- Peak ordering times to optimize staffing and inventory

#### Inventory Management
The inventory system tracks item availability:
- Daily stock initialization and updates
- Real-time quantity tracking
- Out-of-stock detection
- Historical inventory analysis

#### Order Processing
The order workflow includes:
- Order placement
- Status tracking (placed → preparing → ready → completed)
- Pickup time management
- Payment status integration

#### Menu Management
Vendors can:
- Create, update, and delete menu items
- Manage item availability
- Organize items by category
- Update pricing and descriptions

## API Documentation

### Analytics API

#### GET /api/analytics/dashboard
- **Access**: Vendor, Admin
- **Description**: Get key dashboard metrics
- **Returns**: Total sales, order counts, pending orders, popular items, hourly/daily sales

#### GET /api/analytics/sales
- **Access**: Vendor, Admin
- **Description**: Get detailed sales data with filtering
- **Parameters**: startDate, endDate, groupBy (hour, day, week, month)
- **Returns**: Time-based sales data with summary statistics

#### GET /api/analytics/popular-items
- **Access**: Vendor, Admin
- **Description**: Get most popular menu items
- **Parameters**: startDate, endDate, limit, category
- **Returns**: List of items with quantity sold and revenue

#### GET /api/analytics/peak-times
- **Access**: Vendor, Admin
- **Description**: Get busiest ordering times
- **Parameters**: startDate, endDate
- **Returns**: Orders grouped by hour of day and day of week

### Payments API

#### GET /api/payments
- **Access**: Authorized users (role-specific filtering)
- **Description**: Get payment records for orders
- **Returns**: List of payment transactions

#### GET /api/payments/:id
- **Access**: Authorized users
- **Description**: Get details of a specific payment
- **Returns**: Payment record with order details

#### POST /api/payments
- **Access**: Customers
- **Description**: Create a new payment
- **Body**: payment_method, amount, order_id
- **Returns**: New payment record

#### PATCH /api/payments/:id
- **Access**: Vendor, Admin
- **Description**: Update payment status
- **Body**: status
- **Returns**: Updated payment record

### Profile API

#### GET /api/profile
- **Access**: Authenticated users
- **Description**: Get current user profile
- **Returns**: User profile information

#### PATCH /api/profile
- **Access**: Authenticated users
- **Description**: Update user profile
- **Body**: full_name, email
- **Returns**: Updated user profile

#### PATCH /api/profile/password
- **Access**: Authenticated users
- **Description**: Change user password
- **Body**: currentPassword, newPassword
- **Returns**: Success message
