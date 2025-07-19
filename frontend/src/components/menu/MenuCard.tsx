'use client'

import Image from 'next/image'

interface MenuItemProps {
  item_id: string
  name: string
  description: string
  price: number
  category: {
    name: string
    description: string
  }
  image_url: string | null
  is_available: boolean
  onAddToCart: (id: string) => void
}

export default function MenuCard({
  item_id,
  name,
  description,
  price,
  category,
  image_url,
  is_available,
  onAddToCart,
}: MenuItemProps) {
  const imageUrl = image_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${image_url}`
    : '/placeholder-food.jpg';

  return (
    <div className="relative flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          width={400}
          height={300}
        />
        {!is_available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white text-lg font-bold">Sold Out</span>
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{name}</h3>
            <p className="mt-1 text-sm text-gray-500">{category.name}</p>
          </div>
          <span className="text-lg font-bold text-gray-900">₹{price}</span>
        </div>
        <p className="mt-2 text-sm text-gray-500 flex-1">{description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {is_available ? 'In Stock' : 'Out of stock'}
          </span>
          <button
            onClick={() => onAddToCart(item_id)}
            disabled={!is_available}
            className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
