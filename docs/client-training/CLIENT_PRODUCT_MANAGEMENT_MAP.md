# Managing Products in Shopify — What Shows Up on MDSupplies.com

A plain-English guide to which Shopify fields control which parts of the website.

**The one-sentence version:** Shopify is where all product information lives. The
MDSupplies website reads *specific* Shopify fields and uses them to build the
product page, decide which category the product lands in, and build the filters
customers use.

**Three things to know before you start:**

1. **Not every field in Shopify shows on the website.** Some are for Google
   Shopping, some are for filters only, a few aren't used. This guide says which.
2. **Product changes appear in about 5 minutes. Category changes take up to an
   hour.** That's normal — don't start changing other fields to force it. (The
   code to make category changes instant is built but not switched on yet; ask
   the dev team.)
3. **Putting a product in a category takes two things,** not one. See
   "Where the product appears" below. This is the single most important section.

---

# What You Edit in Shopify

## Product basics

> **Shopify: Title**
> **Website:** The large product heading, and the browser tab.
> **Change this when:** The product name needs to change.
> *If the product has more than one colour, the website appends the selected one to the heading automatically — "Rollator — Blue". You don't type that. A product with a single colour gets no suffix.*

> **Shopify: Description**
> **Website:** The "Description" block inside the **Specifications** tab.
> **Change this when:** The product write-up needs updating. Bold, lists and links are kept.

> **Shopify: Media (images)**
> **Website:** The image gallery. Up to 6 thumbnails show.
> **Change this when:** You have better or corrected photography.

> **Shopify: Vendor**
> **Website:** **Not shown as the brand.** It only decides whether the brand name links to a partner page, and supplies the "{Vendor} Return Policy" heading.
> **Change this when:** The fulfilling supplier changes. **This is not the customer-facing brand** — use Brand Name.

> **Shopify metafield: Brand Name**
> **Website:** The teal brand line above the product title, the "Brand Name" row in Specifications, and the **Brand Name filter**.
> **Change this when:** The manufacturer's displayed brand needs to change.
> *If blank, no brand shows anywhere. The website will never fall back to Vendor.*

> **Shopify: Variant SKU**
> **Website:** The "SKU:" line under the title, and "Internal SKU" in Specifications.
> **Change this when:** The internal SKU changes. Each variant has its own.

> **Shopify metafield (variant): Manufacturer Item Number**
> **Website:** The "Mfr #:" line under the SKU, and its own row in Specifications.
> **Change this when:** You have the manufacturer's own part number. Hidden if blank.

---

## Options & pricing

> **Shopify: Options (e.g. Color)**
> **Website:** The "SELECT COLOR" buttons. The heading uses your option name.

> **Shopify: Variant price**
> **Website:** The big price, and the small price under each button.
> *A price of $0 shows "Contact for pricing" and cannot be added to the cart.*

> **Shopify: Compare-at price**
> **Website:** The struck-through price plus a "Save N%" tag.

> **Shopify: Variant availability**
> **Website:** In principle an unavailable option is greyed out and shows "Out of Stock" — but **in practice this never happens on our store**, because we don't track inventory in Shopify (stock sits with the suppliers). Shopify therefore reports everything as available.
> **To take something off sale, use publishing** — see "Taking one colour or size off the website" above.
> *There is deliberately no "In Stock" message either, for the same reason: supplier inventory isn't live.*

> **Shopify: Variant image**
> **Website:** The gallery leads with the selected colour's own photo.
> **Important:** On a **multi-colour** product, a colour with **no image assigned** shows a **placeholder** rather than another colour's photo. Assign an image to every colour.

---

### Taking one colour or size off the website

**This is the procedure. It works on any product, and you can do it yourself.**

1. Open the product in Shopify.
2. **Manage publishing.**
3. Turn that variant **off** for **Md Supplies Headless**.

That's it. Within a few minutes:

- the colour disappears from the option buttons
- if only one colour is left, the selector disappears entirely — there's nothing
  left to choose between
- nobody can buy it, price it, or reach it, even with an old link
- Google is told to use the main product page instead

**It is completely reversible.** Turn it back on when stock returns and the
colour comes straight back, with its price and images intact. Nothing is
deleted, and no order history is affected.

> **Why "out of stock" on its own doesn't do this.** This store doesn't track
> inventory in Shopify — none of the ~10,000 products do, because stock sits with
> the suppliers. So Shopify always thinks everything is in stock, and there's no
> quantity you can set that removes something from the site. Publishing is the
> control that works.

**If a colour is gone for good** (discontinued, never coming back), you can
instead delete the variant from the product. Publishing off is the better default
— it's reversible, and it does the same thing for the customer.

