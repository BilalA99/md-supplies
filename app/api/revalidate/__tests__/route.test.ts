import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'node:crypto'

const WEBHOOK_SECRET = 'test-webhook-secret'

vi.mock('@/lib/env.server', () => ({
  serverEnv: {
    get shopifyWebhookSecret() {
      return WEBHOOK_SECRET
    },
  },
}))

const revalidateTag = vi.fn()
vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}))

vi.mock('@/lib/log-error', () => ({ logServerError: vi.fn() }))

import { POST } from '../route'

function sign(body: string): string {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(body, 'utf8').digest('base64')
}

function webhook(topic: string, payload: Record<string, unknown>, opts: { hmac?: string | null } = {}) {
  const body = JSON.stringify(payload)
  const headers = new Headers({ 'x-shopify-topic': topic })
  const hmac = opts.hmac === undefined ? sign(body) : opts.hmac
  if (hmac !== null) headers.set('x-shopify-hmac-sha256', hmac)
  return new Request('https://example.test/api/revalidate', { method: 'POST', body, headers })
}

/** Tag names passed to revalidateTag across all calls. */
function invalidatedTags(): string[] {
  return revalidateTag.mock.calls.map((call) => call[0] as string)
}

beforeEach(() => {
  revalidateTag.mockClear()
})

describe('Shopify revalidation webhook — authentication', () => {
  it('rejects a request with no HMAC header and invalidates nothing', async () => {
    const res = await POST(webhook('products/update', { handle: 'x' }, { hmac: null }))
    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('rejects a forged HMAC and invalidates nothing', async () => {
    const res = await POST(webhook('products/update', { handle: 'x' }, { hmac: 'not-the-real-signature' }))
    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('rejects a body that was tampered with after signing', async () => {
    const signedBody = JSON.stringify({ handle: 'original' })
    const headers = new Headers({
      'x-shopify-topic': 'products/update',
      'x-shopify-hmac-sha256': sign(signedBody),
    })
    const tampered = new Request('https://example.test/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ handle: 'swapped' }),
      headers,
    })
    const res = await POST(tampered)
    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})

describe('Shopify revalidation webhook — product topics', () => {
  // The regression this file exists for: a product edit refreshed the PDP
  // within seconds but left the category tag scan serving pre-edit data for up
  // to an hour, because 'category-tree' was never invalidated here.
  it('invalidates the category tag scan, so category placement is not stale for an hour', async () => {
    const res = await POST(webhook('products/update', { handle: 'toothbrush-tube-clear' }))
    expect(res.status).toBe(200)
    expect(invalidatedTags()).toContain('category-tree')
  })

  it('invalidates the broad product tag and the per-handle tag', async () => {
    await POST(webhook('products/update', { handle: 'toothbrush-tube-clear' }))
    const tags = invalidatedTags()
    expect(tags).toContain('products')
    expect(tags).toContain('product:toothbrush-tube-clear')
  })

  it.each(['products/create', 'products/update', 'products/delete'])(
    'invalidates category-tree for %s, since any of them can change the tag set',
    async (topic) => {
      await POST(webhook(topic, { handle: 'some-product' }))
      expect(invalidatedTags()).toContain('category-tree')
    },
  )

  it('still invalidates the broad tags when the payload carries no handle', async () => {
    // Shopify delete payloads carry only an id.
    await POST(webhook('products/delete', { id: 12345 }))
    const tags = invalidatedTags()
    expect(tags).toContain('products')
    expect(tags).toContain('category-tree')
    expect(tags.some((t) => t.startsWith('product:'))).toBe(false)
  })

  it('uses the stale-while-revalidate profile, so a burst of edits cannot stampede', async () => {
    await POST(webhook('products/update', { handle: 'x' }))
    for (const call of revalidateTag.mock.calls) {
      expect(call[1]).toBe('max')
    }
  })
})

describe('Shopify revalidation webhook — collection topics', () => {
  it('invalidates the broad collection tag and the per-handle tag', async () => {
    await POST(webhook('collections/update', { handle: 'hygiene' }))
    const tags = invalidatedTags()
    expect(tags).toContain('collections')
    expect(tags).toContain('collection:hygiene')
  })

  // Collection membership rules do not change any product's category:/
  // subcategory: tags, which is the only thing the scan reads.
  it('does not invalidate the expensive category tag scan', async () => {
    await POST(webhook('collections/update', { handle: 'hygiene' }))
    expect(invalidatedTags()).not.toContain('category-tree')
  })
})

describe('Shopify revalidation webhook — unrelated topics', () => {
  it('ignores an unrelated topic without invalidating anything', async () => {
    const res = await POST(webhook('orders/create', { id: 1 }))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ignoredTopic: 'orders/create' })
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
