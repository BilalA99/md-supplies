# Shopify → Storefront Map (Verified Technical Reference)

**Audience:** engineers. The client-facing version is
[CLIENT_PRODUCT_MANAGEMENT_MAP.md](CLIENT_PRODUCT_MANAGEMENT_MAP.md).

**Branch:** `shopify-client-training-wiring`, based on `origin/main` at
`ba35a14`.

**Method.** Every statement below was verified against the code on this branch
*after* the remediation described in §13, plus three read-only probes of the
live Shopify API on 2026-08-25:

- Storefront API — the reference product, a glove, a syringe and two diagnostic
  products, for real metafield values and shapes.
- **Admin API `metafieldDefinitions`** — the authoritative list of every PRODUCT
  and PRODUCTVARIANT definition with its `access.storefront`. This is what
  separates "not populated" from "not readable", a distinction the previous
  audit could only guess at.
- Storefront API — 60 products' `seo.title`, to size the brand-duplication bug.

No Shopify data was created, updated or deleted. No deploy.

**Reference products used for the end-to-end traces:**

| Purpose | Product | Handle |
| --- | --- | --- |
| Primary walkthrough | Dawn Mist Toothbrush Tube (`MILDTHLU0072NU`) | `toothbrush-tube-clear` |
| Rich specifications | 100 Nitrile Exam Gloves (`MED MNE5052`) | `100-nitrile-exam-gloves-pf-text-finger-cobalt-blue-small` |
| List-typed specifications | 12 Panel Multi-Drug Rapid Cups (`CLIA-MDRC-12`) | `12-panel-multi-drug-rapid-cups-clia-mdrc-12` |
| Category trace | Folding Rehab Shower Commode (`12022010`) | `folding-rehab-shower-commode-low-back-24in` |

## Verification legend

| Label | Meaning |
| --- | --- |
| **VERIFIED — CURRENTLY USED** | Code path proven: queried, normalized, and rendered. |
| **VERIFIED — STATIC UI** | Hardcoded in the frontend. No Shopify input at all. |
| **VERIFIED — NOT USED** | Present in Shopify (or in this codebase) but no live consumer. |
| **VERIFIED — NOT READABLE** | Definition exists, but `access.storefront = NONE`. A headless query cannot read it at all. |
| **VERIFIED — FALLBACK ONLY** | Read, but only as a secondary value behind another field. |
| **UNVERIFIED / NEEDS FOLLOW-UP** | Could not be proven from the codebase or a read-only probe. |

---

## 1. Data architecture

```text
Shopify Admin (product record)
        │
        │  Storefront API 2026-04, GraphQL, POST /api/2026-04/graphql.json
        │  token: SHOPIFY_STOREFRONT_ACCESS_TOKEN   (lib/shopify/storefront.ts)
        ▼
Named queries          lib/shopify/queries/{products,collections,search,cart,menu}.ts
        │
        ▼
normalizeProduct()     lib/shopify/normalize.ts       ({value} → string | null)
        │
        ▼
Route (server)         app/product/[slug]/page.tsx
                       app/category/[slug]/page.tsx → components/category/CategoryPageView.tsx
                       app/category/[slug]/[product]/page.tsx   (dual: L2 grid OR category-scoped PDP)
        │
        ▼
Display formatting     lib/shopify/metafield-value.ts  (list metafields → text)
                       lib/policy/rich-text.ts         (rich_text_field → paragraphs)
        │
        ▼
Components (client)    components/product/ProductView.tsx
                       components/category/CategoryResults.tsx
                       components/filters/FilterRail.tsx
```

**Two registries live in code, not in Shopify:**

| Registry | File | Governs |
| --- | --- | --- |
| Category tree | `lib/category-tree.ts` | The 25 top-level categories, their names, hub copy, nav group, route slug |
| Filter allowlist | `lib/filter-registry.ts` | Which facets may render, per route, and in what order |

Both are **default-deny**. A change in Shopify these registries do not recognise
has no storefront effect.

### 1.1 Caching and freshness — CHANGED

| Data | Revalidate | Cache tag | Webhook-invalidated? |
| --- | --- | --- | --- |
| Product (`GET_PRODUCT`) | 300 s | `product:<handle>` | Yes — `products/*` |
| Collection hero + grid | 300 s | `collection:<handle>` | Yes — `collections/*` |
| Full-catalog tag scan | 3600 s | `category-tree` | **Yes — `products/*` (added on this branch)** |
| Collection handle list (nav) | 3600 s | `collections` | Yes — `collections/*` |
| Main menu | 3600 s | `menu` | No |

Webhook receiver: `app/api/revalidate/route.ts` (HMAC-verified,
`app/api/revalidate/route.ts:62`).

> **This was the unexplained hour.** `category-tree` is the full-catalogue
> `category:`/`subcategory:` tag scan (`lib/category-tree-data.server.ts`). It is
> cached for 3600 s because the scan costs ~30 requests, and it was **not**
> invalidated by the webhook. So a product edit refreshed the PDP within seconds
> via `product:<handle>`, while the department, breadcrumb, subcategory lists and
> `/categories` tile counts kept serving the pre-edit scan until the hour ran
> out. `app/api/revalidate/route.ts:86` now invalidates it on every `products/*`
> topic. The 3600 s TTL stays as a backstop for a missed webhook, not as the
> primary mechanism.

**Expected propagation after the fix**, assuming the webhook is registered:

| Change in Shopify | Visible on the custom site |
| --- | --- |
| Title, description, price, images, metafields | Seconds (webhook) — otherwise ≤ 5 min |
| `category:` / `subcategory:` tag | Seconds (webhook) — otherwise ≤ 1 h |
| Collection membership | ≤ 5 min (membership is not in the webhook payload) |
| Status Active ↔ Draft | Seconds (webhook) — otherwise ≤ 5 min |

Invalidation uses the `'max'` (stale-while-revalidate) profile, so a burst of
product edits serves stale data while refreshing in the background rather than
blocking a request on 30 API calls.

> **CONFIRMED NOT REGISTERED (2026-08-25).** An Admin API
> `webhookSubscriptions` query returns **zero subscriptions** on this store — no
> `products/*`, no `collections/*`, nothing. **So the invalidation fix above is
> built but currently inert**, and real propagation today is the TTL column:
> ~5 minutes for product and collection data, **up to 1 hour for category
> placement**.
>
> Registering them is a production Shopify change and needs two things this
> repository cannot supply: the deployed public URL for `POST /api/revalidate`,
> and a signing secret matching `SHOPIFY_WEBHOOK_SECRET` in the deployed
> environment. A mismatched secret is indistinguishable from no webhook — the
> route returns 401 and the cache silently keeps serving stale data.