> **Shopify metafields: Order Size / Units per Order**
> **Website:** The dark navy **UNIT / QUANTITY** box above Add to Cart, and the **Order Packaging** tab.
> **Change this when:** Packaging changes — e.g. "Case", "1 Case (72/Case)".
> *These exist at both product and variant level. The variant's own value wins.*

> **Shopify metafields (variant): Inner Pack Quantity / Packs Per Case / Total Order Quantity**
> **Website:** Extra rows in the **Order Packaging** tab.
> **Change this when:** You know the exact breakdown. Leave blank if you don't — blank means "no data", not zero.

---

## Where the product appears

**This is the most important section. Please read all of it.**

Four Shopify fields *sound* like they control the website's categories.
**Only three do anything, and two of them do different jobs.**

| Shopify field | What it controls on the website |
| --- | --- |
| **Tag `category:...`** | ✅ The **department** (and the breadcrumb) |
| **Tag `subcategory:...`** | ✅ The **subcategory** (and its page) |
| **Collections** | ✅ Whether the product **appears in the category's product grid** |
| **Shopify Product Category** | ❌ Nothing |
| **Product Type** | ❌ Nothing for placement |

### The two-part rule

Putting a product in a category properly takes **two things**:

**1. The hierarchy tags — these decide the breadcrumb and which department it belongs to.**

> **Shopify: Tag `category:hygiene`**
> **Website:** Puts the product in the **Hygiene** department. Drives the first breadcrumb step and the product count on the /categories page.
> **Must exactly match one of the 25 approved department tags.** A typo means the product belongs to no department.

> **Shopify: Tag `subcategory:toothbrush-holder`**
> **Website:** Puts the product on the **Toothbrush Holder** subcategory page and adds that middle breadcrumb step.

**2. The collection — this decides whether it shows up in the grid customers browse.**

> **Shopify: Collections**
> **Website:** For most departments, the Shopify collection decides **which products the category page actually lists**.
> Most of our collections fill themselves automatically from a **plain descriptive tag** — for example the tag `Shower Commode` (no prefix) is what puts a product into the Shower Commodes collection, and `Toothbrush Holder` does the same for Toothbrush Holders & Caps.

So a Shower Commode carries **both** kinds of tag:

```text
category:home-care             ← department  (prefixed)
subcategory:shower-commodes    ← subcategory (prefixed)
Shower Commode                 ← collection membership (plain, no colon)
```

> **If you only add the `category:` tag,** the product gets the right breadcrumb
> but may not appear in the category's product grid.
> **If you only add the plain tag,** it appears in the grid but its breadcrumb
> may be wrong or missing.
> **Copy both from a similar product.** That is the safest way to get it right.

### The two fields that do nothing

> **Shopify: Product Category** (the Shopify taxonomy picker, e.g. "Toothbrush Holders in Bathroom Accessories")
> **Website:** **Nothing.** The website never reads it.
> Fine to fill in — it's used by Google Shopping and other sales channels.

> **Shopify: Product Type**
> **Website:** **Nothing for categories.** It can appear as a filter on the site-wide **/search** page, and that's all.
> ⚠️ *If you once changed Product Type, hit Save, and a product then appeared — that was a coincidence. Saving the product refreshed the page; the Product Type itself did nothing. That delay has now been fixed.*
> ⚠️ *Careful: the "Type" filter on category pages is a **different** field — the Type metafield, not Product Type.*

**The top navigation menu is built in code.** Editing Shopify's navigation menu
will not change the Categories mega-menu. A new department needs a developer.

---

## Special product states

> **Shopify metafield: RX Only**
> **Website:** A red **"RX Only"** badge, and the customer is blocked from checking out until they create an account and upload a prescription.
> **Change this when:** A product does or doesn't require a prescription.
> *A `compliance:rx-only` or `rx-required` tag does the same. If either says yes, the product is treated as RX — the safe direction. Dynarex products are exempt from the checkout block.*

> **Shopify metafield: Backorder**
> **Website:** A **"Backorder"** badge.
> **This checkbox is the only thing that creates the badge.** Stock levels never do. It does not stop customers ordering. Remember to untick it when stock returns.

> **Shopify metafield: Estimated Back Order Restock Date**
> **Website:** Changes the badge to **"Backorder, ships \<date\>"**.
> **Only works if Backorder is also ticked.** A date in the past is ignored and the badge reverts to plain "Backorder".

> **Shopify metafield: Backorder Restock ETA**
> **Website:** **Nothing.** Not displayed. Use *Estimated Back Order Restock Date* instead. (Only one date field ever reaches the customer, so these two can never contradict each other on the page.)

