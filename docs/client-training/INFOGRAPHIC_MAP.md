# Infographic Source Map

Information architecture for the client-facing visual, matching the
implementation on branch `shopify-client-training-wiring`. Every arrow is a
**verified** relationship — see
[SHOPIFY_TO_STOREFRONT_MAP.md](SHOPIFY_TO_STOREFRONT_MAP.md).

**Scope discipline:** this is deliberately **15 relationships**, not every
metafield in Shopify. The goal is a graphic Juliette can hold in her head. The
full field list lives in the client guide.

## Layout

```text
     SHOPIFY                CUSTOM SITE LOGIC              WHAT THE CUSTOMER SEES
 (what Juliette edits)     (how the site reads it)            (where it appears)
```

## Visual key

| Style | Meaning |
| --- | --- |
| **Solid arrow** | Direct — edit it, it shows |
| **Dashed arrow** | Conditional — needs a second condition |
| **Red ✕ stub** (stops in column 1) | Exists in Shopify, the site never reads it |
| **Grey block in column 3** | Fixed website text, no Shopify input |

Three callout labels:

- 🚫 **"Does not control the website category"**
- ⚙️ **"Automatic — nothing to maintain"**
- 🔒 **"Ask a developer first"**

---

## 1. Product Basics — 5 relationships

| SHOPIFY | CUSTOM SITE LOGIC | CUSTOMER SEES |
| --- | --- | --- |
| **Title** | used as-is | → Product heading |
| **Images** | variant image first, then the rest | → Product gallery |
| **Variants** (Color, Size) | only the option values Shopify offers | → Option buttons |
| **Variant price** | per-variant | → Price, and the price on each button |
| **Brand Name** *(metafield)* | `custom.brand_name` — never Vendor | → Teal brand line above the title |

**Callout under Variants:**
> *Withdraw a colour or size in Shopify and the site stops offering it. Leave one
> option value and the selector disappears entirely — there is nothing to choose.*

**Callout under Brand Name:**
> *Vendor is who ships it. Brand Name is what customers see. They differ on about
> half the catalogue — that's why the site never uses Vendor as a brand.*

---

## 2. Category Placement — 3 relationships (**the centrepiece**)

Give this panel the most space. Draw **three green paths** and **two red stubs**.

```text
✅  Tag  category:home-care ─────────► department registry ──► DEPARTMENT
                                                              + breadcrumb step 1

✅  Tag  subcategory:shower-commodes ► subcategory tree ─────► SUBCATEGORY PAGE
                                                              + breadcrumb step 2

✅  Tag  "Shower Commode"  ──────────► Shopify automated ────► THE PRODUCT GRID
     (plain, no colon)                  collection              on the category page

🚫  Shopify Product Category ───✕     never read
🚫  Product Type ──────────────✕      never read (a /search filter only)
```

**The single most important callout on the whole graphic — box it:**

> **Placing a product takes TWO kinds of tag.**
> The `category:` / `subcategory:` tags decide the **breadcrumb and department**.
> The plain tag (e.g. `Shower Commode`) fills the **collection**, which is what
> the category grid lists.
> Only one of the two → the product is half-placed.
> **Copy both from a similar product.**

**Supporting callouts:**

- 🚫 on Shopify Product Category — *"Safe to fill in for Google Shopping. Does nothing here."*
- 🚫 on Product Type — *"The 'Type' filter is a different field — the Type metafield."*

**Breadcrumb strip** (small, beneath the panel):

```text
Home  →  Home Care  →  Shower Commodes  →  Folding Rehab Shower Commode Chair
            ▲                 ▲                          ▲
     category:home-care  subcategory:shower-commodes   product title
```

---

## 3. Product Details — 3 relationships

| SHOPIFY | CUSTOM SITE LOGIC | CUSTOMER SEES |
| --- | --- | --- |
| **Order Size** + **Units per Order** | variant value wins, else product value | → **UNIT / QUANTITY** box above Add to Cart, and the Order Packaging tab |
| **Specification metafields** — Material, Colour, Sterility, Size, Type, Glove Size, Needle Gauge, Features … | populated → row; blank → no row | → **Specifications table** *(and the category filters)* |
| **Shipping & Returns** | rich text | → **Vendor Shipping & Returns** tab *(blank → the tab disappears)* |

