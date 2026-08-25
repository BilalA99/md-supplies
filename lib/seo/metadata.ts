import type { Metadata } from 'next'
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  HOMEPAGE_TITLE,
  HOMEPAGE_DESCRIPTION,
  HOMEPAGE_OG_TITLE,
} from './constants'
import { buildCanonical } from './canonical'
import { buildRobots, STAGING_GUARD } from './robots'
import { buildOg } from './og'
import type { MetadataInput, PageType } from './types'

// ─── internal helpers ────────────────────────────────────────────────────────

/** Converts a URL slug to a human-readable title (e.g. `exam-gloves` → `Exam Gloves`). */
function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Derives the page path from the page type and optional slug/parentSlug. */
function resolvePath(pageType: PageType, slug?: string, parentSlug?: string): string {
  switch (pageType) {
    case 'homepage':       return '/'
    case 'categories-hub': return '/categories'
    case 'category':       return slug ? `/category/${slug}` : '/categories'
    case 'subcategory':    return parentSlug && slug ? `/category/${parentSlug}/${slug}` : slug ? `/category/${slug}` : '/'
    case 'product':        return slug ? `/product/${slug}` : '/shop'
    case 'partners':       return '/partners'
    case 'partner-detail': return slug ? `/partners/${slug}` : '/partners'
    case 'industry':       return slug ? `/industries/${slug}` : '/industries'
    case 'occ':            return '/solutions/occ'
    case 'blog-hub':       return '/blog'
    case 'blog-article':   return slug ? `/blog/${slug}` : '/blog'
    case 'static':         return slug ? `/${slug}` : '/'
    case 'utility':        return slug ? `/${slug}` : '/'
  }
}

/** Google's SERP title display cuts off around this many characters. */
const MAX_TITLE_LENGTH = 60

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * True when a title already ends with the site name, so appending it again
 * would double the brand.
 *
 * Matched live on 2026-08-25: 13 of 60 sampled products carry a Shopify
 * `seo.title` ending in "| MDSupplies" (merchandising writes the brand into the
 * field by hand). Those titles then had " — MDSupplies" appended, producing
 * "Dawn Mist Nail Brush, Box of 50 | MDSupplies — MDSupplies" — and only
 * SOMETIMES, because the length guard below silently dropped the second copy
 * once the total passed 60 characters, so the catalogue disagreed with itself.
 *
 * The separator class is deliberately broad (|, -, –, —, :, ·, •, comma, or
 * plain whitespace) because the brand is hand-appended and the separator is not
 * consistent. Anchored on a separator-or-start so a title merely CONTAINING the
 * word (e.g. a hypothetical "NotMDSupplies") is not treated as branded.
 */
function endsWithSiteName(base: string): boolean {
  return new RegExp(`(^|[\\s|:,\\-–—·•])\\s*${escapeRegExp(SITE_NAME)}\\s*$`, 'i').test(base)
}

/**
 * Appends the brand suffix only if the result fits the SERP display limit.
 * A long enriched/product title is more valuable than a truncated brand tag,
 * so once the budget is blown the suffix is dropped rather than overflowing.
 *
 * When the base is ALREADY branded, only the part of the suffix that adds new
 * information is appended — nothing for the plain " — MDSupplies", but the
 * qualifier survives for " — MDSupplies Partner" / " — MDSupplies Blog", so a
 * pre-branded partner title still reads as a partner page rather than losing
 * that word. The length guard then applies unchanged to whatever is left.
 */
function withBrandSuffix(base: string, suffix: string): string {
  let effectiveSuffix = suffix
  if (endsWithSiteName(base)) {
    // Everything in the suffix after the site name — '' for the plain suffix,
    // ' Partner' / ' Blog' for the qualified ones.
    const index = suffix.toLowerCase().lastIndexOf(SITE_NAME.toLowerCase())
    effectiveSuffix = index === -1 ? suffix : suffix.slice(index + SITE_NAME.length)
  }

  const full = `${base}${effectiveSuffix}`
  if (full.length <= MAX_TITLE_LENGTH) return full
  if (base.length <= MAX_TITLE_LENGTH) return base

  const sliced = base.slice(0, MAX_TITLE_LENGTH)
  const lastSpace = sliced.lastIndexOf(' ')
  return (lastSpace > 20 ? sliced.slice(0, lastSpace) : sliced).trimEnd()
}

