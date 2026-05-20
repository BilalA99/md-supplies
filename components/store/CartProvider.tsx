'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { addToCart, removeFromCart, updateCartLine } from '@/app/actions/cart'
import type { Cart } from '@/lib/shopify/types'

interface CartContextValue {
  cart: Cart | null
  isOpen: boolean
  addItem(variantId: string, qty: number): Promise<void>
  removeItem(lineId: string): Promise<void>
  updateItem(lineId: string, qty: number): Promise<void>
  openCart(): void
  closeCart(): void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({
  children,
  initialCart,
}: {
  children: ReactNode
  initialCart: Cart | null
}) {
  const [cart, setCart] = useState<Cart | null>(initialCart)
  const [isOpen, setIsOpen] = useState(false)

  const addItem = useCallback(async (variantId: string, qty: number) => {
    const updated = await addToCart(variantId, qty)
    setCart(updated)
    setIsOpen(true)
  }, [])

  const removeItem = useCallback(async (lineId: string) => {
    const updated = await removeFromCart(lineId)
    setCart(updated)
  }, [])

  const updateItem = useCallback(async (lineId: string, qty: number) => {
    const updated = await updateCartLine(lineId, qty)
    setCart(updated)
  }, [])

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        addItem,
        removeItem,
        updateItem,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
