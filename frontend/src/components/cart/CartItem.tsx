'use client'

import Image from 'next/image'

interface CartItemProps {
  id: string
  name: string
  price: number
  quantity: number
  image_url: string
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export default function CartItem({
  id,
  name,
  price,
  quantity,
  image_url,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  return (
    <div className="flex items-center py-4 border-b">
      <div className="relative h-24 w-24 flex-shrink-0">
        <Image
          src={image_url || '/placeholder-food.jpg'}
          alt={name}
          className="w-full h-full object-cover rounded-md"
          width={96}
          height={96}
        />
      </div>
      <div className="ml-4 flex-1">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{name}</h3>
            <p className="mt-1 text-sm text-gray-500">₹{price}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center border rounded-md">
              <button
                onClick={() => onUpdateQuantity(id, quantity - 1)}
                disabled={quantity <= 1}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
              >
                -
              </button>
              <span className="px-3 py-1 text-gray-800">{quantity}</span>
              <button
                onClick={() => onUpdateQuantity(id, quantity + 1)}
                className="px-3 py-1 text-gray-600 hover:text-gray-800"
              >
                +
              </button>
            </div>
            <button
              onClick={() => onRemove(id)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-900">
          Subtotal: ₹{price * quantity}
        </div>
      </div>
    </div>
  )
}
