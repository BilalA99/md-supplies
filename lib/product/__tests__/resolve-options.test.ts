import { describe, it, expect } from 'vitest'
import {
  resolveProductOptions,
  hasSelectableOptions,
  hasMultipleColors,
} from '../resolve-options'
import type { ProductOption } from '@/lib/shopify/types'

function option(name: string, values: string[]): ProductOption {
  return { id: `gid://shopify/ProductOption/${name}`, name, values }
}

function variant(pairs: Record<string, string>) {
  return { selectedOptions: Object.entries(pairs).map(([name, value]) => ({ name, value })) }
}

describe('resolveProductOptions — the toothbrush-tube-clear regression', () => {
  // Verified live 2026-08-25: the product declares one Color value ("Clear")
  // but ships two active, in-stock, separately-priced variants. Trusting
  // options.values hid the selector entirely and made Blue unbuyable.
  const options = [option('Color', ['Clear'])]
  const variants = [variant({ Color: 'Clear' }), variant({ Color: 'Blue' })]

  it('recovers the variant value the option list omits', () => {
    const [color] = resolveProductOptions(options, variants)
    expect(color.values).toEqual(['Clear', 'Blue'])
  })

  it('makes the product render a selector instead of hiding it', () => {
    expect(hasSelectableOptions(options)).toBe(false)
    expect(hasSelectableOptions(resolveProductOptions(options, variants))).toBe(true)
  })

  it('makes the product register as multi-colour, so the title and gallery track the selection', () => {
    expect(hasMultipleColors(options)).toBe(false)
    expect(hasMultipleColors(resolveProductOptions(options, variants))).toBe(true)
  })
})

describe('resolveProductOptions — leaves correct data alone', () => {
  it('is a no-op when the option list already covers every variant', () => {
    const options = [option('Size', ['Small', 'XL'])]
    const variants = [variant({ Size: 'Small' }), variant({ Size: 'XL' })]
    expect(resolveProductOptions(options, variants)).toEqual(options)
  })

  it('leaves the synthetic single-variant option untouched', () => {
    const options = [option('Title', ['Default Title'])]
    const variants = [variant({ Title: 'Default Title' })]
    const out = resolveProductOptions(options, variants)
    expect(out[0].values).toEqual(['Default Title'])
    expect(hasSelectableOptions(out)).toBe(false)
  })

  it('preserves the declared order and appends recovered values after it', () => {
    const options = [option('Color', ['Clear', 'Green'])]
    const variants = [
      variant({ Color: 'Blue' }),
      variant({ Color: 'Clear' }),
      variant({ Color: 'Amber' }),
    ]
    expect(resolveProductOptions(options, variants)[0].values).toEqual([
      'Clear', 'Green', 'Blue', 'Amber',
    ])
  })

  it('keeps a declared value that has no variant rather than silently dropping it', () => {
    const options = [option('Color', ['Clear', 'Discontinued Green'])]
    const variants = [variant({ Color: 'Clear' })]
    expect(resolveProductOptions(options, variants)[0].values).toEqual([
      'Clear', 'Discontinued Green',
    ])
  })

  it('does not duplicate a value already present', () => {
    const options = [option('Color', ['Clear'])]
    const variants = [variant({ Color: 'Clear' }), variant({ Color: 'Clear' })]
    expect(resolveProductOptions(options, variants)[0].values).toEqual(['Clear'])
  })
})

describe('resolveProductOptions — multiple dimensions and edge cases', () => {
  it('reconciles each option independently', () => {
    const options = [option('Color', ['Clear']), option('Size', ['Small'])]
    const variants = [
      variant({ Color: 'Clear', Size: 'Small' }),
      variant({ Color: 'Blue', Size: 'Large' }),
    ]
    const out = resolveProductOptions(options, variants)
    expect(out[0].values).toEqual(['Clear', 'Blue'])
    expect(out[1].values).toEqual(['Small', 'Large'])
  })

  it('matches option names case-insensitively', () => {
    const options = [option('Color', ['Clear'])]
    const variants = [variant({ color: 'Blue' })]
    expect(resolveProductOptions(options, variants)[0].values).toEqual(['Clear', 'Blue'])
  })

  it('handles an empty variant list without inventing values', () => {
    const options = [option('Color', ['Clear'])]
    expect(resolveProductOptions(options, [])).toEqual(options)
  })

  it('handles a variant with no selectedOptions', () => {
    const options = [option('Color', ['Clear'])]
    const out = resolveProductOptions(options, [{ selectedOptions: [] }])
    expect(out[0].values).toEqual(['Clear'])
  })

  it('returns an empty list for a product with no options', () => {
    expect(resolveProductOptions([], [variant({ Color: 'Blue' })])).toEqual([])
  })
})

describe('hasSelectableOptions', () => {
  it('is false with no options at all', () => {
    expect(hasSelectableOptions([])).toBe(false)
  })

  it('is false for exactly one option with exactly one value', () => {
    expect(hasSelectableOptions([option('Title', ['Default Title'])])).toBe(false)
  })

  it('is true for one option with several values', () => {
    expect(hasSelectableOptions([option('Color', ['Clear', 'Blue'])])).toBe(true)
  })

  it('is true for two single-value options, which is still a real combination', () => {
    expect(hasSelectableOptions([option('Color', ['Clear']), option('Size', ['S'])])).toBe(true)
  })
})

describe('hasMultipleColors', () => {
  it('is true only for a colour dimension with more than one value', () => {
    expect(hasMultipleColors([option('Color', ['Clear', 'Blue'])])).toBe(true)
    expect(hasMultipleColors([option('Color', ['Clear'])])).toBe(false)
  })

  it('ignores non-colour dimensions', () => {
    expect(hasMultipleColors([option('Size', ['Small', 'XL'])])).toBe(false)
  })

  it('matches the option name case-insensitively', () => {
    expect(hasMultipleColors([option('COLOR', ['Clear', 'Blue'])])).toBe(true)
    expect(hasMultipleColors([option('color', ['Clear', 'Blue'])])).toBe(true)
  })
})
