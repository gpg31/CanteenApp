'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

type PaymentStatus = 'pending' | 'successful' | 'failed'
type PaymentMethod = 'upi' | 'cash'

interface Payment {
  id: string
  order_id: string
  customer_name: string
  customer_id: string
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  transaction_id?: string
  created_at: string
}

interface Customer {
  id: string
  name: string
  email: string
  total_due: number
  paid_amount: number
  last_payment_date: string
}

export default function VendorPayments() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'payments' | 'dues'>('payments')
  const [payments, setPayments] = useState<Payment[]>([])
  const [customerDues, setCustomerDues] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('today')

  useEffect(() => {
    if (!token || user?.role !== 'vendor') {
      router.push('/login')
      return
    }

    // Simulate API fetch with mock data
    setTimeout(() => {
      const mockPayments: Payment[] = [
        {
          id: 'PAY-001',
          order_id: 'ORD-001',
          customer_name: 'Rahul Sharma',
          customer_id: 'cust-1',
          amount: 160,
          payment_method: 'upi',
          status: 'successful',
          transaction_id: 'TXN-UPI-11122233',
          created_at: '2025-07-18T10:30:00',
        },
        {
          id: 'PAY-002',
          order_id: 'ORD-002',
          customer_name: 'Priya Patel',
          customer_id: 'cust-2',
          amount: 210,
          payment_method: 'upi',
          status: 'successful',
          transaction_id: 'TXN-UPI-22233344',
          created_at: '2025-07-18T10:46:00',
        },
        {
          id: 'PAY-003',
          order_id: 'ORD-004',
          customer_name: 'Sneha Gupta',
          customer_id: 'cust-4',
          amount: 220,
          payment_method: 'cash',
          status: 'successful',
          created_at: '2025-07-18T11:15:00',
        },
        {
          id: 'PAY-004',
          order_id: 'ORD-005',
          customer_name: 'Vikram Mehta',
          customer_id: 'cust-5',
          amount: 340,
          payment_method: 'upi',
          status: 'successful',
          transaction_id: 'TXN-UPI-33344455',
          created_at: '2025-07-18T11:20:00',
        },
        {
          id: 'PAY-005',
          order_id: 'ORD-003',
          customer_name: 'Amit Singh',
          customer_id: 'cust-3',
          amount: 140,
          payment_method: 'cash',
          status: 'pending',
          created_at: '2025-07-18T10:05:00',
        },
      ]

      const mockCustomerDues: Customer[] = [
        {
          id: 'cust-3',
          name: 'Amit Singh',
          email: 'amit@example.com',
          total_due: 140,
          paid_amount: 250,
          last_payment_date: '2025-07-15T14:30:00',
        },
        {
          id: 'cust-6',
          name: 'Deepak Verma',
          email: 'deepak@example.com',
          total_due: 80,
          paid_amount: 420,
          last_payment_date: '2025-07-16T12:15:00',
        },
        {
          id: 'cust-7',
          name: 'Kavita Patel',
          email: 'kavita@example.com',
          total_due: 200,
          paid_amount: 600,
          last_payment_date: '2025-07-17T10:45:00',
        },
      ]

      setPayments(mockPayments)
      setCustomerDues(mockCustomerDues)
      setIsLoading(false)
    }, 1000)
  }, [router, token, user])

  // Filter payments based on search term and date range
  const filteredPayments = payments.filter((payment) => {
    // Search filter
    const matchesSearch =
      payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.transaction_id && payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()))

    // Date filter
    const paymentDate = new Date(payment.created_at)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    let matchesDate = true
    if (dateRange === 'today') {
      matchesDate = paymentDate >= today
    } else if (dateRange === 'yesterday') {
      matchesDate = paymentDate >= yesterday && paymentDate < today
    } else if (dateRange === 'week') {
      matchesDate = paymentDate >= weekAgo
    } else if (dateRange === 'month') {
      matchesDate = paymentDate >= monthAgo
    }

    return matchesSearch && matchesDate
  })

  // Filter customer dues based on search term
  const filteredCustomerDues = customerDues.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleMarkAsPaid = (paymentId: string) => {
    setPayments(
      payments.map((payment) =>
        payment.id === paymentId
          ? { ...payment, status: 'successful' as PaymentStatus }
          : payment
      )
    )

    // In a real app, update customer dues as well
    // For demo, just show success message
    alert('Payment marked as successful!')
  }

  const handleSettleDue = (customerId: string) => {
    setCustomerDues(
      customerDues.map((customer) =>
        customer.id === customerId ? { ...customer, total_due: 0 } : customer
      )
    )

    // In a real app, create a new payment record
    // For demo, just show success message
    alert('Customer dues settled successfully!')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Payment Management</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            className={`${
              activeTab === 'payments'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('payments')}
          >
            Payment History
          </button>
          <button
            className={`${
              activeTab === 'dues'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('dues')}
          >
            Customer Dues ({customerDues.reduce((sum, customer) => sum + (customer.total_due > 0 ? 1 : 0), 0)})
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'payments' ? "Search by customer or order ID..." : "Search by customer name or email..."}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-64 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          {activeTab === 'payments' && (
            <div>
              <label htmlFor="dateRange" className="sr-only">
                Date Range
              </label>
              <select
                id="dateRange"
                name="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-48 sm:text-sm border-gray-300 rounded-md"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Payments Table */}
      {activeTab === 'payments' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No payments found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.id}</div>
                      {payment.transaction_id && (
                        <div className="text-xs text-gray-500">{payment.transaction_id}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.order_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{payment.payment_method}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'successful'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(payment.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">₹{payment.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => handleMarkAsPaid(payment.id)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={6} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                    ₹{filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Customer Dues Table */}
      {activeTab === 'dues' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredCustomerDues.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No customer dues found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomerDues.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">₹{customer.paid_amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${customer.total_due > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {customer.total_due > 0 ? `₹${customer.total_due}` : '₹0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(customer.last_payment_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {customer.total_due > 0 && (
                        <button
                          onClick={() => handleSettleDue(customer.id)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          Settle Due
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                    Total Outstanding
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-red-600">
                    ₹{filteredCustomerDues.reduce((sum, customer) => sum + customer.total_due, 0)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
