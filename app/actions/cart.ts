'use server'

import { cookies } from 'next/headers'
import { storefrontFetch } from '@/lib/shopify/storefront'
import {
  CREATE_CART,
  ADD_CART_LINES,
  UPDATE_CART_LINES,
  REMOVE_CART_LINES,
  GET_CART,
} from '@/lib/shopify/queries/cart'
import type { Cart } from '@/lib/shopify/types'

const CART_COOKIE = 'cart_id'

export async function getCart(): Promise<Cart | null> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value
  if (!cartId) return null
  try {
    const data = await storefrontFetch<{ cart: Cart | null }>(GET_CART, { cartId })
    return data.cart
  } catch {
    return null
  }
}

export async function addToCart(variantId: string, quantity: number): Promise<Cart> {
  const jar = await cookies()
  const cartId = jar.get(CART_COOKIE)?.value

  let cart: Cart

  if (cartId) {
    const data = await storefrontFetch<{ cartLinesAdd: { cart: Cart } }>(
      ADD_CART_LINES,
      { cartId, lines: [{ merchandiseId: variantId, quantity }] },
    )
    cart = data.cartLinesAdd.cart
  } else {
    const data = await storefrontFetch<{ cartCreate: { cart: Cart } }>(
      CREATE_CART,
      { lines: [{ merchandiseId: variantId, quantity }] },
    )
    cart = data.cartCreate.cart
    jar.set(CART_COOKIE, cart.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return cart
}

export async function updateCartLine(lineId: string, quantity: number): Promise<Cart> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value
  if (!cartId) throw new Error('No cart')
  const data = await storefrontFetch<{ cartLinesUpdate: { cart: Cart } }>(
    UPDATE_CART_LINES,
    { cartId, lines: [{ id: lineId, quantity }] },
  )
  return data.cartLinesUpdate.cart
}

export async function removeFromCart(lineId: string): Promise<Cart> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value
  if (!cartId) throw new Error('No cart')
  const data = await storefrontFetch<{ cartLinesRemove: { cart: Cart } }>(
    REMOVE_CART_LINES,
    { cartId, lineIds: [lineId] },
  )
  return data.cartLinesRemove.cart
}