---

## 2. Field mapping

`ns.key` values are in the **`custom`** namespace unless stated.

### 2.1 Native Shopify product fields

| Shopify label | GraphQL field | Code | Customer sees it | Status |
| --- | --- | --- | --- | --- |
| Title | `title` | `GET_PRODUCT` | Product heading (+ ` — <Color>` when multi-colour) | **CURRENTLY USED** |
| Description | `descriptionHtml` ‖ `description` | `GET_PRODUCT` | Specifications tab → "Description" | **CURRENTLY USED** |
| Media | `images(first: 20)` | `useSelectedVariant` | Gallery + up to 6 thumbnails | **CURRENTLY USED** |
| Vendor | `vendor` | `PARTNERS` match; `resolveReturnPolicy` | **Never a brand.** Partner-link eligibility + "{Vendor} Return Policy" heading | **CURRENTLY USED (non-brand only)** |
| Tags | `tags` | `parseProductTags`, `resolveRxLabel` | Category placement, breadcrumb, RX badge | **CURRENTLY USED** |
| Collections | `collections(first: 10)` | — | **Nothing** — selected but never read on the PDP | **NOT USED** |
| SEO title | `seo.title` | `buildMetadata` | `<title>` | **CURRENTLY USED** |
| SEO description | `seo.description` | `buildMetadata` | `<meta name=description>` | **CURRENTLY USED** |
| Product Type | *not queried* | — | See §4 | **NOT USED** |
| Shopify Product Category | *not queried* | — | See §3 | **NOT USED** |
| Status / publishing | implicit | Storefront API | Whether the page exists | **CURRENTLY USED** (§11) |

### 2.2 Variant fields

| Shopify label | GraphQL field | Customer sees it | Status |
| --- | --- | --- | --- |
| Option name/values | `options { name values }` | "SELECT COLOR" heading + buttons — **authoritative; never widened from variants**, §6 | **CURRENTLY USED** |
| Variant selected options | `variants.nodes.selectedOptions` | Matches a chosen value to its variant. **Not** a source of offered values (§6) | **CURRENTLY USED** |
| Variant SKU | `variants.nodes.sku` | "SKU:" line, "Internal SKU", schema `sku` | **CURRENTLY USED** |
| Variant price | `variants.nodes.price` | Main price + per-button price | **CURRENTLY USED** |
| Compare-at price | `variants.nodes.compareAtPrice` | Strikethrough + "Save N%" | **CURRENTLY USED** |
| Variant availability | `variants.nodes.availableForSale` | "Out of Stock", disabled button | **CURRENTLY USED** |
| Variant image | `variants.nodes.image` | Gallery leads with it | **CURRENTLY USED** |
| Barcode | `variants.nodes.barcode` | Schema `gtin`, only if a checksum-valid GTIN | **CURRENTLY USED (conditional)** |
| Inventory quantity | `quantityAvailable` | — | **NOT USED** — declared in `lib/shopify/types.ts:81`, selected by no query (§13, D-5) |

### 2.3 Product metafields — FETCHED AND DISPLAYED

**Operational and packaging** (unchanged by this branch):

| Shopify label | `custom` key | Type | Customer sees it | Status |
| --- | --- | --- | --- | --- |
| Brand Name | `brand_name` | single_line_text | Brand line above title; "Brand Name" row; schema `brand`; GA4 `item_brand`; **Brand Name filter** | **CURRENTLY USED** |
| RX Only | `is_rx_only` | boolean | "RX Only" badge; cart/checkout gate | **CURRENTLY USED** |
| Backorder | `backorder` | boolean | "Backorder" badge | **CURRENTLY USED — sole trigger** |
| Estimated Back Order Restock Date | `estimated_back_order_restock_date` | date | Appended: "Backorder, ships \<date\>" when valid and ≤36 h stale | **CURRENTLY USED (conditional)** |
| Backorder Restock ETA | `backorder_restock_eta` | single_line_text | **Nothing** — queried, normalized, never rendered | **NOT USED** |
| Free Shipping | `free_shipping` | boolean | Narrows the Free Shipping badge (§8.4) — cannot create one | **CURRENTLY USED (gate only)** |
| Order Size | `order_size` | single_line_text | "UNIT" cell; Order Packaging tab; **Order Size filter** | **CURRENTLY USED** |
| Units per Order | `units_per_order` | multi_line_text | "QUANTITY" cell; Order Packaging tab | **CURRENTLY USED** |
| Shipping & Returns | `shipping_returns` | rich_text | Vendor Shipping & Returns tab (hidden when blank) | **CURRENTLY USED** |

**Structured specifications — ADDED ON THIS BRANCH.** All fifteen report
`access.storefront = PUBLIC_READ`. Selected at
`lib/shopify/queries/products.ts:176-223`, rendered at
`components/product/ProductView.tsx:194`.

| Spec row label | `custom` key | Type | Notes |
| --- | --- | --- | --- |
| Material | `material` | single_line_text | |
| Color | `color` | single_line_text | |
| Sterility | `sterility` | single_line_text | |
| Thickness | `thickness` | single_line_text | |
| Glove Size | `glove_size` | single_line_text | |
| Needle Gauge | `needle_gauge` | single_line_text | |
| Needle Length | `needle_length` | single_line_text | |
| Size / Length | `size_length_` | single_line_text | **Trailing underscore is the real key** |
| Use | `use` | single_line_text | |
| Features | `features` | single_line_text | |
| Other Features | `other_features` | **list**.single_line_text | Flattened for display |
| Type | `type` | **list**.single_line_text | Flattened; **not** Shopify Product Type |
| Tests For | `tests_for` | **list**.single_line_text | Flattened |
| Detectable Drugs | `detectable_drugs` | **list**.single_line_text | Flattened |
| Adulterants | `adulterants` | **list**.single_line_text | Flattened |

Plus `quantity_of_units` (single_line_text) — **FALLBACK ONLY**, the
product-level fallback behind `units_per_order` for the QUANTITY cell. Selected
but never given its own row.

> **The list types matter.** A `list.single_line_text_field` returns a JSON array
> string — `["Microalbumin","Creatinine"]` — not display text. Rendering `.value`
> raw would print brackets and quotes to the customer. The 12-panel drug cup
> carries twelve entries in `detectable_drugs`, so this is most of what the
> Testing category has to say about a product.
> `lib/shopify/metafield-value.ts:54` flattens them.

