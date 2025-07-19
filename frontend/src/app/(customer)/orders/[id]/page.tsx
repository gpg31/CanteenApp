'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
// Using native date formatting instead of date-fns
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

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { token } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect if not authenticated
    if (!token) {
      router.push('/login')
      return
    }
    
    if (params.id) {
      // Mock order data
      const mockOrder = {
        order_id: params.id as string,
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
      };
      
      setOrder(mockOrder);
    }
    
    setLoading(false);
  }, [params.id, token, router])

  const handleCancelOrder = async () => {
    try {
      // Update order status locally
      if (order) {
        setOrder({
          ...order,
          status: 'cancelled'
        });
      }
      
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

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error || 'Order not found'}</div>
      </div>
    )
  }

  const formattedDate = new Date(order.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Orders
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.order_id.slice(-6)}
              </h1>
              <p className="text-sm text-gray-500">{formattedDate}</p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                statusColors[order.status as keyof typeof statusColors]
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        <div className="px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 py-4 border-b last:border-0"
              >
                <div className="relative h-20 w-20 flex-shrink-0">
                  <Image
                    src={item.menuItem.image_url || '/placeholder-food.jpg'}
                    alt={item.menuItem.name}
                    className="w-full h-full object-cover rounded-md"
                    width={80}
                    height={80}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-900">
                    {item.menuItem.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity} × ₹{item.unit_price}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{item.quantity * item.unit_price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-900">Total</span>
            <span className="text-xl font-medium text-gray-900">
              ₹{order.total_amount}
            </span>
          </div>
          {order.status === 'pending' && (
            <button
              onClick={handleCancelOrder}
              className="mt-4 w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
