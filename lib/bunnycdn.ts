import { ROADMAP_CATEGORIES } from '@/lib/category-nav'

// All BunnyCDN reads go through the same-origin proxy route (app/api/bunny/[...path]/route.ts)
// because the storage zone has no public Pull Zone — only the private Storage API, which
// requires an AccessKey header a plain <img>/next/image src can never send. The proxy keeps
// that key server-side and lets next/image treat these as ordinary local paths (no remotePatterns).
const PROXY_PREFIX = '/api/bunny'

// §3.4 — path layout inside the md-supplies storage zone.
const PATH_NAMESPACE = 'mdsupplies'
const CATEGORIES_PATH = `${PATH_NAMESPACE}/categories`
const SUBCATEGORIES_PATH = `${PATH_NAMESPACE}/subcategories`
const PRODUCT_PLACEHOLDERS_PATH = `${PATH_NAMESPACE}/placeholders/products`

export const GLOBAL_PRODUCT_PLACEHOLDER = `${PROXY_PREFIX}/${PRODUCT_PLACEHOLDERS_PATH}/medical-supplies-placeholder.webp`

export function getCategoryBannerPath(handle: string): string {
  return `${PROXY_PREFIX}/${CATEGORIES_PATH}/${handle}.webp`
}

export function getSubcategoryBannerPath(handle: string): string {
  return `${PROXY_PREFIX}/${SUBCATEGORIES_PATH}/${handle}.webp`
}

function findRoadmapCategory(handle: string) {
  return ROADMAP_CATEGORIES.find((category) =>
    category.matchedHandles.some((h) => handle === h || handle.startsWith(`${h}-`)),
  )
}

export function getProductPlaceholderPath(categoryHandle?: string | null): string {
  if (!categoryHandle) return GLOBAL_PRODUCT_PLACEHOLDER
  const category = findRoadmapCategory(categoryHandle)
  if (!category) return GLOBAL_PRODUCT_PLACEHOLDER
  return `${PROXY_PREFIX}/${PRODUCT_PLACEHOLDERS_PATH}/${category.placeholderSlug}-placeholder.webp`
}