### 2.4 Variant metafields — FETCHED

| Shopify label | `custom` key | Type | Customer sees it |
| --- | --- | --- | --- |
| Manufacturer Item Number | `manufacturer_item_number` | single_line_text | "Mfr #:" line; Specifications row; schema `mpn` |
| Order Size | `order_size` | single_line_text | UNIT cell / Order Packaging (**wins over product level**) |
| Units per Order | `units_per_order` | multi_line_text | QUANTITY cell / Order Packaging (**wins over product level**) |
| Variant Description | `variant_description` | rich_text | Specifications → "Variant Details", suppressed if identical to the description |
| Inner Pack Quantity | `inner_pack_quantity` | number_integer | Order Packaging row (variant only, no fallback) |
| Packs Per Case | `packs_per_case` | number_integer | Order Packaging row (variant only, no fallback) |
| Total Order Quantity | `total_order_quantity` | number_integer | Order Packaging row (variant only, no fallback) |

Fallback rule (`lib/product/resolve-variant-value.ts`): the variant value wins;
the product value is used only when the variant's is blank **and** no sibling
variant declares a different value — conflicting siblings mean packaging is not
uniform, so nothing shows rather than the wrong quantity.

### 2.5 Definitions that exist but the storefront CANNOT read

`access.storefront = NONE`. **No query change can make these render.** Fixing
them is a Shopify Admin change to the definition.

| Shopify label | Key | Consequence |
| --- | --- | --- |
| **Customer Filter Category** | `custom.customer_filter_category` | Fully live as the **"Category" filter** (facets publish from the Search & Discovery index, separately from `product.metafield()`), but can never be displayed on the PDP |
| **Certification** | `custom.certification` | Registered as a filter (live on gloves only as of 2026-08-12); cannot be displayed |
| Google: Custom Product | `mm-google-shopping.custom_product` | Google Shopping only |
| Google variant fields | `mm-google-shopping.*` (11 variant defs) | Google Shopping only |

> Filterable and readable are two different switches in Shopify. Do not "fix"
> `customer_filter_category`'s definition on the strength of its facet working —
> the note at `lib/filter-registry.ts:107-115` explains why.

### 2.6 Definitions that exist, are readable, but are deliberately NOT wired

| Shopify label | Key | Actual type | Why not wired |
| --- | --- | --- | --- |
| Custom Badge 1 / 2 / 3 | `custom.custom_badge_1/2/3` | **boolean** | `ProductView.tsx:630` renders each badge as its own **text**. A boolean carries no label, so wiring these would print "true" to a customer. What each flag should *say* is a product decision |
| Custom Dynamic Badge | `custom.custom_dynamic_badge` | **file_reference** | An image, not text. The badge row renders strings |
| Product Labels | `custom.product_labels` | list.metaobject_reference | `lib/labels/shopify-labels.ts` implements this fully but `resolveShopifyLabels` is called **only from tests**. Inert |
| Internal SKU | `custom.sku` | single_line_text | Populated (`MILDTHLU0072NU` on the reference product), but the PDP uses the **variant's** `sku` field, which is per-variant and therefore more correct |
| Unit Size | `custom.unit_size` (variant) | single_line_text | Readable, no consumer in the code |
| Product rating | `reviews.rating`, `reviews.rating_count` | rating, number_integer | **Readable and populated-capable, but the Reviews tab is a placeholder.** See §13, D-10 |
| Related / Complementary products | `shopify--discovery--product_recommendation.*` | list.product_reference | The app's own storage. The code reads the same data through `productRecommendations`, which is the supported API — see §9 |
| Search boosts | `shopify--discovery--product_search_boost.queries` | list.single_line_text | Consumed by Shopify's own search ranking, not by this codebase |

Shopify's ~90 `shopify.*` standard taxonomy metafields (e.g.
`shopify.needle-gauge`, `shopify.material`) are all PUBLIC_READ but **unused** —
the site reads the `custom.*` equivalents the merchandising team maintains.

---

## 3. Shopify Product Category

**VERIFIED — NOT USED by this storefront.**

| Question | Answer |
| --- | --- |
| Queried? | No — absent from every query in `lib/shopify/queries/` |
| Affects category pages? | No — membership is `category:` tags (§5) |
| Affects filters? | No — the `filter.p.category` rule at `lib/filter-registry.ts:44` is referenced **only** by `ALL_ALLOWED_RULES` (`:361`), a list that exists for a guard test. No route registry includes it |
| Affects breadcrumbs? | No |
| Used by anything? | Shopify-side only: other sales channels, Google Shopping, Shopify taxonomy features |

The reference product's value is "Toothbrush Holders in Bathroom Accessories".
Changing it has no storefront effect.

---

## 4. Product Type

**VERIFIED — NOT USED for placement, with one narrow exception.**

`grep` for `productType` / `product_type` returns only:

- `lib/filter-registry.ts:43` — defines the `PRODUCT_TYPE` facet rule
- `lib/filter-registry.ts:335` — includes it in `SEARCH_FACET_RULES`
- `lib/filter-registry.ts:490` — accepts `productType` as a URL filter input
- `lib/filter-registry.ts:361` — the guard-test allowlist

It is **not selected by any GraphQL query**, so no rendering path can read it.

| Does changing Product Type affect… | Answer |
| --- | --- |
| Website category pages | **No** |
| Breadcrumbs | **No** — asserted by test, `lib/__tests__/category-tree.test.ts` |
| Category-page filters | **No** — no category route registers `PRODUCT_TYPE` |
| `/search` filters | **Yes** — the only live storefront effect, and only if Search & Discovery publishes a `filter.p.type` facet |
| Collection membership | Only if a Shopify **automated collection** uses it as a condition — a Shopify-side effect |
| Recommendations | Possibly, inside Shopify's own algorithm — **UNVERIFIED** and not observable from this repo |
| Navigation / PDP rendering / SEO | **No** |

**Live evidence that it is not a reliable grouping key**: the four Shower
Commode products carry `Shower Commode Chair`, `Shower Chair Commode` and
`Wheelchair Wheel` as Product Types, while all the commodes share one
`subcategory:shower-commodes` tag. The reference product's is `Personal Care`.