> **Shopify metafield: Free Shipping**
> **Website:** Allows a **"Free Shipping"** badge — but does **not** create one on its own.
> **How it really works:** the badge appears only if this is ticked **and** the site's separate shipping data confirms the item genuinely ships free. Ticking it on something that isn't free-shipping does nothing.
> **This is a message only.** It does not change what Shopify charges at checkout.

> **The small grey "QUALITY CERTIFIED / FAST SHIPPING / RELIABLE FULFILLMENT" icons are fixed website text.** They appear on every product and are not connected to any Shopify field. In particular, **"FAST SHIPPING" has nothing to do with the Free Shipping metafield.**

---

## Product-page information

> **Shopify metafield: Shipping & Returns**
> **Website:** The **Vendor Shipping & Returns** tab.
> *If you leave it blank, the whole tab disappears. The general policy still lives at /returns.*

> **Shopify metafield (variant): Variant Description**
> **Website:** A "Variant Details" block in the Specifications tab. Hidden if it just repeats the main description.

> **✅ Specification metafields — Material, Colour, Sterility, Thickness, Glove Size, Needle Gauge, Needle Length, Size, Use, Features, Other Features, Type, Tests For, Detectable Drugs, Adulterants**
>
> **Website:** These now appear as a **Specifications table** on the product page — *and* they power the category filters.
>
> **Change these when:** You have accurate product data. They do double duty, so getting them right both describes the product and makes it findable.
>
> **How it behaves:**
> - Fill one in → it appears as a row.
> - Leave one blank → that row simply doesn't appear.
> - A product with no specifications shows no table at all — nothing looks broken or empty.
> - Fields that don't apply never show up: a toothbrush tube will never display "Needle Gauge".
> - Fields that hold several values (Type, Tests For, Detectable Drugs, Other Features, Adulterants) display as a neat comma-separated list.

> **Shopify metafield: Customer Filter Category**
> **Website:** The **"Category" filter** — the first filter in the sidebar and the row of tabs above the product grid. It is **not** shown on the product page.
> **Change this when:** A product should be grouped differently within the filters. This is the highest-impact filter on the site.

> **Shopify metafield: Certification**
> **Website:** Powers a **Certification filter** only. Not shown on the product page.

> **Shopify metafields: Custom Badge 1 / 2 / 3, Custom Dynamic Badge**
> **Website:** **Nothing.** Not currently connected. The only badges the site shows are RX Only, Backorder and Free Shipping. If you want custom badges, that's a conversation with the dev team — the fields as they stand are on/off switches with no wording attached.

> **Reviews tab**
> **Website:** Always says "Reviews are not yet available for this product." No review system is connected yet.

---

## Recommendations

> **Shopify Search & Discovery: Complementary products**
> **Website:** The **"Frequently Bought With"** row.
> **Change this when:** You want to hand-pick add-on items. Up to 4 show.
> **This is the only recommendation row you control directly.**

> **Shopify: Related products — automatic**
> **Website:** Both **"You May Also Like"** *and* **"You May Also Need"**.
> Shopify generates one automatic list. The site shows the **first 4** as "You May Also Like" and **everything after that** as "You May Also Need".

> ⚠️ **Common misunderstanding:** "You May Also Need" is *not* your Complementary
> products. Complementary products go to **"Frequently Bought With"**.

---

## Search / SEO

> **Shopify: Search engine listing — Page title**
> **Website:** The browser tab and the Google result heading.
> *The site adds "— MDSupplies" for you when it isn't already there. **You don't need to type "| MDSupplies" yourself** — and if you do, the site no longer doubles it up.*

> **Shopify: Search engine listing — Meta description**
> **Website:** The grey summary text in Google results. Keep it under about 155 characters.

> **Shopify: Search engine listing — URL handle**
> **Website:** The product's address: `mdsupplies.com/product/<handle>`.
> **Change this with care** — see the Do Not Touch table.

**On category pages, Shopify's SEO fields are often overridden** by approved copy
held in the site's code. If a category SEO change doesn't appear, that's why.

---

## Making a product visible or removing it

**To put a product on the website:**

1. Set Status to **Active**.
2. In **Publishing**, make sure it's published to **Md Supplies Headless** —
   that's the sales channel our website reads. If it isn't ticked, the product
   won't appear at all, no matter what else is right.
3. Add the `category:` tag, and the `subcategory:` tag if one fits.
4. Add the plain collection-membership tag (e.g. `Shower Commode`), or add it to
   the collection directly.
5. Fill in the metafields that apply.
6. Check the product page (~5 minutes), then the category page (up to an hour).

