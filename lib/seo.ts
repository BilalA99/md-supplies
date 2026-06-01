// lib/seo.ts — B1 stub; replaced wholesale when Munis's branch merges
import type { Metadata } from 'next'

export const STAGING_GUARD = process.env.NEXT_PUBLIC_IS_STAGING === 'true'

interface BuildMetadataOptions {
  pageType: 'category' | 'subcategory' | 'product' | 'page'
  title: string
  slug?: string
  description?: string
  canonical?: string
  noindex?: boolean
}

export function buildMetadata(opts: BuildMetadataOptions): Metadata {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mdsupplies.com'
  const canonical =
    opts.canonical ??
    (opts.slug ? `${base}/${opts.pageType}/${opts.slug}` : base)
  return {
    title: `${opts.title} | MD Supplies`,
    description: opts.description,
    alternates: { canonical },
    robots: opts.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
  }
}
