'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import menuService, { MenuItem, MenuCategory } from '@/services/menuService'
import Image from 'next/image'
import supabase from '@/lib/supabase'

interface FormData {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  is_available: boolean;
}

export default function MenuManagement() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true
  })
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'vendor') {
      router.push('/login')
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        const [itemsData, categoriesData] = await Promise.all([
          menuService.getAllItems(user.vendor_id),
          menuService.getCategories()
        ])
        setMenuItems(itemsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error('Error loading menu data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, user])

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!file || !user?.vendor_id) return null

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.vendor_id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      return filePath
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.vendor_id || !formData.name || !formData.description || !formData.price || !formData.category_id) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsLoading(true)

      let image_url = formData.image_url
      if (uploadedImage) {
        image_url = await handleImageUpload(uploadedImage) || ''
      }

      const itemData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        image_url,
        is_available: formData.is_available,
        vendor_id: user.vendor_id
      }

      if (currentItem) {
        // Update existing item
        const updatedItem = await menuService.updateItem(currentItem.item_id, itemData)
        setMenuItems(menuItems.map(item => 
          item.item_id === currentItem.item_id ? updatedItem : item
        ))
      } else {
        // Create new item
        const newItem = await menuService.createItem(itemData)
        setMenuItems([...menuItems, newItem])
      }

      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving menu item:', error)
      alert('Error saving menu item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (item: MenuItem) => {
    setCurrentItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category_id: item.category_id,
      image_url: item.image_url || '',
      is_available: item.is_available
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await menuService.deleteItem(itemId)
      setMenuItems(menuItems.filter(item => item.item_id !== itemId))
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item')
    }
  }

  const toggleAvailability = async (itemId: string, newStatus: boolean) => {
    try {
      await menuService.updateAvailability(itemId, newStatus)
      setMenuItems(menuItems.map(item => 
        item.item_id === itemId ? { ...item, is_available: newStatus } : item
      ))
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Error updating item availability')
    }
  }

  const resetForm = () => {
    setCurrentItem(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      image_url: '',
      is_available: true
    })
    setUploadedImage(null)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div
            key={item.item_id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="relative h-48">
              <Image
                src={item.image_url ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${item.image_url}` : '/placeholder-food.jpg'}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <span className="text-lg font-bold">₹{item.price}</span>
              </div>
              
              <p className="text-gray-600 text-sm mb-2">{item.description}</p>
              <p className="text-sm text-gray-500">{item.category?.name}</p>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`available-${item.item_id}`}
                    checked={item.is_available}
                    onChange={() => toggleAvailability(item.item_id, !item.is_available)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor={`available-${item.item_id}`} className="ml-2 block text-sm text-gray-900">
                    Available
                  </label>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.item_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {currentItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadedImage(e.target.files?.[0] || null)}
                    className="mt-1 block w-full"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Available
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
