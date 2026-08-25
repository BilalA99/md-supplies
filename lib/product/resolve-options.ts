import type { ProductOption, ProductVariant } from '@/lib/shopify/types'

/**
 * The option values a PDP may actually offer, reconciled against the variants
 * that exist.
 *
 * WHY THIS EXISTS
 * `Product.options.values` is a denormalized convenience field. On this store it
 * is not always complete. Verified live against the Storefront API on
 * 2026-08-25 for `toothbrush-tube-clear`:
 *
 *   options:  [{ name: "Color", values: ["Clear"] }]
 *   variants: Clear (MILDTHLU0072NU, Color=Clear, own image)
 *             Blue  (MILDTHLU0072BU, Color=Blue,  own image)
 *
 * Both variants are ACTIVE, in stock and separately priced, but "Blue" is
 * missing from the option's value list. Because ProductView gated the selector
 * on `options[0].values.length === 1`, the entire colour selector was
 * suppressed and the Blue variant had no control that could select it — an
 * available, purchasable product a customer could not buy from its own page.
 *
 * `variant.selectedOptions` is the authoritative statement of what a variant
 * IS, so it is the source of truth here. The declared `values` list is still
 * honoured for ORDER (it is the order the merchant arranged in Admin); any
 * value a variant carries but the list omits is appended in variant order.
 *
 * This intentionally only ever WIDENS the offered set. A value declared in
 * `options.values` with no matching variant is preserved rather than dropped —
 * VariantSelector already renders such a value as a disabled button, and
 * silently removing a merchant-declared option is a bigger behaviour change
 * than this fix is entitled to make.
 */
export function resolveProductOptions(
  options: ProductOption[],
  variants: Pick<ProductVariant, 'selectedOptions'>[],
): ProductOption[] {
  return options.map((option) => {
    const seen = new Set(option.values)
    const fromVariants: string[] = []

    for (const variant of variants) {
      for (const selected of variant.selectedOptions ?? []) {
        // Option names are compared case-insensitively for the same reason the
        // colour checks are: Shopify preserves whatever casing was imported.
        if (selected.name.toLowerCase() !== option.name.toLowerCase()) continue
        if (seen.has(selected.value)) continue
        seen.add(selected.value)
        fromVariants.push(selected.value)
      }
    }

    if (fromVariants.length === 0) return option
    return { ...option, values: [...option.values, ...fromVariants] }
  })
}

/**
 * True when the product offers a real, multi-value choice worth rendering a
 * selector for. A single option with a single value (Shopify's synthetic
 * "Title / Default Title") is not a choice.
 *
 * Callers must pass options already reconciled by resolveProductOptions, or
 * they reintroduce exactly the bug above.
 */
export function hasSelectableOptions(options: ProductOption[]): boolean {
  if (options.length === 0) return false
  return !(options.length === 1 && options[0].values.length === 1)
}

/**
 * True when the product has a genuine multi-value COLOUR dimension — the only
 * case where showing one variant's image for another would misrepresent it,
 * and the only case that renames the product in the H1 (`Title — Blue`).
 */
export function hasMultipleColors(options: ProductOption[]): boolean {
  return options.some(
    (option) => option.name.toLowerCase() === 'color' && option.values.length > 1,
  )
}
