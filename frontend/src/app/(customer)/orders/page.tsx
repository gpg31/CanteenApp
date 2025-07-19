'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OrderCard from '@/components/order/OrderCard'
import { useAuthStore } from '@/store/useAuthStore'

interface OrderItem {
  quantity: number
  unit_price: number
  menuItem: {
    item_id: string
    name: string
    image_url: string
  }
}

interface Order {
  order_id: string
  status: string
  total_amount: number
  created_at: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect if not authenticated
    if (!token) {
      router.push('/login')
      return
    }
    
    // Mock orders data
    const mockOrders = [
      {
        order_id: '1234',
        status: 'pending',
        total_amount: 597,
        created_at: new Date().toISOString(),
        items: [
          {
            quantity: 2,
            unit_price: 249,
            menuItem: {
              item_id: '1',
              name: 'Margherita Pizza',
              image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            }
          },
          {
            quantity: 1,
            unit_price: 99,
            menuItem: {
              item_id: '3',
              name: 'Chocolate Shake',
              image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            }
          }
        ]
      },
      {
        order_id: '1235',
        status: 'completed',
        total_amount: 357,
        created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        items: [
          {
            quantity: 1,
            unit_price: 199,
            menuItem: {
              item_id: '2',
              name: 'Chicken Burger',
              image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            }
          },
          {
            quantity: 2,
            unit_price: 79,
            menuItem: {
              item_id: '4',
              name: 'French Fries',
              image_url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            }
          }
        ]
      }
    ];
    
    setOrders(mockOrders);
    setLoading(false);
  }, [token, router])

  const handleCancelOrder = async (orderId: string) => {
    try {
      // Update the order status locally
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.order_id === orderId 
            ? { ...order, status: 'cancelled' as const }
            : order
        )
      );
      
      // Show success message
      alert('Order cancelled successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <button
          onClick={() => router.push('/menu')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Order More
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">No orders yet</h2>
          <p className="mt-2 text-gray-600">Start ordering your favorite food!</p>
          <button
            onClick={() => router.push('/menu')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <OrderCard
              key={order.order_id}
              orderId={order.order_id}
              status={order.status}
              totalAmount={order.total_amount}
              createdAt={order.created_at}
              items={order.items}
              onCancel={
                order.status === 'pending'
                  ? () => handleCancelOrder(order.order_id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
