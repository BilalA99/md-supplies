import { describe, it, expect, vi, beforeEach } from 'vitest'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ data: { ok: true } }),
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'test.myshopify.com')
  vi.stubEnv('SHOPIFY_STOREFRONT_ACCESS_TOKEN', 'test-token')
})

describe('storefrontFetch request-level memoization', () => {
  it('calls fetch only once for two identical calls within the same request', async () => {
    const { storefrontFetch } = await import('../storefront')
    await storefrontFetch('query Foo { x }', { a: 1 })
    await storefrontFetch('query Foo { x }', { a: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
