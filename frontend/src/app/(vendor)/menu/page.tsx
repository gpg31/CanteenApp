'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Image from 'next/image'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  is_available: boolean
}

export default function MenuManagement() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    is_available: true,
  })
  const [categories, setCategories] = useState(['Main Course', 'Snacks', 'Beverages', 'Desserts'])

  useEffect(() => {
    if (!token || user?.role !== 'vendor') {
      router.push('/login')
      return
    }

    // Simulate API fetch with mock data
    setTimeout(() => {
      setMenuItems([
        {
          id: '1',
          name: 'Masala Dosa',
          description: 'South Indian crepe filled with spiced potatoes',
          price: 100,
          category: 'Main Course',
          image_url: 'https://source.unsplash.com/random/300x200/?dosa',
          is_available: true,
        },
        {
          id: '2',
          name: 'Chole Bhature',
          description: 'Spicy chickpea curry served with fried bread',
          price: 120,
          category: 'Main Course',
          image_url: 'https://source.unsplash.com/random/300x200/?curry',
          is_available: true,
        },
        {
          id: '3',
          name: 'Vada Pav',
          description: 'Spicy potato fritter in a bun',
          price: 50,
          category: 'Snacks',
          image_url: 'https://source.unsplash.com/random/300x200/?sandwich',
          is_available: false,
        },
        {
          id: '4',
          name: 'Samosa',
          description: 'Crispy pastry filled with spiced potatoes and peas',
          price: 40,
          category: 'Snacks',
          image_url: 'https://source.unsplash.com/random/300x200/?samosa',
          is_available: true,
        },
      ])
      setIsLoading(false)
    }, 1000)
  }, [router, token, user])

  const openAddModal = () => {
    setCurrentItem(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Main Course',
      image_url: '',
      is_available: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: MenuItem) => {
    setCurrentItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image_url: item.image_url,
      is_available: item.is_available,
    })
    setIsModalOpen(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      is_available: e.target.checked,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      alert('Please fill in all required fields')
      return
    }

    const itemData = {
      ...formData,
      price: parseFloat(formData.price),
    }

    try {
      if (currentItem) {
        // Update existing item
        // In a real app, you would make an API call here
        setMenuItems(menuItems.map(item => 
          item.id === currentItem.id ? { ...item, ...itemData } : item
        ))
      } else {
        // Create new item
        // In a real app, you would make an API call here
        const newItem = {
          id: Date.now().toString(),
          ...itemData,
          image_url: formData.image_url || 'https://source.unsplash.com/random/300x200/?food',
        }
        setMenuItems([...menuItems, newItem as MenuItem])
      }
      
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving menu item:', error)
      alert('Failed to save menu item')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    
    try {
      // In a real app, you would make an API call here
      setMenuItems(menuItems.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert('Failed to delete menu item')
    }
  }

  const toggleAvailability = async (id: string, newStatus: boolean) => {
    try {
      // In a real app, you would make an API call here
      setMenuItems(menuItems.map(item => 
        item.id === id ? { ...item, is_available: newStatus } : item
      ))
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Failed to update availability')
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Menu Management</h1>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Item
        </button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white overflow-hidden shadow rounded-lg ${
              !item.is_available ? 'opacity-60' : ''
            }`}
          >
            <div className="relative h-48 w-full">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                <span className="text-lg font-semibold text-indigo-600">₹{item.price}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {item.category}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id={`available-${item.id}`}
                    name="is_available"
                    type="checkbox"
                    checked={item.is_available}
                    onChange={() => toggleAvailability(item.id, !item.is_available)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`available-${item.id}`} className="ml-2 block text-sm text-gray-900">
                    Available
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {currentItem ? 'Edit Menu Item' : 'Add Menu Item'}
                      </h3>
                      <div className="mt-2">
                        <div className="mb-4">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            name="description"
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            required
                          ></textarea>
                        </div>
                        <div className="mb-4 grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              name="price"
                              id="price"
                              min="0"
                              step="0.01"
                              value={formData.price}
                              onChange={handleChange}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                              Category
                            </label>
                            <select
                              name="category"
                              id="category"
                              value={formData.category}
                              onChange={handleChange}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              required
                            >
                              <option value="">Select a category</option>
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="mb-4">
                          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
                            Image URL
                          </label>
                          <input
                            type="text"
                            name="image_url"
                            id="image_url"
                            value={formData.image_url}
                            onChange={handleChange}
                            placeholder="Leave blank for default image"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="mb-4">
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="is_available"
                                name="is_available"
                                type="checkbox"
                                checked={formData.is_available}
                                onChange={handleCheckboxChange}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="is_available" className="font-medium text-gray-700">
                                Available
                              </label>
                              <p className="text-gray-500">Mark this item as available on the menu</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {currentItem ? 'Save Changes' : 'Add Item'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