> **Why the client saw a product "appear" after editing Product Type.** Saving
> the product fires a `products/update` webhook and bumps `updatedAt`. Before
> this branch, that refreshed the PDP but not the tag scan, so a category change
> made an hour earlier surfaced at an unrelated moment — right after an unrelated
> Save. The Product Type edit was coincidental, not causal. With §1.1 fixed, the
> tag change itself now propagates immediately.

> **Do not confuse `productType` with `custom.type`.** The "Type" filter and the
> "Type" specification row are both the **metafield** `custom.type`
> (`lib/filter-registry.ts:83`), not Shopify's Product Type field.

---

## 5. Category placement — the definitive model

### 5.1 Two independent tag systems

The live catalogue uses **two different kinds of tag**, and they are not the same
field. Verified on the reference products:

```text
Toothbrush Tube tags:
  category:hygiene              ← HIERARCHY tag  (prefixed)
  subcategory:toothbrush-holder ← HIERARCHY tag  (prefixed)
  Toothbrush Holder             ← COLLECTION-MEMBERSHIP tag (bare, human-readable)
  brand:dawn-mist, partner:dukal, industry:*, shipping:free, OCC

Shower Commode tags:
  category:home-care            ← HIERARCHY tag
  subcategory:shower-commodes   ← HIERARCHY tag
  Shower Commode                ← COLLECTION-MEMBERSHIP tag
  brand:everest-jennings, partner:graham-field, industry:*
```

| Tag kind | Example | Consumed by | Controls |
| --- | --- | --- | --- |
| **Hierarchy** | `category:hygiene`, `subcategory:toothbrush-holder` | `lib/category-tree.ts` (this codebase) | Department, subcategory, breadcrumb, `/categories` counts, L2 pages |
| **Collection membership** | `Toothbrush Holder`, `Shower Commode` | **Shopify automated collection rules** | Which Shopify collection the product joins → which products the category grid lists |

**Neither replaces the other.** A product needs both to be fully placed.

### 5.2 The chain

```text
category:hygiene ──────────────► lib/category-tree.ts ──► department, breadcrumb,
subcategory:toothbrush-holder ─►  (25 hardcoded L1 rows)   /categories tile counts,
                                                            L2 subcategory page

"Toothbrush Holder" (bare tag) ─► Shopify automated ─► collection handle ─► the
                                   collection rule       (e.g. hygiene)      PRODUCT GRID
                                                                              on the
                                                                              category page

lib/category-tree.ts collectionHandle ─► /category/<handle> route + nav link
```

`lib/category-tree.ts:1-4` states it outright: the registry is sourced from tags,
"never from the Shopify collection list (that legacy source only reached 51% of
the catalog)".

### 5.3 Which products the grid shows

`L1CategoryDef.productSet` (`lib/category-tree.ts:85`):

- **`'collection'` (22 of 25)** — grid = the Shopify collection's products.
- **`'tag'` (3)** — grid = `tag:"category:<tag>"` via `Query.search`, because the
  collection is a narrow artwork proxy. Measured 2026-08-12: `room-furniture`
  512 vs 8 (`seating`), `apparel` 152 vs 34 (`capes-gowns`), `face-masks` 35 vs 1
  (`face-coverings`).

So for Hygiene (a `'collection'` category), a product needs the `hygiene`
collection to appear in the grid **and** `category:hygiene` for the breadcrumb
and tile count.

### 5.4 Department precedence — CHANGED ON THIS BRANCH

`getProductCategoryPath` (`lib/category-tree.ts:413`) now resolves in this order:

```text
0. Boundary subcategory → its canonical parent wins outright   (3 subcategories)
1. The product's own explicit category: tag, when it names a real L1
2. The matched subcategory's parent L1 (inferred fallback)
3. Nothing → the caller shows a neutral "Shop" crumb
```

**What changed.** The function previously checked the subcategory **first** and
took `subcategory.parentTag` whenever one matched, consulting the product's own
`category:` tag only when no subcategory did. That meant an *inferred* department
— the statistically dominant parent of that subcategory across the whole
catalogue, computed in `buildL2Tree` — silently overrode an *explicit* one the
merchant had set. Editing `category:` on a product could appear to do nothing,
because other products sharing its subcategory outvoted it. That is unexplainable
to a merchant and directly contradicts the training message.

**The one exception, deliberately kept** (`lib/category-tree.ts:420`). A
*boundary* subcategory is one that plausibly belongs under two departments —
`BOUNDARY_L1_OVERRIDES` at `lib/category-tree.ts:233` declares three:
`barrier-sleeves`, `vital-sign-monitors`, `exam-tables`. For these the canonical
parent still wins, because the canonical parent is what **mints the
subcategory's URL**. Letting each product choose its own department would make
`/category/room-furniture/exam-tables` and `/category/exam-room/exam-tables` both
live, split internal links between them, and give one page two indexable
addresses — the exact duplicate-address problem `getCategorySlug` exists to
prevent. Boundary subcategories are identified structurally, by carrying a
`crossLinkParentTag`, which `buildL2Tree` sets only for those three entries out
of ~790.

`PRODUCT_CATEGORY_OVERRIDES` (4 handles) still outranks the raw tag — it exists
to correct products whose own tags are wrong.

### 5.5 Verified breadcrumbs (rendered live on this branch)

| Product | Breadcrumb | Source |
| --- | --- | --- |
| Toothbrush Tube | Home → **Hygiene** → **Toothbrush Holder** → product | `category:hygiene`, `subcategory:toothbrush-holder` |
| Shower Commode `12022010` | Home → **Home Care** → **Shower Commodes** → product | `category:home-care`, `subcategory:shower-commodes` |
| Nitrile Exam Gloves | Home → **Gloves** → **Exam Gloves** → product | `category:gloves`, `subcategory:exam-gloves` |
| 12 Panel Rapid Cups | Home → **Testing** → **12 Panel** → product | `category:testing`, `subcategory:12-panel` |

The subcategory crumb links to `/category/<department>/<subcategory>` — e.g.
`/category/home-care/shower-commodes`, verified rendering 10 of 10 products.

### 5.6 Navigation

**VERIFIED — code-controlled, not Shopify-menu-controlled.**

`components/layout/Header.tsx:195` and `components/layout/Footer.tsx:37` both call
`buildCategoryTreeNav(collections)`, which iterates the hardcoded
`CATEGORY_TREE_L1` and keeps only rows whose `collectionHandle` is in the live
handle list. The Shopify `main-menu` **is** fetched (`app/layout.tsx:57`) but only
supplies top-level items whose `type !== 'CATALOG'`.

