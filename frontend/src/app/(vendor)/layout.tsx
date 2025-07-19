'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import AuthGuard from '@/components/auth/AuthGuard'

interface VendorLayoutProps {
  children: ReactNode
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  
  // Navigation items for vendor
  const navigation = [
    { name: 'Dashboard', href: '/vendor/dashboard' },
    { name: 'Menu Management', href: '/vendor/menu-management' },
    { name: 'Order Management', href: '/vendor/order-management' },
    { name: 'Inventory', href: '/vendor/inventory' },
    { name: 'Payments', href: '/vendor/payments' },
  ]

  return (
    <AuthGuard requiredRole="vendor">
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-white font-bold text-xl">FoodVendor</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          isActive
                            ? 'bg-indigo-700 text-white'
                            : 'text-white hover:bg-indigo-500'
                        } px-3 py-2 rounded-md text-sm font-medium`}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="text-white mr-4">{user?.full_name}</span>
                    <Link
                      href="/logout"
                      className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Logout
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              {/* Mobile menu button */}
              <button
                type="button"
                className="bg-indigo-600 inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-indigo-700 text-white'
                      : 'text-white hover:bg-indigo-500'
                  } block px-3 py-2 rounded-md text-base font-medium`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-indigo-700">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-white">
                  {user?.full_name}
                </div>
                <div className="text-sm font-medium leading-none text-indigo-200">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                href="/logout"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
      </div>
    </AuthGuard>
  )
}
