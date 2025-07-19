'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  soldOutItems: number
}

interface PopularItem {
  id: string
  name: string
  totalSold: number
  revenue: number
}

export default function VendorDashboard() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    soldOutItems: 0,
  })
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])

  useEffect(() => {
    if (!token || user?.role !== 'vendor') {
      router.push('/login')
      return
    }

    // Simulate API fetch with mock data
    setTimeout(() => {
      setStats({
        totalSales: 12580,
        totalOrders: 48,
        pendingOrders: 8,
        completedOrders: 40,
        soldOutItems: 3,
      })

      setPopularItems([
        {
          id: '1',
          name: 'Masala Dosa',
          totalSold: 15,
          revenue: 1500,
        },
        {
          id: '2',
          name: 'Chole Bhature',
          totalSold: 12,
          revenue: 1440,
        },
        {
          id: '3',
          name: 'Vada Pav',
          totalSold: 10,
          revenue: 500,
        },
        {
          id: '4',
          name: 'Samosa',
          totalSold: 8,
          revenue: 320,
        },
      ])

      setIsLoading(false)
    }, 1000)
  }, [router, token, user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Vendor Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">₹{stats.totalSales}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalOrders}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">{stats.pendingOrders}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Completed Orders</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.completedOrders}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Sold Out Items</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.soldOutItems}</dd>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => router.push('/vendor/orders')}
            className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5">
                <div className="text-lg font-medium text-gray-900">View Orders</div>
                <div className="mt-1 text-sm text-gray-500">Process pending orders</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/vendor/inventory')}
            className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="ml-5">
                <div className="text-lg font-medium text-gray-900">Update Inventory</div>
                <div className="mt-1 text-sm text-gray-500">Set today&apos;s available quantities</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/vendor/menu')}
            className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-5">
                <div className="text-lg font-medium text-gray-900">Manage Menu</div>
                <div className="mt-1 text-sm text-gray-500">Add or edit menu items</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Most Popular Items */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Popular Items Today</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {popularItems.map((item) => (
              <li key={item.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{item.name}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ₹{item.revenue}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Sold today: {item.totalSold} items
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
