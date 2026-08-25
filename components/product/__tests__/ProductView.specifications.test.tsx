import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { ProductView } from '../ProductView'
import type { Product, ProductVariant } from '@/lib/shopify/types'

afterEach(cleanup)

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/product/spec-fixture',
}))

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string; priority?: boolean }) => {
    const { fill: _fill, sizes: _sizes, priority: _priority, ...rest } = props
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />
  },
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('@/components/store/CartProvider', () => ({
  useCart: () => ({ addItem: vi.fn() }),
}))

const img = { id: 'img-1', url: 'https://cdn/x.jpg', altText: 'x', width: 800, height: 800 }

const variant: ProductVariant = {
  id: 'gid://shopify/ProductVariant/1', title: 'Default Title', sku: 'MED MNE5052',
  availableForSale: true, quantityAvailable: 10,
  selectedOptions: [{ name: 'Title', value: 'Default Title' }],
  price: { amount: '69.25', currencyCode: 'USD' }, compareAtPrice: null,
  image: img,
  manufacturerNumber: null, orderSize: null, unitsPerOrder: null, description: null,
}

// Every specification metafield null — the state the whole catalogue was in
// before the query selected them.
const product: Product = {
  id: 'gid://shopify/Product/1', title: 'Nitrile Exam Gloves',
  handle: 'spec-fixture', description: 'Gloves.',
  descriptionHtml: '<p>Gloves.</p>', vendor: 'Medline',
  availableForSale: true, tags: [],
  priceRange: { minVariantPrice: { amount: '69.25', currencyCode: 'USD' }, maxVariantPrice: { amount: '69.25', currencyCode: 'USD' } },
  images: { nodes: [img] },
  variants: { nodes: [variant] },
  options: [{ id: 'opt1', name: 'Title', values: ['Default Title'] }],
  seo: { title: null, description: null }, collections: { nodes: [] },
  brandName: null, unitsPerOrder: null, quantityOfUnits: null, orderSize: null,
  material: null, use: null, features: null, color: null, sterility: null,
  thickness: null, gloveSize: null, needleGauge: null, needleLength: null,
  sizeLength: null, estimatedRestockDate: null, backorderRestockEta: null,
  testsFor: null, detectableDrugs: null, adulterants: null, otherFeatures: null,
  typeList: null, customBadge1: null, customBadge2: null, customBadge3: null,
  shippingReturns: null,
}

function renderPDP(overrides: Partial<Product> = {}) {
  return render(
    <ProductView
      product={{ ...product, ...overrides }}
      initialVariant={variant}
      relatedProducts={[]}
      complementaryProducts={[]}
    />,
  )
}

/** The Specifications table, or null when it is not rendered. */
function specTable(): HTMLTableElement | null {
  const heading = screen.queryByRole('heading', { name: 'Specifications' })
  if (!heading) return null
  return heading.parentElement!.querySelector('table')
}

/** Label → value for every rendered spec row, in DOM order. */
function specRows(): [string, string][] {
  const table = specTable()
  if (!table) return []
  return Array.from(table.querySelectorAll('tbody tr')).map((tr) => [
    tr.querySelector('th')!.textContent!.trim(),
    tr.querySelector('td')!.textContent!.trim(),
  ])
}