Editing the Shopify navigation menu does **not** change the Categories mega-menu.
Adding a 26th department requires a code change.

### 5.7 Other tag namespaces

| Prefix | Consumer | Status |
| --- | --- | --- |
| `category:` / `subcategory:` | `lib/category-tree.ts` | **CURRENTLY USED** |
| `industry:` | `lib/industries.ts` — 5 values | **CURRENTLY USED** (industry landing pages) |
| `compliance:rx-only`, `rx-required` | `lib/rx-gate.ts`, `lib/labels/labels.ts` | **CURRENTLY USED** |
| **Bare human-readable** (`Toothbrush Holder`, `Shower Commode`, `OCC`) | **Shopify automated collection rules** | **CURRENTLY USED — by Shopify, not by this code** |
| `brand:` | only `BLOCKED_TAG_PATTERNS` | **NOT USED** — brand is `custom.brand_name` |
| `partner:` | only `BLOCKED_TAG_PATTERNS` | **NOT USED** — partner pages match Shopify `vendor` against `lib/partners.ts` |
| `shipping:` / `free-shipping` | only `BLOCKED_TAG_PATTERNS` | **NOT USED** — `labels.ts:6-8` forbids a tag creating a shipping promise |
| `discontinued`, `consolidation-duplicate` | only `BLOCKED_TAG_PATTERNS` | **NOT USED** for behaviour; blocked from the UI |

All prefixed tags are hard-blocked from surfacing as filter values, in two
places: the `filter.p.tag` facet is denied wholesale, and every string inside a
URL-supplied filter object is pattern-checked (`lib/filter-registry.ts:146-156`).

---

## 6. Variants and options — CHANGED ON THIS BRANCH

### 6.1 `options.values` is authoritative — and why that is not obvious

Verified live for `toothbrush-tube-clear`:

```text
Storefront API
  options:  [{ name: "Color", values: ["Clear"] }]      ← ONE value
  variants: Clear (MILDTHLU0072NU, Color=Clear, $46.30, availableForSale: true)
            Blue  (MILDTHLU0072BU, Color=Blue,  $45.55, availableForSale: true)

Admin API
  parent  toothbrush-tube-clear     ACTIVE, published to "Md Supplies Headless"
          Color optionValues: Clear, Blue      variants: Clear, Blue
  child   toothbrush-tube-lg-blue   ARCHIVED, publishedAt: null   SKU MILDTHLU0072BU
```

The two APIs disagree, and the disagreement is **meaningful, not a bug**. There
is a separate product for the Blue tube, it is ARCHIVED and published to no
channel, and the merchant withdrew it deliberately. Storefront's
`options.values` is expressing exactly that decision by omitting Blue.

**It is the `variants` connection that over-reports**, still returning a variant
whose backing product is unpublished — and still reporting it
`availableForSale: true`.

> **This was misdiagnosed once, and the mistake is worth recording.** An earlier
> pass on this branch read the short `options.values` list as Shopify
> under-reporting, and "fixed" it by recovering Blue from
> `variant.selectedOptions`. That put a deliberately-withdrawn product back on
> sale, with a working price and Add to Cart button. The change was reverted.
>
> The rule that follows: **a value missing from `options.values` is a
> merchandising decision, not a data gap.** Never widen the offered set from
> `variants`.

### 6.2 Current behaviour

`ProductView` reads `product.options` directly. A single declared value means no
selector, which is correct for this product: Clear is the only thing offered.

`components/product/ProductView.tsx` carries the full note, and
`components/product/__tests__/ProductView.test.tsx` pins it with four regression
tests so the "fix" cannot be reintroduced.

### 6.3 Withdrawing a variant — the supported, self-service path

**This is the procedure to give the client.** In Shopify: open the product,
Manage publishing, and turn the variant off for **Md Supplies Headless**.
Nothing else is needed, and it is fully reversible.

What the storefront does with that, as of this branch:

| Surface | Behaviour |
| --- | --- |
| Option selector | The value is gone. One remaining value → no selector at all |
| Price / SKU / Add to Cart | Cannot resolve to the withdrawn variant |
| `Product` JSON-LD | Never advertises the withdrawn SKU |
| Packaging fallbacks | Sibling checks ignore it, so it cannot suppress a shared value |
| An existing `?variant=` link | **Redirects to the clean product URL**, keeping utm/gclid |

`lib/product/offered-variants.ts` narrows `product.variants` to those whose
`selectedOptions` all still appear in `options.values`, before anything reads
them. It is applied in **both** PDP routes so they cannot drift.

It **fails open by design**: if narrowing would leave nothing sellable — a
malformed options list, values that match no variant — the original list is
returned untouched. Hiding a real product is a worse failure than showing a
withdrawn one, so this can never empty a product page.

### 6.4 Stale `?variant=` links

`lib/product/stale-variant-url.ts` + `redirect()` in both PDP routes. A variant
parameter that no longer names an offered variant (withdrawn, deleted, or plain
garbage) sends the shopper to the clean product URL.

**Not a 404**, deliberately: the product is still on sale, only one of its
colours is gone. A 404 would break every bookmark and discard the link equity of
an indexed URL to say something untrue.

**SEO.** `?variant=` URLs already carry a canonical pointing at the clean product
URL (`buildCanonical`, strategy `base-product`), so Google consolidates them
either way. The redirect is additive: it takes the stale parameter out of
circulation at the point of use, so shoppers stop re-sharing a dead link. The
destination is exactly the canonical, so the two can never conflict.

Because both PDP routes have a `loading.tsx`, they stream — the 200 shell is
flushed before the page body runs, so Next cannot emit a redirect *header*.
Verified live, it emits both of these instead, which is standard Next behaviour
for a streamed route:

```text
NEXT_REDIRECT;replace;/product/toothbrush-tube-clear;307    ← client navigation
<meta http-equiv="refresh" content="1;url=/product/toothbrush-tube-clear">  ← no-JS
```

So a browser cleans the URL immediately, a non-JS crawler follows the meta
refresh, and anything that reads neither still gets the correct default-variant
content under a canonical pointing at that same URL. Tracking parameters are
carried through the redirect; only `variant` is dropped.

**Verified live** (2026-08-25, against the real withdrawn Blue variant):

| Request | Result |
| --- | --- |
| `?variant=<Blue, withdrawn>` | → `/product/toothbrush-tube-clear`; zero occurrences of `MILDTHLU0072BU` in the page |
| `?variant=<Clear, offered>` | No redirect — deep link still works |
| `?variant=nonsense` | → `/product/toothbrush-tube-clear` |
| `?variant=<Blue>&utm_source=newsletter&utm_campaign=spring` | → same, both utm params preserved |

