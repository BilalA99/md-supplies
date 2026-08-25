/**
 * Where to send a `?variant=` link that no longer names an offered variant.
 *
 * THE CASE
 * A shopper bookmarks, or is emailed, or Google indexes
 * `/product/x?variant=<gid>`. The merchant later withdraws that variant from
 * this sales channel. The link is now stale.
 *
 * WHY REDIRECT RATHER THAN QUIETLY RENDER
 * Narrowing the variant list (lib/product/offered-variants.ts) already stops the
 * withdrawn variant being priced or sold — without a redirect the page would
 * simply fall back to the default variant and return 200. That is safe, but it
 * leaves the stale `?variant=` in the address bar, so the shopper re-shares the
 * dead link and it keeps circulating. Redirecting cleans the URL at the point
 * of use.
 *
 * WHY NOT 404
 * The PRODUCT is still on sale — only one of its colours is gone. A 404 would
 * break every existing bookmark and discard the link equity of an indexed URL
 * to say something untrue. The product page is the honest destination.
 *
 * SEO
 * `?variant=` URLs already carry a canonical pointing at the clean product URL
 * (buildCanonical, strategy 'base-product'), so Google consolidates them
 * regardless. The redirect is belt-and-braces: it removes the stale parameter
 * from circulation faster than waiting for a recrawl, and it cannot create a
 * duplicate because the destination is exactly that canonical.
 *
 * Next's `redirect()` issues a TEMPORARY redirect, which is the honest status
 * here: a variant withdrawn while out of stock is expected to come back, and a
 * permanent redirect would be cached by browsers and search engines long after
 * it did.
 *
 * TRACKING PARAMS ARE PRESERVED
 * Only `variant` is dropped. utm_*, gclid and the rest survive the redirect, or
 * a paid click that happened to use a stale variant link would lose its
 * attribution — the canonical strips those separately for indexing, which is a
 * different concern from carrying them through a navigation.
 */
export function stripVariantParam(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'variant' || value === undefined) continue
    if (Array.isArray(value)) {
      for (const entry of value) params.append(key, entry)
    } else {
      params.set(key, value)
    }
  }
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}