/**
 * Generates the `<title>` value for a page.
 * Never returns an empty string — always has at least the site name.
 */
function resolveTitle(pageType: PageType, title?: string, parentSlug?: string): string {
  const t = title?.trim() ?? ''
  const suffix = ` — ${SITE_NAME}`

  switch (pageType) {
    case 'homepage':
      // Targets the primary commercial query ("medical supplies online")
      // rather than reusing the sitewide fallback title, which led with the
      // brand and buried the category the store actually competes for.
      return HOMEPAGE_TITLE
    case 'categories-hub':
      return `All Categories${suffix}`
    case 'category':
      return t ? withBrandSuffix(t, suffix) : DEFAULT_TITLE
    case 'subcategory': {
      const parent = parentSlug ? slugToTitle(parentSlug) : ''
      if (t && parent) return withBrandSuffix(`${t} — ${parent}`, suffix)
      if (t) return withBrandSuffix(t, suffix)
      return DEFAULT_TITLE
    }
    case 'product':
      return t ? withBrandSuffix(t, suffix) : DEFAULT_TITLE
    case 'partners':
      return `Our Partners${suffix}`
    case 'partner-detail':
      return t ? withBrandSuffix(t, `${suffix} Partner`) : `Partners${suffix}`
    case 'industry':
      return t ? withBrandSuffix(`${t} Supplies`, suffix) : DEFAULT_TITLE
    case 'occ':
      return `OCC Solutions${suffix}`
    case 'blog-hub':
      return `Blog${suffix}`
    case 'blog-article':
      return t ? withBrandSuffix(t, `${suffix} Blog`) : `Blog${suffix}`
    case 'static':
      return t ? withBrandSuffix(t, suffix) : SITE_NAME
    case 'utility':
      return t ? withBrandSuffix(t, suffix) : SITE_NAME
  }
}

// ─── buildMetadata ───────────────────────────────────────────────────────────

/**
 * Generates a complete Next.js `Metadata` object for any public page.
 *
 * Guarantees:
 * - `title` is never blank or undefined.
 * - `description` is never blank or undefined.
 * - `openGraph.images` always contains at least one image.
 * - `alternates.canonical` always points to the resolved page URL.
 */
export function buildMetadata(input: MetadataInput): Metadata {
  const {
    pageType,
    title,
    description,
    slug,
    parentSlug,
    image,
    imageWidth,
    imageHeight,
    noIndex = false,
  } = input

  const resolvedTitle = resolveTitle(pageType, title, parentSlug)
  // The homepage has its own default description for the same reason it has its
  // own title: DEFAULT_DESCRIPTION is the fallback every other page type shares.
  const homepageDefault = pageType === 'homepage' ? HOMEPAGE_DESCRIPTION : DEFAULT_DESCRIPTION
  const resolvedDescription = description?.trim() || homepageDefault
  const path = resolvePath(pageType, slug, parentSlug)
  const canonical = input.canonical ?? buildCanonical({ path, strategy: 'self' })
  const robots = buildRobots({ pageType, noIndex, isStaging: STAGING_GUARD })
  const og = buildOg({
    pageType,
    title: resolvedTitle,
    // Social cards have no 60-char SERP budget to respect, but they DO get
    // truncated harder in a feed, so the homepage drops the middle qualifier.
    ogTitle: pageType === 'homepage' ? HOMEPAGE_OG_TITLE : undefined,
    description: resolvedDescription,
    url: canonical,
    image,
    imageWidth,
    imageHeight,
  })

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    robots,
    alternates: { canonical },
    ...og,
  }
}