Before this change the same Blue link rendered
`SKU: MILDTHLU0072BU · $45.55 · Add to Cart` and advertised that SKU in the
Product JSON-LD.


---

## 7. Filters

### 7.1 The gate

`getAllowedFacets(routeSlug, facets, kind, activeInputs)` —
`lib/filter-registry.ts:405`:

1. **Default-deny.** `filter.p.tag*` and `filter.p.vendor` are hard-blocked; then
   anything not allowlisted for this route is dropped.
2. **Registry order.** Shopify's order is discarded; array position is display order.
3. **Relevance.** A group whose every value has count 0 is not emitted
   (`PRICE_RANGE` exempt). A selected value keeps its group alive.

### 7.2 Which Shopify field becomes which filter

| Shopify field | Filter? | Pages | Notes |
| --- | --- | --- | --- |
| `custom.customer_filter_category` | **Yes — "Category"** | All 25 categories, Trocars, 5 industries, OCC | Lead facet **and** the Category tab row (`CategoryResults.tsx:170`). Not displayable (§2.5) |
| `custom.type` | Yes — "Type" | Most | The metafield, **not** Product Type |
| `custom.material`, `size_length_`, `glove_size`, `needle_gauge`, `needle_length`, `thickness`, `features`, `other_features`, `sterility`, `use`, `color`, `tests_for`, `detectable_drugs` | Yes | Per-route, see registry | Same fields that now also render as spec rows |
| `custom.order_size`, `custom.brand_name`, `custom.certification` | Yes — shared tail | Every route | Certification live on gloves only |
| `custom.adulterants`, `volume`, `weight` | Registered, **not live** | — | Fail closed until published |
| Price | Yes | Every route | |
| Availability | Only on routes with no registry entry | Fallback | |
| **Product Type** | **`/search` only** | `/search` | §4 |
| **Vendor** | **Never — hard-denied** | — | Vendor is the fulfiller |
| **Raw tags** | **Never — hard-denied** | — | |
| **Shopify Product Category** | **Never** | — | §3 |

Live verification, `/category/hygiene` (256 products): Category, Type, Size,
Features, Other Features, Use, Color, Order Size, Brand Name — exactly the
registry entry, minus groups with no values.

### 7.3 Four conditions for a facet to appear

1. The definition is **filterable** in Shopify.
2. Search & Discovery publishes it.
3. `lib/filter-registry.ts` allowlists it **for that route**.
4. At least one value has a non-zero count for the current product set.

Editing a metafield **value** re-buckets a product. Creating a **new** filter
needs a code change.

---

## 8. Product page mapping

### 8.1 Hero

| Element | Source | Status |
| --- | --- | --- |
| Breadcrumb | Tag-derived (§5.4) | **CURRENTLY USED** |
| Brand line | `custom.brand_name` only; hidden when absent, **never** falls back to `vendor` | **CURRENTLY USED** |
| Brand links to partner | `vendor` matches an active `lib/partners.ts` row **and** a brand exists | **CURRENTLY USED (conditional)** |
| Title | `product.title` + ` — <Color>` when multi-colour | **CURRENTLY USED** |
| `SKU:` | Selected **variant's** `sku` | **CURRENTLY USED** |
| `Mfr #:` | Variant `custom.manufacturer_item_number`, hidden when blank | **CURRENTLY USED** |
| "Out of Stock" | `!variant.availableForSale` and not backordered | **CURRENTLY USED** |
| *No* "In Stock" text | Deliberate — vendor inventory is not real time | **STATIC UI (absence by design)** |
| UNIT / QUANTITY box | Resolved `order_size` / `units_per_order` | **CURRENTLY USED** |
| Price / compare-at / "Save N%" | Variant fields | **CURRENTLY USED** |
| "Contact for pricing" | Variant price ≤ 0 | **CURRENTLY USED** |

### 8.2 Trust indicators — VERIFIED — STATIC UI

`components/product/ProductView.tsx:514` is a literal three-element array:
`QUALITY CERTIFIED`, `FAST SHIPPING`, `RELIABLE FULFILLMENT`. All three render on
**every** product, unconditionally, reading no Shopify field.

> **"FAST SHIPPING" is unrelated to `custom.free_shipping`.** One is static
> decorative copy; the other is the gated claim in §8.4. They must never be
> explained as the same thing.

### 8.3 Tabs

| Tab | Source | When empty | Status |
| --- | --- | --- | --- |
| **Specifications** | Manufacturer Item Number (variant), Internal SKU (variant), Brand Name, Description, Variant Details, **specifications table** (§2.3) | Internal SKU always renders; each other block hides individually; the table is omitted entirely when no spec has a value | **CURRENTLY USED** |
| **Order Packaging** | Order Size, Units Per Order, Inner Pack Quantity, Packs Per Case, Total Order Quantity | "Packaging information unavailable for this option." | **CURRENTLY USED** |
| **Vendor Shipping & Returns** | `custom.shipping_returns` (rich text, **bold preserved**); heading `"{vendor} Return Policy"` | **The whole tab is removed from the tab bar.** General policy stays at `/returns` | **CURRENTLY USED** |
| **Reviews** | Literal string | Always "Reviews are not yet available for this product." | **STATIC UI** (§13, D-10) |

**Specifications rendering rules** (`ProductView.tsx:194`, verified by 15 tests):

- Row order is fixed and unchanged — general attributes before category-specific.
- A row renders only when its value formats to something non-empty.
- `null`, `''`, whitespace-only, and `[]` all resolve to nothing — no blank cells,
  never the literal text `null`.
- List values are joined with `", "`; brackets and quotes never reach the page.
- Irrelevant fields do not appear: a toothbrush tube shows no Needle Gauge row.

**Verified live:**

| Product | Rendered rows |
| --- | --- |
| Nitrile Exam Gloves | Material: Nitrile · Color: Blue · Thickness: 3.5 mil · Glove Size: Small · **Type: Exam** (from `["Exam"]`) |
| 12 Panel Rapid Cups | **Detectable Drugs:** all twelve, comma-joined, zero JSON leakage |
| Toothbrush Tube | *No table* — this product has no spec metafields populated |
| Shower Commode | *No table* — same |

### 8.4 RX / Backorder / Free Shipping / badges

Badge order is fixed: **RX (10) → Backorder (20) → Free Shipping**.

