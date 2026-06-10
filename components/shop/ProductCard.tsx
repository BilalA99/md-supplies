'use client'

import { useState, useRef } from 'react'
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ProductCardData } from '@/types/product'
import { QuickAddModal } from '@/components/product/QuickAddModal'

export interface Product {
  id: number;
  slug: string;
  brand: string;
  name: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  inStock: boolean;
  freeShipping?: boolean;
}

function toCardData(p: Product): ProductCardData {
  const priceCents = Math.round(p.price * 100)
  return {
    handle: p.slug,
    title: p.name,
    image: { url: p.image, altText: p.name, width: 800, height: 800 },
    brand: p.brand,
    vendor: p.brand,
    price: priceCents,
    sku: String(p.id),
    available: p.inStock,
    variants: p.sizes.length > 0
      ? p.sizes.map((s, i) => ({ id: String(i), title: s, price: priceCents, available: p.inStock }))
      : [{ id: '0', title: 'Default', price: priceCents, available: p.inStock }],
  }
}

export function ProductCard(props: Product) {
  const { slug, brand, name, price, image, freeShipping, inStock } = props
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const cardData = toCardData(props)

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(true)
  }

  function handleClose() {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <>
      <Link href={`/shop/${slug}`} className="group bg-white flex flex-col">

        {/* Image */}
        <div className="relative overflow-hidden bg-white aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={name}
            className="size-full object-contain"
          />

          {freeShipping && (
            <span className="absolute top-0 left-0 bg-[#006e46] text-[#f9fafc] text-[13px] font-semibold h-[31px] px-4 flex items-center tracking-[0.26px]">
              FREE SHIPPING
            </span>
          )}

          {inStock && (
            <button
              ref={triggerRef}
              onClick={handleOpen}
              aria-label={`Quick add ${name}`}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-navy-900 hover:text-white text-navy-900"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="px-[22px] pt-[19px] pb-[22px] flex flex-col">
          <span className="text-teal-500 text-[13px] font-semibold tracking-[0.26px] uppercase leading-[25px]">
            {brand}
          </span>
          <p className="text-black text-[14px] font-semibold tracking-[0.28px] leading-5 line-clamp-2 mb-[30px]">
            {name}
          </p>
          <span className="text-black text-[18px] font-bold tracking-[0.36px]">
            ${price.toFixed(2)}
          </span>
        </div>

      </Link>

      {isOpen && <QuickAddModal product={cardData} onClose={handleClose} />}
    </>
  )
}