**To take a product off the website:**

- **Set Status to Draft.** Instant, reversible, keeps the product record and
  order history intact.
- **Do not delete products.** Deleting is permanent and breaks the link from past
  orders to the product.

---

# Client Touch / Don't Touch

## ✅ SAFE TO EDIT — maintain these routinely

| Field | Why |
| --- | --- |
| Title | Product name |
| Description | Product copy |
| Media / images | Photography |
| Variant price, compare-at price | Pricing |
| Variant SKU | Internal identifier |
| Variant images | One per colour — required on multi-colour products |
| Brand Name | The customer-facing brand |
| Manufacturer Item Number | Manufacturer part number |
| Order Size, Units per Order | Packaging shown above Add to Cart |
| Inner Pack Quantity, Packs Per Case, Total Order Quantity | Packaging detail |
| Shipping & Returns | Supplier terms |
| Variant Description | Variant-specific copy |
| **All specification metafields** — Material, Colour, Sterility, Thickness, Glove Size, Needle Gauge, Needle Length, Size, Use, Features, Other Features, Type, Tests For, Detectable Drugs, Adulterants | Now shown on the product page **and** powering filters |
| Customer Filter Category | **Highest-impact filter on the site** |
| Certification | Powers the Certification filter |
| Search engine listing — title & description | SEO |
| Status (Active / Draft) | Visibility |
| Complementary products (Search & Discovery) | "Frequently Bought With" |

## ⚠️ EDIT WHEN APPLICABLE — correctness matters

| Field | Why care is needed |
| --- | --- |
| **RX Only** | Turning this off removes a **compliance** control. Only change with authority to do so. |
| **Backorder** | Sets a customer expectation. Untick when stock returns. |
| **Estimated Back Order Restock Date** | Only works alongside Backorder. A past date is ignored. |
| **Free Shipping** | A shipping promise. Never tick speculatively. |
| **Collections / plain collection tags** | Changes which products appear in a department's grid. |
| **Variant publishing (Manage publishing)** | The supported way to take one colour/size off the site. Reversible, and safe to do yourself. |
| **Vendor** | Changes the returns-policy heading and partner links. **Not the brand.** |

## 🛑 DO NOT CHANGE WITHOUT DEVELOPER REVIEW

| Field | Why |
| --- | --- |
| **`category:` tags** | Must exactly match one of 25 approved values in code. A typo silently removes the product from its department. **Ask before inventing a new one.** |
| **`subcategory:` tags** | A new value can create a new subcategory page; changing one can move a breadcrumb unexpectedly. |
| **Other prefixed tags** — `industry:`, `compliance:`, `brand:`, `partner:`, `shipping:`, `discontinued` | Internal routing/compliance signals, not descriptions. `compliance:rx-only` is a **prescription** control. |
| **Product URL handle** | Changing it breaks every existing link, bookmark and Google result, and needs a redirect. |
| **Metafield definitions** (names, keys, types, "filterable", storefront access) | The code matches exact keys. Renaming a key or turning off "filterable" silently removes a filter sitewide. Editing **values** is fine; editing **definitions** is not. |
| **Collection handles** | The site's routes are built on these. Renaming one can take a category page offline. |
| **Search & Discovery filter configuration** | Which filters exist is agreed jointly between Shopify and the site's code. |
| **Shopify navigation menu (Categories section)** | The category mega-menu is built in code and ignores it. |
| **Deleting products** | Irreversible. Use Draft. |

---

## Quick troubleshooting

| "I changed X and nothing happened" | Likely reason |
| --- | --- |
| Product doesn't appear at all | Not Active, or not published to the website's sales channel |
| Right breadcrumb, missing from the grid | It has the `category:` tag but isn't in the collection — add the plain collection tag |
| In the grid, but wrong/no breadcrumb | It's in the collection but missing the `category:` tag |
| Wrong department despite the right tag | A few subcategories (exam tables, barrier sleeves, vital sign monitors) are pinned to one fixed department by design — ask a developer |
| A colour/size vanished from a product | It's been turned off for Md Supplies Headless in Manage publishing — turn it back on to restore it |
| Specification not on the page | Check the field is filled in; Certification and Customer Filter Category are filter-only by design |
| Free Shipping badge not showing | The shipping data must also confirm it |
| Filter didn't appear | The metafield must be "filterable" in Shopify **and** allowlisted in code |
| Category page SEO title ignored | Category SEO is often overridden in code |
| Product change stale after ~5 min | Worth flagging to the dev team |
| Category change not showing yet | Normal for up to an hour — don't force it by editing other fields |
