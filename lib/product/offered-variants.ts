import type { ProductOption, ProductVariant, SelectedOption } from '@/lib/shopify/types'

/**
 * The variants a product is actually offering on THIS sales channel.
 *
 * WHY THIS EXISTS
 * Shopify's Storefront API reports a withdrawn variant inconsistently, and the
 * two halves disagree in a way that let a withdrawn product stay on sale.
 * Verified live on 2026-08-25 for `toothbrush-tube-clear` after the merchant
 * turned the Blue variant off for the Md Supplies Headless channel:
 *
 *   options.values  →  ["Clear"]                     ← Blue correctly withdrawn
 *   variants        →  Clear AND Blue,               ← Blue still returned,
 *                      both availableForSale: true      still priced, still sellable
 *
 * `options.values` is the side that respects the channel; the variants
 * connection does not. Because the selector renders from `options.values`, Blue
 * vanished from the page — but every OTHER consumer reads `variants`, so
 * `/product/toothbrush-tube-clear?variant=<blue gid>` still rendered
 * "SKU: MILDTHLU0072BU · $45.55 · Add to Cart", and the Product JSON-LD still
 * advertised that SKU to Google. A bookmark, an old email or an indexed variant
 * URL could still buy an item the merchant had taken off sale.
 *
 * So the offered set is derived from `options.values` — the channel-aware
 * signal — and every consumer is fed the same narrowed list, rather than the
 * selector using one source and pricing/cart/schema using another.
 *
 * NOTE ON DIRECTION. This deliberately only ever NARROWS. An earlier attempt
 * went the other way and widened `options.values` from `variants`, which put
 * the withdrawn product back on sale. A value missing from `options.values` is
 * a merchandising decision, not a reporting gap — see the note in ProductView.
 */

function offeredValuesByOption(options: ProductOption[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const option of options) {
    // Option names are matched case-insensitively: Shopify preserves whatever
    // casing was imported, and "Color"/"color" both occur in this catalogue.
    map.set(option.name.toLowerCase(), new Set(option.values))
  }
  return map
}

/** True when every dimension this variant declares is still on offer. */
export function isVariantOffered(
  options: ProductOption[],
  variant: { selectedOptions: SelectedOption[] },
): boolean {
  const offered = offeredValuesByOption(options)
  return (variant.selectedOptions ?? []).every((selected) => {
    const values = offered.get(selected.name.toLowerCase())
    // An option the product does not declare cannot disqualify the variant —
    // only a declared option that no longer lists this value does.
    if (!values) return true
    return values.has(selected.value)
  })
}

/**
 * The subset of `variants` still offered, per `options.values`.
 *
 * FAILS OPEN, deliberately. If narrowing would leave nothing sellable — an
 * empty or malformed options list, a product whose option values disagree with
 * every variant — the original list is returned untouched. Hiding a real
 * product from sale is a worse failure than showing a withdrawn one, and this
 * function must never be able to empty a product page.
 */
export function selectOfferedVariants<T extends { selectedOptions: SelectedOption[] }>(
  options: ProductOption[],
  variants: T[],
): T[] {
  if (variants.length === 0) return variants
  const offered = variants.filter((variant) => isVariantOffered(options, variant))
  return offered.length > 0 ? offered : variants
}

/**
 * A product with its variant list narrowed to what is on offer, so the
 * selector, the price, the SKU, add-to-cart, the packaging fallbacks and the
 * structured data all read the same set. Returns the SAME object when nothing
 * was withdrawn, so the common case allocates nothing.
 */
export function withOfferedVariants<
  P extends { options: ProductOption[]; variants: { nodes: ProductVariant[] } },
>(product: P): P {
  const offered = selectOfferedVariants(product.options, product.variants.nodes)
  if (offered.length === product.variants.nodes.length) return product
  return { ...product, variants: { nodes: offered } }
}
