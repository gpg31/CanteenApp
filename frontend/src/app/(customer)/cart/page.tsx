'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CartItem from '@/components/cart/CartItem'
import { useAuthStore } from '@/store/useAuthStore'

interface CartItemType {
  cart_item_id: string
  quantity: number
  menuItem: {
    item_id: string
    name: string
    price: number
    image_url: string
  }
}

interface Cart {
  cart_id: string
  items: CartItemType[]
  total: number
}

export default function CartPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect if not authenticated
    if (!token) {
      router.push('/login')
      return
    }
    
    // Mock cart data
    const mockCart = {
      cart_id: '1',
      items: [
        {
          cart_item_id: '101',
          quantity: 2,
          menuItem: {
            item_id: '1',
            name: 'Margherita Pizza',
            price: 249,
            image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
          }
        },
        {
          cart_item_id: '102',
          quantity: 1,
          menuItem: {
            item_id: '3',
            name: 'Chocolate Shake',
            price: 99,
            image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
          }
        }
      ],
      total: 249 * 2 + 99 * 1
    };
    
    setCart(mockCart);
    setLoading(false);
  }, [token, router])

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      // Update the cart locally with the new quantity
      if (cart) {
        const updatedItems = cart.items.map(item => {
          if (item.cart_item_id === itemId) {
            return {
              ...item,
              quantity
            };
          }
          return item;
        });
        
        // Calculate new total
        const newTotal = updatedItems.reduce(
          (sum, item) => sum + item.quantity * item.menuItem.price, 
          0
        );
        
        setCart({
          ...cart,
          items: updatedItems,
          total: newTotal
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cart')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      // Remove item from local cart
      if (cart) {
        const updatedItems = cart.items.filter(
          item => item.cart_item_id !== itemId
        );
        
        // Calculate new total
        const newTotal = updatedItems.reduce(
          (sum, item) => sum + item.quantity * item.menuItem.price, 
          0
        );
        
        setCart({
          ...cart,
          items: updatedItems,
          total: newTotal
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
    }
  }

  const handleClearCart = async () => {
    try {
      // Clear the cart
      setCart({
        ...cart!,
        items: [],
        total: 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart')
    }
  }

  const handleCheckout = async () => {
    try {
      // Create a mock order
      const mockOrderId = '1234';
      
      // Clear the cart
      setCart({
        ...cart!,
        items: [],
        total: 0
      });
      
      // Show success message
      alert('Order placed successfully!');
      
      // Navigate to orders page
      router.push(`/orders/${mockOrderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 text-gray-600">Add some delicious items to your cart!</p>
          <button
            onClick={() => router.push('/menu')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Browse Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <button
          onClick={() => router.push('/menu')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Continue Shopping
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            {cart.items.map((item) => (
              <CartItem
                key={item.cart_item_id}
                id={item.cart_item_id}
                name={item.menuItem.name}
                price={item.menuItem.price}
                quantity={item.quantity}
                image_url={item.menuItem.image_url}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
          <div className="mt-4">
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear Cart
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-base text-gray-900">Total</span>
              <span className="text-xl font-medium text-gray-900">₹{cart.total}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="mt-6 w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