**Callout on the specifications row — this is new behaviour, make it visible:**
> *Fill one in and it appears. Leave it blank and the row simply isn't there.
> A product with no specifications shows no table — nothing looks broken.
> These same fields also build the filters, so accuracy does double duty.*

Small note beside it: *Customer Filter Category and Certification are
**filters only** — they never appear on the product page.*

---

## 4. Special States — 3 relationships

Three mini-flows, because the logic genuinely differs.

**RX Only**

```text
Metafield RX Only ✓  ──►  🔴 "RX Only" badge
                          + checkout blocked until account + prescription upload
```

**Backorder**

```text
Metafield Backorder ✓ ─────────────►  🟡 "Backorder" badge
Estimated Restock Date  ─ ─ ─ ─ ─ ─►  becomes "Backorder, ships <date>"
                                       (ignored if the date has passed)

Backorder Restock ETA ──✕  not used     Stock level ──✕  never creates this badge
```

**Free Shipping** — draw as an **AND gate**:

```text
Metafield Free Shipping ✓ ──┐
Shipping data confirms FREE ─┼─ AND ─►  🟢 "Free Shipping" badge
                             ┘          otherwise → "Shipping calculated at checkout"
```

**Callout:** *Ticking the box alone does not create the badge. And it's messaging
only — it does not change what Shopify charges.*

**Grey static block — place it deliberately next to Free Shipping:**

```text
┌────────────────────────────────────────────┐
│  🛡 QUALITY CERTIFIED                       │
│  🚚 FAST SHIPPING                           │
│  ↺ RELIABLE FULFILLMENT                    │
│                                            │
│  Fixed website text. On every product.     │
│  "FAST SHIPPING" is NOT the Free Shipping  │
│  metafield.                                │
└────────────────────────────────────────────┘
```

Small red stub: *Custom Badge 1/2/3 and Custom Dynamic Badge — not connected.*

---

## 5. Recommendations — 2 relationships

```text
Search & Discovery                      ┌──────────────────────────┐
  Complementary products  ──────────►   │  FREQUENTLY BOUGHT WITH  │  ← you pick these
                                        └──────────────────────────┘

Shopify automatic                       ┌──────────────────────────┐
  Related products  ──► first 4 ────►   │  YOU MAY ALSO LIKE       │
  (Shopify picks)                       └──────────────────────────┘
        │                               ┌──────────────────────────┐
        └──────────► items 5+ ──────►   │  YOU MAY ALSO NEED       │
                                        └──────────────────────────┘
```

**Boxed callout:**
> **"You May Also Need" is NOT your Complementary products.**
> It's the overflow of Shopify's automatic Related list — the same list behind
> "You May Also Like". Complementary products go to **"Frequently Bought With"**,
> and that's the only row you control directly.

---

## 6. SEO & Visibility — 2 relationships

| SHOPIFY | CUSTOM SITE LOGIC | CUSTOMER SEES |
| --- | --- | --- |
| **Search engine listing** — title & description | brand suffix added **once**, only if not already there | → Browser tab + Google result |
| **Status: Active / Draft** | Draft = removed from the site entirely | → Whether the page exists at all |

**Callouts:**

- ⚙️ beside the title row — *"You don't need to type '| MDSupplies'. The site adds it, and won't double it."*
- On Status — *"This is how you add or remove a product. **Use Draft, never Delete.**"*
- 🔒 on **URL handle** (red stub in column 1) — *"Ask a developer first — changing it breaks every existing link."*

**Timing badge for the whole graphic footer:**
> ⏱ **Changes appear within seconds to a few minutes — including category
> changes.**

---

## Footer line for the graphic

> **Two tags place a product: `category:` sets the breadcrumb, the plain tag fills
> the collection. Metafields fill the specs and the filters. Product Category and
> Product Type do nothing here.**

---

## Relationship count

| Section | Arrows |
| --- | --- |
| Product Basics | 5 |
| Category Placement | 3 (+2 red stubs) |
| Product Details | 3 |
| Special States | 3 |
| Recommendations | 2 |
| SEO & Visibility | 2 |
| **Total** | **18 arrows, 15 of them "edit this → see that"** |
