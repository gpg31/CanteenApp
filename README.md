# Food Order Tracking System

This project is a full-stack food order tracking system with separate frontend and backend components.

## Project Structure

The project is organized into two main directories:

- `frontend/`: Next.js application with TypeScript and Tailwind CSS
- `backend/`: Node.js Express server with PostgreSQL database

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL database
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following variables:

```
PORT=3001
DATABASE_URL=postgres://username:password@localhost:5432/food_order_db
JWT_SECRET=your_secret_key
```

Initialize the database:

```bash
# Create the database in PostgreSQL
createdb food_order_db

# Run migrations (if available)
npm run migrate
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the frontend directory:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Running the Application

You can run both frontend and backend simultaneously using:

```bash
cd backend
npm run full-dev
```

Or run them separately:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The backend will run on http://localhost:3001 and the frontend on http://localhost:3000.

## Features

### Customer Features
- Browse menu items
- Add items to cart
- Place orders
- View order history
- Manage profile

### Vendor Features
- Dashboard with sales analytics
- Menu management
- Inventory management
- Order processing
- Payment tracking

### Authentication
- Role-based access (customer, vendor, admin)
- JWT token authentication

## API Documentation

The backend API documentation is available in the `BACKEND_STRUCTURE.md` file in the backend directory.

## Technologies Used

### Frontend
- Next.js with App Router
- TypeScript
- Tailwind CSS
- Zustand for state management

### Backend
- Node.js with Express
- PostgreSQL with Sequelize ORM
- JSON Web Tokens for authentication

## Contributors

- Your Name