describe('Specifications tab — populated metafields render', () => {
  it('renders a row for a populated scalar metafield', () => {
    renderPDP({ material: 'Nitrile' })
    expect(specRows()).toContainEqual(['Material', 'Nitrile'])
  })

  it('renders the real glove product shape from the live catalogue', () => {
    // Values read live 2026-08-25 from 100-nitrile-exam-gloves-pf-text-finger-cobalt-blue-small.
    renderPDP({
      material: 'Nitrile',
      color: 'Blue',
      thickness: '3.5 mil',
      gloveSize: 'Small',
      typeList: '["Exam"]',
    })
    expect(specRows()).toEqual([
      ['Material', 'Nitrile'],
      ['Color', 'Blue'],
      ['Thickness', '3.5 mil'],
      ['Glove Size', 'Small'],
      ['Type', 'Exam'],
    ])
  })

  it('preserves the approved row order regardless of which fields are populated', () => {
    renderPDP({ adulterants: 'Nitrite', material: 'Nitrile', use: 'Single use' })
    expect(specRows().map(([label]) => label)).toEqual(['Material', 'Use', 'Adulterants'])
  })

  it('renders values for a diagnostic product, a different category shape entirely', () => {
    renderPDP({
      typeList: '["Dip Strip / Dipstick"]',
      testsFor: '["Microalbumin","Creatinine"]',
      otherFeatures: '["CLIA Waived"]',
    })
    expect(specRows()).toEqual([
      ['Other Features', 'CLIA Waived'],
      ['Type', 'Dip Strip / Dipstick'],
      ['Tests For', 'Microalbumin, Creatinine'],
    ])
  })
})

describe('Specifications tab — list-typed metafields are flattened, not printed as JSON', () => {
  it('joins a multi-entry list for display', () => {
    renderPDP({ detectableDrugs: '["Amphetamine (AMP)","Barbiturate (BAR)","Cocaine (COC)"]' })
    expect(specRows()).toContainEqual([
      'Detectable Drugs',
      'Amphetamine (AMP), Barbiturate (BAR), Cocaine (COC)',
    ])
  })

  it('never leaks JSON brackets or quotes into the rendered table', () => {
    renderPDP({ testsFor: '["Microalbumin","Creatinine"]', typeList: '["Exam"]' })
    const text = specTable()!.textContent!
    expect(text).not.toContain('[')
    expect(text).not.toContain(']')
    expect(text).not.toContain('"')
  })
})

describe('Specifications tab — blank values stay hidden', () => {
  it('renders no table at all when every specification is empty', () => {
    renderPDP()
    expect(specTable()).toBeNull()
  })

  it('omits a row whose value is an empty string rather than showing a blank cell', () => {
    renderPDP({ material: 'Nitrile', color: '' })
    expect(specRows()).toEqual([['Material', 'Nitrile']])
  })

  it('omits a row whose value is whitespace only', () => {
    renderPDP({ material: 'Nitrile', color: '   ' })
    expect(specRows().map(([label]) => label)).not.toContain('Color')
  })

  it('omits a row whose list value is empty', () => {
    renderPDP({ material: 'Nitrile', typeList: '[]' })
    expect(specRows()).toEqual([['Material', 'Nitrile']])
  })

  it('never renders the literal text "null" for an absent value', () => {
    renderPDP({ material: 'Nitrile' })
    expect(specTable()!.textContent).not.toContain('null')
  })

  it('does not show unrelated medical fields on a product that has none of them', () => {
    // A toothbrush tube must not sprout Needle Gauge / Detectable Drugs rows.
    renderPDP({ color: 'Clear' })
    const labels = specRows().map(([label]) => label)
    expect(labels).toEqual(['Color'])
    for (const absent of ['Needle Gauge', 'Needle Length', 'Detectable Drugs', 'Adulterants', 'Sterility']) {
      expect(labels).not.toContain(absent)
    }
  })
})

describe('Specifications tab — existing content is unaffected', () => {
  it('still shows Internal SKU when no specifications exist', () => {
    renderPDP()
    expect(screen.getByRole('heading', { name: 'Internal SKU' })).toBeTruthy()
    expect(screen.getByText('MED MNE5052')).toBeTruthy()
  })

  it('still shows Brand Name and Description alongside the specifications table', () => {
    renderPDP({ brandName: 'Medline', material: 'Nitrile' })
    expect(screen.getByRole('heading', { name: 'Brand Name' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Description' })).toBeTruthy()
    expect(specRows()).toEqual([['Material', 'Nitrile']])
  })

  it('uses a row header for the label, so the table stays readable to a screen reader', () => {
    renderPDP({ material: 'Nitrile' })
    const row = within(specTable()!).getByRole('row')
    expect(within(row).getByRole('rowheader').textContent).toBe('Material')
  })
})