**RX Only** — `lib/rx-gate.ts`. Unverified-unchanged by this branch.

- **UNION:** `compliance:rx-only` tag **OR** `rx-required` tag **OR**
  `custom.is_rx_only ∈ {true,1,yes}`. Union is fail-safe: a disagreement can only
  widen the RX set. (2026-08-02 audit: metafield true on 501, tag on 461 — the tag
  set is a strict subset.)
- Badge text `RX Only`; screen-reader "Prescription required".
- Exemption: vendor `Dynarex`. The insulin-syringe exemption is scaffolded and
  returns `false` (`rx-gate.ts:73`).
- Cart/checkout: `cartRequiresRxGate` → `resolveGateStatus`. Signed-out RX carts
  block; signed-in block until a document is on file (customer metafields
  `compliance.rx_document` / `compliance.rx_verified`, written server-side).
- `RX_CHECKOUT_ENFORCEMENT` — **ON unless the exact string `"false"`**.
- Storefront UX gate only; the bypass-resistant control is a separate Shopify
  validation app. **Unchanged on this branch — not weakened.**

**Backorder** — `lib/labels/labels.ts:116`.

- **`custom.backorder` is the sole trigger.** Never inferred from inventory.
- When true, `custom.estimated_back_order_restock_date` is appended —
  `"Backorder, ships <date>"` — **only** if it parses and is within a 36-hour
  grace. Stale/unparseable/missing → plain `"Backorder"`.
- `custom.backorder_restock_eta` is fetched and normalized but **never rendered**.
  Only one ETA field can ever reach the customer, so the two cannot conflict.
- Does not change add-to-cart. A backordered *and* unavailable variant shows
  Backorder **instead of** "Out of Stock", never both.
- **Stale comments corrected on this branch** (§13, D-4).

**Free Shipping** — `lib/shipping-resolver/`. A claim requires **all three**:

1. `SHIPPING_RESOLVER_ENABLED === 'true'` (defaults to **disabled**).
2. The checksum-pinned `data/shipping-facts-v3.json` classifies the variant
   `public_display_class = standard-free` **and** its rate math independently
   confirms `effective_rate_class = FREE` (`isRatesOnlyClaimEnabled()` is
   hardcoded `true`; the env escape hatch was deliberately removed).
3. `custom.free_shipping ∈ {true,1,yes}`.

`gateFreeShippingClaim` can only **narrow**. A `true` boolean never manufactures a
claim. **Display messaging only** — it does not affect what Shopify charges at
checkout. The `free-shipping` *tag* is explicitly not an approved source.

**Custom / dynamic badges** — **NOT WIRED.** The definitions exist and are
readable, but their types (boolean, file_reference) do not match how the UI
renders badges. The only badges that render are RX, Backorder, Free Shipping.

---

## 9. Recommendations

One query, `lib/shopify/queries/products.ts:401`:

```graphql
related:       productRecommendations(productHandle: $handle, intent: RELATED)
complementary: productRecommendations(productHandle: $handle, intent: COMPLEMENTARY)
```

| Section | Source | Code |
| --- | --- | --- |
| **Frequently Bought With** | `intent: COMPLEMENTARY` — Search & Discovery "Complementary products" | `ProductView.tsx:722` — `complementaryProducts.slice(0, 4)` |
| **You May Also Like** | `intent: RELATED` — Shopify's algorithm | `ProductView.tsx:738` — `relatedProducts.slice(0, 4)` |
| **You May Also Need** | **`intent: RELATED`, items 5+** | `ProductView.tsx:778` — `relatedProducts.slice(4)` |

> **"You May Also Need" is NOT complementary products.** It is the overflow of the
> same RELATED list that fills "You May Also Like", rendered as a horizontal
> scroll row. It appears only when `relatedProducts.length > 4`, and renders
> whether or not complementary products are configured. Complementary products
> feed **"Frequently Bought With"**.

Verified live on the gloves product: "You May Also Like" and "You May Also Need"
both present, "Frequently Bought With" absent (no complementary products set).

Empty states render nothing — the section is omitted, not shown blank. The query
is wrapped in `.catch()`, so a failure degrades to no recommendations rather than
a 500. Cards use the shared `PRODUCT_CARD_FRAGMENT`, so brand, RX/Backorder and
Free Shipping match the category grid. `intent: RELATED`'s inputs are Shopify
internals — **UNVERIFIED** from this repo.

---

## 10. SEO — CHANGED ON THIS BRANCH

| Output | Source | Status |
| --- | --- | --- |
| `<title>` | `product.seo.title` ‖ `product.title`, then ` — MDSupplies` **if not already branded** and the total ≤ 60 chars | **CURRENTLY USED** |
| `<meta description>` | `product.seo.description` ‖ `"<brand> — <description>"` trimmed to 155 | **CURRENTLY USED** |
| Canonical | Always `/product/<handle>`, never variant-specific | **CURRENTLY USED** |
| Open Graph | Title/description + first product image; falls back to the branded default card | **CURRENTLY USED** |
| `og:type` | Literal `product` | **STATIC UI** |
| `Product` JSON-LD | name, description, image, sku, gtin, mpn, brand, price, availability, url, priceValidUntil (+30 d), shippingDetails, returnPolicy | **CURRENTLY USED** |
| `BreadcrumbList` JSON-LD | Tag-derived crumbs | **CURRENTLY USED** |

**The duplication fix.** Merchandising hand-writes the brand into `seo.title` on
part of the catalogue — **13 of 60 products sampled live** end in `| MDSupplies`.
Those then had ` — MDSupplies` appended, producing
`Dawn Mist Nail Brush, Box of 50 | MDSupplies — MDSupplies`. Worse, it was
*inconsistent*: the 60-character guard silently dropped the duplicate on longer
titles, so two products in the same family behaved differently.

`endsWithSiteName` (`lib/seo/metadata.ts:67`) now detects a title that already
ends with the site name — across `|`, `-`, `–`, `—`, `:`, `,` or plain whitespace,
case-insensitively — and `withBrandSuffix` (`:82`) appends only the part of the
suffix that adds information: nothing for the plain suffix, but ` Partner` /
` Blog` survive so a pre-branded partner page still reads as one.

**Verified live:** `Dawn Mist Toothbrush Tube, Clear | MDSupplies` — exactly one
brand mention. `Everest & Jennings Low Back Commode Chair 24 in — MDSupplies` —
unbranded source, suffix correctly appended.

