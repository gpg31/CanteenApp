'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

type OrderStatus = 'placed' | 'preparing' | 'ready_for_pickup' | 'completed' | 'cancelled'
type PaymentStatus = 'pending' | 'successful' | 'failed'
type PaymentMethod = 'upi' | 'cash'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  customer_name: string
  items: OrderItem[]
  total_amount: number
  order_status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  created_at: string
  updated_at: string
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  // Function to format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Function to update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      // Update the orders list with the new status
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, order_status: newStatus }
          : order
      ))
    } catch (error) {
      setError('Failed to update order status')
      console.error('Error updating order status:', error)
    }
  }

  // Function to fetch orders
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data)
    } catch (error) {
      setError('Failed to fetch orders')
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Authentication check effect
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'vendor') {
      router.push('/auth/login')
    }
  }, [isAuthenticated, user, router])

  // Fetch orders effect
  useEffect(() => {
    if (isAuthenticated && user?.role === 'vendor') {
      fetchOrders()
    }
  }, [isAuthenticated, user])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">
          {error}
          <button
            onClick={fetchOrders}
            className="ml-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Order Management</h1>
      
      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div
            key={order.id}
            className="bg-white rounded-lg shadow-md p-6 space-y-4"
          >
            {/* Order Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                <p className="text-gray-600">{order.customer_name}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                order.payment_status === 'successful'
                  ? 'bg-green-100 text-green-800'
                  : order.payment_status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2">
              <h4 className="font-medium">Items:</h4>
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order Status */}
            <div className="space-y-2">
              <h4 className="font-medium">Status:</h4>
              <select
                value={order.order_status}
                onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                className={`w-full p-2 rounded border ${
                  order.order_status === 'placed'
                    ? 'border-blue-300 bg-blue-50'
                    : order.order_status === 'preparing'
                    ? 'border-yellow-300 bg-yellow-50'
                    : order.order_status === 'ready_for_pickup'
                    ? 'border-purple-300 bg-purple-50'
                    : order.order_status === 'completed'
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                }`}
              >
                <option value="placed">Placed</option>
                <option value="preparing">Preparing</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Order Details */}
            <div className="text-sm text-gray-500 space-y-1">
              <p>Payment Method: {order.payment_method.toUpperCase()}</p>
              <p>Created: {formatDate(order.created_at)}</p>
              <p>Last Updated: {formatDate(order.updated_at)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* No Orders Message */}
      {orders.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No orders found.
        </div>
      )}
    </div>
  )
}
