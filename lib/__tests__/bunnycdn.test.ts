import { describe, it, expect } from 'vitest'
import {
  getCategoryBannerPath,
  getSubcategoryBannerPath,
  getProductPlaceholderPath,
  GLOBAL_PRODUCT_PLACEHOLDER,
} from '../bunnycdn'

describe('getCategoryBannerPath', () => {
  it('builds the proxy path for a top-level category handle', () => {
    expect(getCategoryBannerPath('gloves')).toBe('/api/bunny/mdsupplies/categories/gloves.webp')
  })
})

describe('getSubcategoryBannerPath', () => {
  it('builds the proxy path for a full subcategory handle', () => {
    expect(getSubcategoryBannerPath('gloves-nitrile')).toBe('/api/bunny/mdsupplies/subcategories/gloves-nitrile.webp')
  })
})

describe('getProductPlaceholderPath', () => {
  it('resolves a top-level category handle to its placeholder', () => {
    expect(getProductPlaceholderPath('gloves')).toBe(
      '/api/bunny/mdsupplies/placeholders/products/gloves-placeholder.webp',
    )
  })

  it('resolves a subcategory handle to its parent placeholder', () => {
    expect(getProductPlaceholderPath('gloves-nitrile')).toBe(
      '/api/bunny/mdsupplies/placeholders/products/gloves-placeholder.webp',
    )
  })

  it('falls back to the global placeholder when no category handle is given', () => {
    expect(getProductPlaceholderPath(undefined)).toBe(GLOBAL_PRODUCT_PLACEHOLDER)
    expect(getProductPlaceholderPath(null)).toBe(GLOBAL_PRODUCT_PLACEHOLDER)
  })

  it('falls back to the global placeholder when the handle matches no roadmap category', () => {
    expect(getProductPlaceholderPath('totally-unknown-handle')).toBe(GLOBAL_PRODUCT_PLACEHOLDER)
  })

  it('falls back to the global placeholder for a category with no live matchedHandles', () => {
    // "Respiratory" has matchedHandles: [] today, so nothing can match it.
    expect(getProductPlaceholderPath('respiratory')).toBe(GLOBAL_PRODUCT_PLACEHOLDER)
  })
})
