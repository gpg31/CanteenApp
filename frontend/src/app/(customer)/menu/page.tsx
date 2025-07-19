'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import MenuCard from '@/components/menu/MenuCard'
import { useAuthStore } from '@/store/useAuthStore'

interface MenuItem {
  item_id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  quantity_remaining: number
}

export default function MenuPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    // Redirect if not authenticated
    if (!token) {
      router.push('/login')
      return
    }

    // Mock menu data for testing frontend without backend
    const mockMenuItems = [
      {
        item_id: '1',
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and basil',
        price: 249,
        category: 'pizza',
        image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        quantity_remaining: 10
      },
      {
        item_id: '2',
        name: 'Chicken Burger',
        description: 'Juicy chicken patty with lettuce, tomato, and special sauce',
        price: 199,
        category: 'burger',
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        quantity_remaining: 15
      },
      {
        item_id: '3',
        name: 'Chocolate Shake',
        description: 'Rich and creamy chocolate milkshake',
        price: 99,
        category: 'beverage',
        image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        quantity_remaining: 20
      },
      {
        item_id: '4',
        name: 'French Fries',
        description: 'Crispy golden fries with seasoning',
        price: 79,
        category: 'sides',
        image_url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        quantity_remaining: 25
      },
      {
        item_id: '5',
        name: 'Vegetable Biryani',
        description: 'Fragrant rice dish with mixed vegetables and spices',
        price: 159,
        category: 'rice',
        image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        quantity_remaining: 8
      },
      {
        item_id: '6',
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing and croutons',
        price: 129,
        category: 'salad',
        image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        quantity_remaining: 12
      }
    ];

    setMenuItems(mockMenuItems);
    
    // Extract unique categories
    const uniqueCategories = Array.from(
      new Set(mockMenuItems.map(item => item.category))
    ) as string[];
    setCategories(['all', ...uniqueCategories]);
    
    setLoading(false);
  }, [token, router])

  const handleAddToCart = async (itemId: string) => {
    try {
      // Mock successful add to cart
      console.log(`Added item ${itemId} to cart`);
      
      // Show alert for demo purposes
      alert(`Item added to cart successfully!`);
      
      // Optionally show a success message or update cart count
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to cart')
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

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
        <button
          onClick={() => router.push('/cart')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          View Cart
        </button>
      </div>

      {/* Category filter */}
      <div className="mb-8">
        <div className="flex space-x-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map(item => (
          <MenuCard
            key={item.item_id}
            id={item.item_id}
            name={item.name}
            description={item.description}
            price={item.price}
            category={item.category}
            image_url={item.image_url}
            quantity_remaining={item.quantity_remaining}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  )
}