import { GLOBAL_PRODUCT_PLACEHOLDER } from '@/lib/bunnycdn'

export const SITE_NAME = 'MDSupplies' as const

/** Base URL — configure via NEXT_PUBLIC_SITE_URL; trailing slash stripped. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mdsupplies.com'
).replace(/\/$/, '')

// No dedicated 1200x630 OG banner has been shot/uploaded yet — reuse the real
// BunnyCDN medical-supplies placeholder so this resolves instead of 404ing.
// Swap for a purpose-built banner once one exists.
/** Fallback OG image used when a page supplies no page-specific image. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}${GLOBAL_PRODUCT_PLACEHOLDER}`

export const OG_IMAGE_WIDTH = 1200 as const
export const OG_IMAGE_HEIGHT = 630 as const

export const DEFAULT_TITLE = `${SITE_NAME} — Medical & Dental Supplies`

export const DEFAULT_DESCRIPTION =
  'Medical-grade supplies at wholesale prices. Trusted by urgent care centers, HRT clinics, home health agencies, and first responders.'
