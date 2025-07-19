'use client'

// Using native date formatting instead of date-fns
import Link from 'next/link'

interface OrderItem {
  quantity: number
  unit_price: number
  menuItem: {
    name: string
  }
}

interface OrderCardProps {
  orderId: string
  status: string
  totalAmount: number
  createdAt: string
  items: OrderItem[]
  onCancel?: () => void
}

export default function OrderCard({
  orderId,
  status,
  totalAmount,
  createdAt,
  items,
  onCancel,
}: OrderCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const formattedDate = new Date(createdAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Order #{orderId.slice(-6)}
          </h3>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
            statusColors[status as keyof typeof statusColors]
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900">Items</h4>
        <ul className="mt-2 divide-y divide-gray-200">
          {items.map((item, index) => (
            <li key={index} className="py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {item.quantity}x {item.menuItem.name}
                </span>
                <span className="text-sm text-gray-900">
                  ₹{item.quantity * item.unit_price}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between pt-4 border-t">
        <span className="text-base font-medium text-gray-900">Total</span>
        <span className="text-lg font-medium text-gray-900">₹{totalAmount}</span>
      </div>

      <div className="mt-6 flex items-center justify-between space-x-4">
        <Link
          href={`/orders/${orderId}`}
          className="flex-1 text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          View Details
        </Link>
        {status === 'pending' && onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  )
}
