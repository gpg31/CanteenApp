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
  customer_id: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  order_time: string
  pickup_time: string
  total_amount: number
  items: OrderItem[]
}

export default function VendorOrders() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!token || user?.role !== 'vendor') {
      router.push('/login')
      return
    }

    // Simulate API fetch with mock data
    setTimeout(() => {
      const mockOrders: Order[] = [
        {
          id: 'ORD-001',
          customer_name: 'Rahul Sharma',
          customer_id: 'cust-1',
          status: 'placed',
          payment_status: 'successful',
          payment_method: 'upi',
          order_time: '2025-07-18T09:30:00',
          pickup_time: '2025-07-18T12:30:00',
          total_amount: 160,
          items: [
            { id: '1', name: 'Masala Dosa', quantity: 1, price: 100 },
            { id: '4', name: 'Samosa', quantity: 1, price: 40 },
            { id: '5', name: 'Mango Lassi', quantity: 1, price: 20 },
          ],
        },
        {
          id: 'ORD-002',
          customer_name: 'Priya Patel',
          customer_id: 'cust-2',
          status: 'preparing',
          payment_status: 'successful',
          payment_method: 'upi',
          order_time: '2025-07-18T09:45:00',
          pickup_time: '2025-07-18T12:15:00',
          total_amount: 210,
          items: [
            { id: '2', name: 'Chole Bhature', quantity: 1, price: 120 },
            { id: '3', name: 'Vada Pav', quantity: 1, price: 50 },
            { id: '5', name: 'Mango Lassi', quantity: 1, price: 40 },
          ],
        },
        {
          id: 'ORD-003',
          customer_name: 'Amit Singh',
          customer_id: 'cust-3',
          status: 'ready_for_pickup',
          payment_status: 'pending',
          payment_method: 'cash',
          order_time: '2025-07-18T10:00:00',
          pickup_time: '2025-07-18T12:00:00',
          total_amount: 140,
          items: [
            { id: '3', name: 'Vada Pav', quantity: 2, price: 100 },
            { id: '5', name: 'Mango Lassi', quantity: 1, price: 40 },
          ],
        },
        {
          id: 'ORD-004',
          customer_name: 'Sneha Gupta',
          customer_id: 'cust-4',
          status: 'completed',
          payment_status: 'successful',
          payment_method: 'cash',
          order_time: '2025-07-18T08:30:00',
          pickup_time: '2025-07-18T11:00:00',
          total_amount: 220,
          items: [
            { id: '1', name: 'Masala Dosa', quantity: 2, price: 200 },
            { id: '4', name: 'Samosa', quantity: 1, price: 20 },
          ],
        },
        {
          id: 'ORD-005',
          customer_name: 'Vikram Mehta',
          customer_id: 'cust-5',
          status: 'completed',
          payment_status: 'successful',
          payment_method: 'upi',
          order_time: '2025-07-18T09:00:00',
          pickup_time: '2025-07-18T11:15:00',
          total_amount: 340,
          items: [
            { id: '2', name: 'Chole Bhature', quantity: 2, price: 240 },
            { id: '3', name: 'Vada Pav', quantity: 2, price: 100 },
          ],
        },
      ]

      setOrders(mockOrders)
      setIsLoading(false)
    }, 1000)
  }, [router, token, user])

  const activeOrders = orders.filter(
    (order) => ['placed', 'preparing', 'ready_for_pickup'].includes(order.status)
  )
  
  const completedOrders = orders.filter(
    (order) => ['completed', 'cancelled'].includes(order.status)
  )

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    )
    setOrders(updatedOrders)
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    }
  }

  const handlePaymentUpdate = (orderId: string) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, payment_status: 'successful' as PaymentStatus } : order
    )
    setOrders(updatedOrders)
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, payment_status: 'successful' as PaymentStatus })
    }
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const formatDateTime = (dateTimeStr: string) => {
    const dateTime = new Date(dateTimeStr)
    return dateTime.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-100 text-blue-800'
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800'
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'successful':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderOrdersTable = (orders: Order[]) => {
    if (orders.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500">No orders found</p>
        </div>
      )
    }

    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pickup Time
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openOrderDetails(order)}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{order.id}</div>
                <div className="text-xs text-gray-500">
                  {new Date(order.order_time).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{order.customer_name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                      order.payment_status
                    )}`}
                  >
                    {order.payment_status}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">{order.payment_method}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDateTime(order.pickup_time)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                ₹{order.total_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openOrderDetails(order)
                  }}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Manage Orders</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            className={`${
              activeTab === 'active'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('active')}
          >
            Active Orders ({activeOrders.length})
          </button>
          <button
            className={`${
              activeTab === 'completed'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('completed')}
          >
            Completed Orders ({completedOrders.length})
          </button>
        </nav>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {activeTab === 'active' ? renderOrdersTable(activeOrders) : renderOrdersTable(completedOrders)}
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Order Details - {selectedOrder.id}
                      </h3>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-4 space-y-6">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="text-sm font-medium">{selectedOrder.customer_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Pickup Time</p>
                          <p className="text-sm font-medium">{formatDateTime(selectedOrder.pickup_time)}</p>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Order Status</p>
                          <span
                            className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              selectedOrder.status
                            )}`}
                          >
                            {selectedOrder.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Payment Status</p>
                          <div className="mt-1 flex justify-end items-center">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                                selectedOrder.payment_status
                              )}`}
                            >
                              {selectedOrder.payment_status}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">{selectedOrder.payment_method}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items</h4>
                        <div className="border rounded-md">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Item
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Qty
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Price
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedOrder.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">{item.quantity}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">₹{item.price}</td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50">
                                <td className="px-4 py-2 text-sm font-medium text-gray-900" colSpan={2}>
                                  Total
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                  ₹{selectedOrder.total_amount}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {/* Status Update Buttons */}
                {selectedOrder.status === 'placed' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'preparing')}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Start Preparing
                  </button>
                )}

                {selectedOrder.status === 'preparing' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'ready_for_pickup')}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Mark Ready
                  </button>
                )}

                {selectedOrder.status === 'ready_for_pickup' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'completed')}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Mark Completed
                  </button>
                )}

                {selectedOrder.payment_status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handlePaymentUpdate(selectedOrder.id)}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Record Payment
                  </button>
                )}

                {['placed', 'preparing', 'ready_for_pickup'].includes(selectedOrder.status) && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')}
                    className="ml-3 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel Order
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
