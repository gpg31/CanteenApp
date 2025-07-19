'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Image from 'next/image'

interface InventoryItem {
  id: string
  name: string
  category: string
  image_url: string
  price: number
  quantity_initial: number
  quantity_remaining: number
  updated_at: string
}

export default function InventoryManagement() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState(['All', 'Main Course', 'Snacks', 'Beverages', 'Desserts'])
  const [bulkMode, setBulkMode] = useState(false)

  useEffect(() => {
    if (!token || user?.role !== 'vendor') {
      router.push('/login')
      return
    }

    // Simulate API fetch with mock data
    setTimeout(() => {
      setInventoryItems([
        {
          id: '1',
          name: 'Masala Dosa',
          category: 'Main Course',
          image_url: 'https://source.unsplash.com/random/300x200/?dosa',
          price: 100,
          quantity_initial: 30,
          quantity_remaining: 15,
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Chole Bhature',
          category: 'Main Course',
          image_url: 'https://source.unsplash.com/random/300x200/?curry',
          price: 120,
          quantity_initial: 25,
          quantity_remaining: 10,
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Vada Pav',
          category: 'Snacks',
          image_url: 'https://source.unsplash.com/random/300x200/?sandwich',
          price: 50,
          quantity_initial: 40,
          quantity_remaining: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Samosa',
          category: 'Snacks',
          image_url: 'https://source.unsplash.com/random/300x200/?samosa',
          price: 40,
          quantity_initial: 60,
          quantity_remaining: 25,
          updated_at: new Date().toISOString(),
        },
        {
          id: '5',
          name: 'Mango Lassi',
          category: 'Beverages',
          image_url: 'https://source.unsplash.com/random/300x200/?lassi',
          price: 80,
          quantity_initial: 30,
          quantity_remaining: 12,
          updated_at: new Date().toISOString(),
        },
      ])
      setIsLoading(false)
    }, 1000)
  }, [router, token, user])

  const handleQuantityChange = (id: string, type: 'initial' | 'remaining', value: number) => {
    setInventoryItems(
      inventoryItems.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [type === 'initial' ? 'quantity_initial' : 'quantity_remaining']: Math.max(0, value),
            updated_at: new Date().toISOString(),
          }
        }
        return item
      })
    )
  }

  const handleSaveAll = async () => {
    // In a real app, you would make an API call here
    alert('All inventory changes saved successfully!')
  }

  const handleBulkUpdate = (percentage: number) => {
    setInventoryItems(
      inventoryItems.map((item) => {
        const newQuantity = Math.round(item.quantity_initial * (percentage / 100))
        return {
          ...item,
          quantity_initial: newQuantity,
          quantity_remaining: newQuantity,
          updated_at: new Date().toISOString(),
        }
      })
    )
  }

  const filteredItems = inventoryItems
    .filter((item) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) => 
      selectedCategory === '' || selectedCategory === 'All' || item.category === selectedCategory
    )

  const getStatusColor = (initial: number, remaining: number) => {
    const percentage = (remaining / initial) * 100
    if (percentage === 0) return 'bg-red-500'
    if (percentage <= 20) return 'bg-orange-500'
    if (percentage <= 50) return 'bg-yellow-500'
    return 'bg-green-500'
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
        <p className="mt-2 text-sm text-gray-500">
          Set the initial quantity for each item at the start of the day and update remaining quantities as items are sold.
        </p>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
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
                placeholder="Search items..."
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-64 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="category" className="sr-only">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-48 sm:text-sm border-gray-300 rounded-md"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                bulkMode
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Bulk Update
            </button>
            <button
              onClick={handleSaveAll}
              className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save All Changes
            </button>
          </div>
        </div>

        {/* Bulk Update Controls */}
        {bulkMode && (
          <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Bulk Update Inventory</h3>
            <div className="flex flex-wrap gap-2">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleBulkUpdate(percent)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Set {percent}%
                </button>
              ))}
              <button
                onClick={() => handleBulkUpdate(0)}
                className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md bg-white text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Set All to 0
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Initial Qty
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remaining
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <Image
                        className="h-10 w-10 rounded-full object-cover"
                        src={item.image_url}
                        alt={item.name}
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{item.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  ₹{item.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <input
                    type="number"
                    min="0"
                    value={item.quantity_initial}
                    onChange={(e) => 
                      handleQuantityChange(item.id, 'initial', parseInt(e.target.value, 10))
                    }
                    className="w-16 text-sm text-right border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <input
                    type="number"
                    min="0"
                    max={item.quantity_initial}
                    value={item.quantity_remaining}
                    onChange={(e) => 
                      handleQuantityChange(item.id, 'remaining', parseInt(e.target.value, 10))
                    }
                    className={`w-16 text-sm text-right border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      item.quantity_remaining === 0 ? 'text-red-600 font-semibold' : ''
                    }`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    <div className={`h-2.5 w-2.5 rounded-full mr-2 ${getStatusColor(item.quantity_initial, item.quantity_remaining)}`}></div>
                    <span className="text-xs">
                      {item.quantity_remaining === 0
                        ? 'Sold Out'
                        : `${Math.round((item.quantity_remaining / item.quantity_initial) * 100)}% left`}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
