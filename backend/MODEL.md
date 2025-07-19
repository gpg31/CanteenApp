System Functionality Breakdown
This document outlines the core features and capabilities of the food ordering system, categorized by user role.

1. Customer Features (Student/Faculty)
The primary goal for the customer is a seamless and fast ordering experience.

Authentication & Profile:

Sign Up: Create a new account with a name, email, and password.

Log In / Log Out: Securely access their account.

View Profile: See their own details.

Ordering Process:

View Menu: Browse all available food items, filterable by categories (e.g., "Main Course", "Snacks"). Each item will display its name, price, description, and image.

See Real-time Inventory: Crucially, customers will see the quantity_remaining for each item for that day, preventing them from ordering food that has run out.

Add to Cart: Select items and quantities to add to a shopping cart.

Place Pre-Order: Proceed to checkout, where they must:

Select a pickup time slot (e.g., 12:30 PM, 12:45 PM, 1:00 PM) to manage the rush.

Choose a payment method: UPI or Cash.

Checkout:

If UPI is chosen, they would be shown a QR code or UPI ID to complete the payment. The system would wait for payment confirmation.

If Cash is chosen, the order is placed immediately, and a pending payment record (a "due") is created.

Order & Payment Management:

View Order History: See a list of all their past and current orders.

Track Order Status: Check the real-time status of an active order (placed, preparing, ready_for_pickup).

View Dues: A dedicated section to see the total outstanding amount from all unpaid cash orders.

2. Vendor Features (Chef/Canteen Staff)
The vendor needs tools to manage inventory, orders, and payments efficiently.

Authentication:

Log In: Securely access the vendor dashboard.

Menu & Inventory Management:

Manage Menu Items (CRUD): Add new food items, update prices and details, or remove items from the menu entirely.

Set Daily Inventory: The most important vendor function. At the start of the day, the vendor must set the quantity_initial for each item they plan to sell. This is the core of the pre-ordering system.

Order Fulfillment:

View Live Orders: See a real-time queue of incoming orders, sorted by pickup time.

Update Order Status: As they work, they will update an order's status:

Click a button to change status from placed -> preparing.

Click another button to change status from preparing -> ready_for_pickup. This could trigger a notification to the customer.

Payment & Dues Management:

View Payments: See a log of all transactions.

Settle Cash Dues: When a customer pays in cash for a pending order, the vendor finds the order and updates its payment status from pending -> successful. This clears the customer's due for that order.

Dashboard & Analytics:

View a simple dashboard showing total sales for the day, a list of sold-out items, and the number of pending vs. completed orders.

3. Admin Features
The admin has oversight over the entire system.

Full Access: An admin can do everything a vendor can do.

User Management (CRUD): Create, view, edit, or delete any user account (customer or vendor). This is useful for resetting passwords or managing access.

System-wide Analytics: View comprehensive reports on sales over time, most popular items, peak ordering times, etc.