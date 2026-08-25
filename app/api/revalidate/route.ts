import crypto from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { serverEnv } from '@/lib/env.server'
import { logServerError } from '@/lib/log-error'

// Shopify webhook receiver → on-demand cache invalidation (audit H1/M25).
//
// Point Shopify webhooks (products/create, products/update, products/delete,
// collections/create, collections/update, collections/delete) at
// POST /api/revalidate. The payload's HMAC is verified against
// SHOPIFY_WEBHOOK_SECRET, then the matching cache tags are revalidated with
// stale-while-revalidate semantics ('max' profile): the broad entity tag
// ('products' / 'collections') plus the per-handle tag when the payload
// carries a handle (delete payloads only carry an id).
//
// Tags are attached at the storefrontFetch call sites — see
// app/product/[slug], app/category/[slug], app/layout.tsx, etc.

function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false
  const digest = crypto
    .createHmac('sha256', serverEnv.shopifyWebhookSecret)
    .update(rawBody, 'utf8')
    .digest('base64')
  const a = Buffer.from(digest)
  const b = Buffer.from(hmacHeader)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return Response.json({ error: 'Unreadable body' }, { status: 400 })
  }

  try {
    if (!verifyShopifyHmac(rawBody, request.headers.get('x-shopify-hmac-sha256'))) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } catch (err) {
    // Missing SHOPIFY_WEBHOOK_SECRET — misconfiguration, not a bad request.
    logServerError('revalidate-webhook', err)
    return Response.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const topic = request.headers.get('x-shopify-topic') ?? ''
  let handle: string | undefined
  try {
    handle = (JSON.parse(rawBody) as { handle?: string }).handle
  } catch {
    // Tolerate an unparseable payload — the broad tag still revalidates.
  }

  const revalidated: string[] = []
  const invalidate = (tag: string) => {
    revalidateTag(tag, 'max')
    revalidated.push(tag)
  }

  if (topic.startsWith('products/')) {
    invalidate('products')
    if (handle) invalidate(`product:${handle}`)
    // Deletes/creates also change collection listings, but per-collection
    // membership isn't in the payload — the 300s fetch revalidate covers it.
    //
    // 'category-tree' is the full-catalog `category:`/`subcategory:` tag scan
    // (lib/category-tree-data.server.ts). It is cached for 3600s, an order of
    // magnitude longer than everything else here, because the scan costs ~30
    // requests. It was NOT invalidated by this webhook, which is the whole of
    // the unexplained "I edited the product an hour ago and the category still
    // hasn't changed" delay: the PDP refreshed within seconds via product:<handle>
    // while the department, breadcrumb, subcategory lists and /categories tile
    // counts all kept serving the pre-edit tag scan until the hour expired.
    //
    // Every products/* topic invalidates it because a product's TAGS are what
    // the scan reads, and a tag change arrives as an ordinary products/update
    // with nothing in the payload to distinguish it from a price edit. The
    // 3600s revalidate stays as the backstop for a missed or unregistered
    // webhook; this just stops the backstop from being the primary mechanism.
    //
    // Cost is bounded by the 'max' profile below: the stale scan keeps being
    // served while the refresh happens in the background, so a burst of product
    // edits cannot stampede the Storefront API or block a request on 30 calls.
    invalidate('category-tree')
  } else if (topic.startsWith('collections/')) {
    invalidate('collections')
    if (handle) invalidate(`collection:${handle}`)
  } else {
    return Response.json({ revalidated, ignoredTopic: topic })
  }

  return Response.json({ revalidated, topic })
}
