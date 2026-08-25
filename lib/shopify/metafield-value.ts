/**
 * Display formatting for the structured specification metafields the PDP
 * renders (ProductView's SPEC_ROWS).
 *
 * WHY THIS EXISTS
 * The specification metafields on this store are not all the same shape.
 * Confirmed against the live Admin API metafield definitions (2026-08-25):
 *
 *   single_line_text_field        custom.material, custom.color, custom.sterility,
 *                                 custom.thickness, custom.glove_size,
 *                                 custom.needle_gauge, custom.needle_length,
 *                                 custom.size_length_, custom.use,
 *                                 custom.features, custom.quantity_of_units
 *
 *   list.single_line_text_field   custom.type, custom.other_features,
 *                                 custom.tests_for, custom.detectable_drugs,
 *                                 custom.adulterants
 *
 * A LIST metafield's Storefront `.value` is a JSON array STRING, e.g.
 * `["Microalbumin","Creatinine"]` — printing it straight into a table cell
 * renders the brackets and quotes to the customer. The 12-panel drug cup's
 * `custom.detectable_drugs` holds twelve entries, so this is not a cosmetic
 * edge case; it is most of what the Testing category has to say about a product.
 *
 * Kept separate from lib/policy/rich-text.ts on purpose: that module flattens
 * the `rich_text_field` AST (custom.shipping_returns, custom.variant_description).
 * These are scalar/list text fields and share none of that walk.
 */

/** Values that carry no information and must never occupy a spec row. */
function isBlank(value: string): boolean {
  return value.trim() === ''
}

/**
 * One display string for a spec metafield's raw Storefront value, or null when
 * there is nothing worth rendering.
 *
 * Returns null (never an empty string, never "null", never "[]") for:
 *   - null / undefined / empty / whitespace-only input
 *   - an empty JSON array, or one whose entries are all blank
 *
 * A JSON array is joined with ", " in its stored order — the order Shopify
 * shows in Admin, which is the order the merchant chose. Entries are trimmed
 * and blanks dropped, so a trailing empty row in Admin cannot render as
 * "Nitrile, ".
 *
 * Anything that is not a JSON array is treated as plain text, including a
 * value that merely happens to start with "[". That is deliberate: a
 * single_line_text_field genuinely reading "[see insert]" is real merchant
 * copy and must survive, so parse failure falls back to the trimmed raw
 * string rather than being discarded.
 */
export function formatMetafieldValue(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (isBlank(trimmed)) return null

  // Only attempt a parse when the value could be a JSON array at all; this
  // keeps ordinary text off the JSON path entirely.
  if (trimmed.startsWith('[')) {
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      return trimmed
    }
    if (!Array.isArray(parsed)) return trimmed
    const items = parsed
      .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
      .filter((item) => !isBlank(item))
    return items.length > 0 ? items.join(', ') : null
  }

  return trimmed
}