Schema always describes the **resolved variant**. `brand` and `mpn` are omitted
entirely rather than emitted empty. Category pages consult a code-side SEO
database (`getCategorySeo`) that **overrides** Shopify's collection SEO on
unfiltered page 1; tag-sourced proxies and featured subcategories deliberately
ignore the collection's SEO fields. Filtered / sorted / searched / `per_page`
views are `noindex`.

> On a **product** page, Shopify's Search engine listing is authoritative. On a
> **category** page it often is not.

---

## 11. Publishing / status

The storefront applies no status logic of its own: `storefrontFetch` asks for the
handle and `notFound()`s on null (`app/product/[slug]/page.tsx:91`).

| Shopify state | Result |
| --- | --- |
| **Active** + published to the storefront's sales channel | Visible everywhere |
| **Active**, not published to that channel | **404**, and absent from collections, search, tag scans, recommendations |
| **Draft** | 404 |
| **Archived** | 404 |
| Published to Online Store only | Irrelevant — the custom site does not read that channel |

**To remove a product:** set it to **Draft** — instant, reversible, preserves the
record and order history. Deleting is irreversible and breaks historical order
references.

> **CONFIRMED (2026-08-25): the sales channel is "Md Supplies Headless".** The
> store's publications are Online Store, Shop, Point of Sale, Google & YouTube,
> Inbox and Md Supplies Headless; the reference product is published to that last
> one. It is the channel the client must tick for a product to appear.

---

## 12. Error handling

Four states are kept distinct so a technical failure is never shown as a
legitimately empty category:

| Condition | Behaviour |
| --- | --- |
| Valid collection, zero products | Renders the page with the empty-results state |
| Collection handle does not exist | `notFound()` → 404 |
| Storefront API failure (page 1) | Throws → `app/category/[slug]/error.tsx` → "Category Unavailable" with retry |
| Storefront API failure (page > 1) | Redirects to page 1 rather than erroring |
| Render/hydration failure | Same error boundary |

**Changed on this branch:** the full-catalogue tag scan is *ancillary* on both the
PDP (breadcrumb only) and the category page (subcategory links only), yet an
unguarded `await` meant one slow scan returned a 500 for a page whose own data had
already loaded. Both now degrade — the PDP falls back to a shorter breadcrumb, the
category page renders without subcategory links — and **log the failure**
(`product-breadcrumb-tag-scan`, `category-subcategory-tag-scan`), because a
permanently-failing scan is otherwise invisible.

---

## 13. Defects — status after this branch

| # | Defect | Status |
| --- | --- | --- |
| **D-1** | Specifications table never rendered — 15 metafields mapped and rendered but never selected | **FIXED.** §2.3, verified live |
| **D-2** | Custom Badge 1/2/3 never render | **DIAGNOSED, NOT WIRED.** Definitions exist and are readable, but are **boolean** while the UI renders badge **text**; `custom_dynamic_badge` is a file_reference. Wiring needs a product decision on what each flag says. Documented in the query at `products.ts` and in §2.6 |
| **D-3** | `<title>` doubled the brand | **FIXED.** §10 |
| **D-4** | Comments claimed the restock ETA is never displayed, while the code appends it | **FIXED** — the stale comments in `products.ts` were corrected; behaviour unchanged (§8.4) |
| **D-5** | `quantityAvailable` declared but never selected | **OPEN.** Harmless (always `undefined`); no consumer depends on it |
| **D-6** | Metaobject label system inert | **OPEN.** `custom.product_labels` is never queried; `resolveShopifyLabels` is test-only |
| **D-7** | `category-tree` not webhook-invalidated — the unexplained hour | **FIXED** in code (§1.1). **Requires webhook registration in Shopify Admin to take effect** |
| **D-8** | Dead components (`SpecsTable`, `ProductInfo`, `PackagingTable`, `ProductDescription`, `RelatedProducts`, `ProductVariantSelector`, `QuantityAddToCart`) | **OPEN.** Imported by nothing; left alone as out of scope |
| **D-9** | `filterRegistry['gifts-toys']` maps a non-existent handle | **OPEN.** Inert |
| **D-10** | Reviews tab is a permanent placeholder | **OPEN — with new information.** `reviews.rating` and `reviews.rating_count` exist as PUBLIC_READ definitions, so a real rating display is achievable without a third-party app. Out of scope here |
| **D-11** | *Withdrawn.* Read as "`options.values` under-reports"; it was Shopify correctly hiding a withdrawn variant. The change was reverted and the correct behaviour pinned by tests | **NOT A DEFECT.** §6 |
| **D-13** | The `variants` connection returns variants withdrawn from this sales channel, `availableForSale: true` — reachable and purchasable via `?variant=` | **FIXED.** §6.3–6.4: variants narrowed to what is offered, stale variant links redirected |
| **D-12** | Ancillary tag-scan failure 500s an otherwise-healthy page | **FIXED.** §12 |

### Shopify-side data issues (not code — do not fix in code)

| Issue | Evidence |
| --- | --- |
| `toothbrush-tube-clear` declares one Color option value but has two Color variants | Storefront API, 2026-08-25. Code now compensates (§6), but the underlying product data is still inconsistent and is worth correcting in Admin |
| Product Type is inconsistent within a family | `Shower Commode Chair` vs `Shower Chair Commode` on sibling commodes |
| `custom.customer_filter_category` and `custom.certification` are not storefront-readable | Admin API `access.storefront = NONE`. Blocks ever displaying them |

---

## 14. Unresolved / needs follow-up

| Item | Why it is still open |
| --- | --- |
| **Register the Shopify webhooks** | Answered: there are none. D-7's fix stays inert until they exist. Needs the deployed URL + matching secret — highest-value remaining action |

| What `intent: RELATED` weighs | Shopify-internal (§9) |
| Canonical RX tag | `labels.ts:41` — both `compliance:rx-only` and `rx-required` are live; "PENDING IZZY: confirm the canonical RX tag and retire the other" |
| Insulin-syringe RX exemption | `rx-gate.ts:73` — scaffolded, returns `false` |
| OCC collection handle | `occ-collection.ts:9` — "PENDING IZZY: confirm the canonical handle + GID" |
| Whether `custom.adulterants` / `volume` / `weight` facets exist | Registered but not returned by any sampled collection |
| End-to-end cache demonstration | Proving invalidation live requires editing a production product, which is out of bounds. Covered by unit tests instead (13 in `app/api/revalidate/__tests__/route.test.ts`) |
