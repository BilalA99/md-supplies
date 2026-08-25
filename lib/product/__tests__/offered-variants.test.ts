import { describe, it, expect } from 'vitest'
import {
  isVariantOffered,
  selectOfferedVariants,
  withOfferedVariants,
} from '../offered-variants'
import { stripVariantParam } from '../stale-variant-url'
import type { ProductOption, ProductVariant } from '@/lib/shopify/types'

function option(name: string, values: string[]): ProductOption {
  return { id: `gid://shopify/ProductOption/${name}`, name, values }
}

function variant(id: string, pairs: Record<string, string>) {
  return {
    id,
    selectedOptions: Object.entries(pairs).map(([name, value]) => ({ name, value })),
  }
}

describe('isVariantOffered', () => {
  const options = [option('Color', ['Clear'])]

  it('accepts a variant whose value is still offered', () => {
    expect(isVariantOffered(options, variant('a', { Color: 'Clear' }))).toBe(true)
  })

  it('rejects a variant whose value has been withdrawn', () => {
    expect(isVariantOffered(options, variant('b', { Color: 'Blue' }))).toBe(false)
  })

  it('matches option names case-insensitively', () => {
    expect(isVariantOffered(options, variant('c', { color: 'Clear' }))).toBe(true)
    expect(isVariantOffered([option('COLOR', ['Clear'])], variant('d', { Color: 'Clear' }))).toBe(true)
  })

  it('requires every dimension to be offered, not just one', () => {
    const two = [option('Color', ['Clear']), option('Size', ['S'])]
    expect(isVariantOffered(two, variant('e', { Color: 'Clear', Size: 'S' }))).toBe(true)
    expect(isVariantOffered(two, variant('f', { Color: 'Clear', Size: 'XL' }))).toBe(false)
  })

  it('ignores an option the product does not declare', () => {
    // An undeclared dimension cannot disqualify a variant — only a declared
    // option that no longer lists the value does.
    expect(isVariantOffered(options, variant('g', { Color: 'Clear', Finish: 'Matte' }))).toBe(true)
  })

  it('treats a variant with no selected options as offered', () => {
    expect(isVariantOffered(options, { selectedOptions: [] })).toBe(true)
  })
})

describe('selectOfferedVariants — the toothbrush-tube case', () => {
  // Verified live 2026-08-25 after the merchant withdrew Blue from the
  // Md Supplies Headless channel: options.values dropped Blue, the variants
  // connection did not.
  const options = [option('Color', ['Clear'])]
  const clear = variant('gid://shopify/ProductVariant/51923597099224', { Color: 'Clear' })
  const blue = variant('gid://shopify/ProductVariant/51923597131992', { Color: 'Blue' })

  it('drops the withdrawn variant', () => {
    expect(selectOfferedVariants(options, [clear, blue])).toEqual([clear])
  })

  it('preserves the order of what remains', () => {
    const green = variant('g', { Color: 'Green' })
    const opts = [option('Color', ['Clear', 'Green'])]
    expect(selectOfferedVariants(opts, [clear, blue, green])).toEqual([clear, green])
  })

  it('is a no-op when nothing has been withdrawn', () => {
    const opts = [option('Color', ['Clear', 'Blue'])]
    const input = [clear, blue]
    expect(selectOfferedVariants(opts, input)).toEqual(input)
  })
})

describe('selectOfferedVariants — fails open rather than emptying a product', () => {
  const clear = variant('a', { Color: 'Clear' })
  const blue = variant('b', { Color: 'Blue' })

  it('returns everything when narrowing would leave nothing sellable', () => {
    // Hiding a real product from sale is a worse failure than showing a
    // withdrawn one, so this must never produce an empty list.
    const impossible = [option('Color', ['Magenta'])]
    expect(selectOfferedVariants(impossible, [clear, blue])).toEqual([clear, blue])
  })

  it('returns everything when the options list is empty', () => {
    expect(selectOfferedVariants([], [clear, blue])).toEqual([clear, blue])
  })

  it('returns everything when an option declares no values', () => {
    expect(selectOfferedVariants([option('Color', [])], [clear, blue])).toEqual([clear, blue])
  })

  it('handles an empty variant list without throwing', () => {
    expect(selectOfferedVariants([option('Color', ['Clear'])], [])).toEqual([])
  })
})

describe('withOfferedVariants', () => {
  const base = {
    options: [option('Color', ['Clear'])],
    variants: {
      nodes: [
        { id: 'a', selectedOptions: [{ name: 'Color', value: 'Clear' }] },
        { id: 'b', selectedOptions: [{ name: 'Color', value: 'Blue' }] },
      ] as unknown as ProductVariant[],
    },
  }

  it('narrows the product to its offered variants', () => {
    const out = withOfferedVariants(base)
    expect(out.variants.nodes.map((v) => v.id)).toEqual(['a'])
  })

  it('returns the SAME object when nothing was withdrawn, so the common case allocates nothing', () => {
    const untouched = { ...base, options: [option('Color', ['Clear', 'Blue'])] }
    expect(withOfferedVariants(untouched)).toBe(untouched)
  })

  it('does not mutate the input', () => {
    const input = { ...base, variants: { nodes: [...base.variants.nodes] } }
    withOfferedVariants(input)
    expect(input.variants.nodes).toHaveLength(2)
  })
})

describe('stripVariantParam', () => {
  it('drops only the variant parameter', () => {
    expect(stripVariantParam('/product/x', { variant: 'gid://v/1' })).toBe('/product/x')
  })

  it('preserves tracking parameters, so a paid click keeps its attribution', () => {
    const out = stripVariantParam('/product/x', {
      variant: 'gid://v/1',
      utm_source: 'google',
      gclid: 'abc123',
    })
    expect(out.startsWith('/product/x?')).toBe(true)
    expect(out).toContain('utm_source=google')
    expect(out).toContain('gclid=abc123')
    expect(out).not.toContain('variant')
  })

  it('preserves repeated parameters', () => {
    const out = stripVariantParam('/category/a/b', { variant: 'v', filter: ['one', 'two'] })
    expect(out).toContain('filter=one')
    expect(out).toContain('filter=two')
  })

  it('skips undefined values rather than emitting "undefined"', () => {
    expect(stripVariantParam('/product/x', { variant: 'v', sort: undefined })).toBe('/product/x')
  })

  it('works for the category-scoped product route', () => {
    expect(stripVariantParam('/category/hygiene/toothbrush-tube-clear', { variant: 'v' }))
      .toBe('/category/hygiene/toothbrush-tube-clear')
  })

  it('URL-encodes values it keeps', () => {
    const out = stripVariantParam('/product/x', { variant: 'v', q: 'a b&c' })
    expect(out).toContain('q=a+b%26c')
  })
})
