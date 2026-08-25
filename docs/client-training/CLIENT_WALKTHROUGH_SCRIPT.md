# Client Walkthrough — Video Script

**Runtime:** ~19 minutes as written. See "Filming a shorter cut" below to get
it to ~10.
**Primary example:** Dawn Mist Toothbrush Tube (`MILDTHLU0072NU`),
`/product/toothbrush-tube-clear`
**Second example (for specifications):** 100 Nitrile Exam Gloves (`MED MNE5052`)
**Third example (for categories):** Folding Rehab Shower Commode (`12022010`)

**Setup before recording:** Shopify Admin on the left, the MDSupplies site on the
right. Have all three products open in tabs on both sides.

*Stage directions in italics. Everything else is spoken.*

## Before you hit record

**The branch must be deployed or running locally.** Two things in this script do
not exist on `main`: the **Specifications table** (§6) and the **withdrawn-colour
behaviour** (§3). Both are on `shopify-client-training-wiring`. If you film
against plain `main`, §6 shows an empty tab and §3's claim is wrong.

Have these open, Shopify Admin on the left, site on the right:

| Product | Used in | Why that one |
| --- | --- | --- |
| **Toothbrush Tube** `toothbrush-tube-clear` | §2, §3, §4, §5 | The main thread. Has brand, packaging, Shipping & Returns, both tag types, and the withdrawn Blue colour |
| **100 Nitrile Exam Gloves** `100-nitrile-exam-gloves-pf-text-finger-cobalt-blue-small` | §3, §6 | The only one with a live two-value option (Size S/XL) **and** five populated spec rows |
| **Shower Commode** `folding-rehab-shower-commode-low-back-24in` | §4 | Cleanest example of the two-tag rule |
| *(optional)* **12 Panel Rapid Cups** `12-panel-multi-drug-rapid-cups-clia-mdrc-12` | §6 | Twelve detectable drugs — makes the spec table land |

**Three facts to have straight before you speak:**

1. The sales channel is **"Md Supplies Headless"**. Say it exactly.
2. **Category changes take up to an hour** right now. Do not say "within
   minutes" — the instant-refresh code is built but not switched on.
3. The Toothbrush Tube has **no colour selector** any more, and **no spec
   metafields**. That is why §3 and §6 both switch to the gloves.

---

## Filming a shorter cut

The full script runs ~19 minutes. If you want ~10, film it as **two videos** —
that is the better outcome anyway, because part 1 is what Juliette will rewatch:

| Cut | Sections | Runtime |
| --- | --- | --- |
| **Part 1 — "Where products go"** | 1, 2, 4, 8, 9 | ~10 min |
| **Part 2 — "Product detail"** | 3, 5, 6, 7 | ~9 min |

If it has to be one video, cut in this order and you land near 11 minutes:

1. **§3's pricing tail** (the $0 / "Contact for pricing" paragraph) — edge case
2. **§7 entirely** — recommendations are read-only for her day to day
3. **§5's Customer Filter Category paragraph** — it is in the written guide
4. **§6 down to one product** — show the gloves, drop the drug-test cup

**Do not cut §4.** It is the reason for the video.

> **This script matches the implementation on branch
> `shopify-client-training-wiring`.** Every behaviour described was verified
> rendering live. If you record before that branch is merged, the specifications
> table will not be there.
>
> **The toothbrush tube no longer has a colour selector** — Blue was withdrawn in
> Shopify, so Clear is the only option. Variants are demonstrated on the gloves
> instead (§3). Everything else still uses the tube.

---

## 1 — Shopify vs the custom site *(0:00 – 0:50)*

*Both windows visible.*

> Hi Juliette. This shows how the product information you manage in Shopify turns
> into what customers see on MDSupplies.com.
>
> The whole idea in one sentence: **Shopify is where the product information is
> maintained, and the MDSupplies site reads specific Shopify fields and uses them
> to build what customers see** — the product page, the category it lands in, and
> the filters people search with.
>
> The important word is *specific*. The site doesn't read everything in Shopify.
> Some fields are for Google Shopping, a couple aren't connected at all. I'll be
> clear about which is which — especially the ones that look like they should
> control categories and don't.

---

## 2 — Product basics *(0:50 – 2:30)*

*Shopify Admin, Toothbrush Tube, top of the page.*

> **Title.** *(highlight, then point at the site heading)* That's the big heading.
>
> One thing worth mentioning: when a product genuinely has several colours, the
> site appends the selected one to the heading automatically — you never type
> that. This tube only has Clear now, so there's nothing appended here.
>
> **Description.** *(highlight)* This appears under the **Specifications** tab
> *(click it)* — right here. Your bold, bullets and links all carry across.
>
> **Images.** *(highlight)* That's the gallery. Up to six thumbnails show.
>
> Now two fields that look similar and are not the same.
>
> **Vendor** — here it says Dukal. Vendor is the supplier who *fulfils* the
> order. **Vendor is never shown to customers as the brand.**
>
> The brand comes from a metafield called **Brand Name** *(scroll to it)* — "Dawn
> Mist". That's exactly what appears in teal above the title. *(point)*
>
> This matters because across our catalogue the supplier and the brand are
> different on roughly half the products. If the site used Vendor we'd print the
> wrong brand on thousands of pages. **Brand Name is what customers see. Vendor is
> internal.** If Brand Name is blank, no brand line appears — it won't guess.
>
> **SKU.** *(point)* "SKU: MILDTHLU0072NU" — that's the variant's SKU field.

---

## 3 — Variants and pricing *(2:30 – 6:00)*

> ⚠️ **Demo on the GLOVES product, not the toothbrush tube.** The tube's Blue
> colour has been withdrawn, so it now shows no colour selector at all — there is
> only one thing to choose. The gloves have a live two-value Size option
> (Small / XL) and are the right thing to demonstrate on.

*Open 100 Nitrile Exam Gloves in Shopify, Variants section.*

> These gloves come in two sizes — Small and XL. *(point to both variants)*
>
> On the site: **SELECT SIZE**, with a button for each. *(point)* That heading
> text comes from your option name, so whatever you call the option is what
> customers read.
>
> *(click XL on the site)*
>
> The price updates, the SKU updates, and the address quietly gains a variant
> parameter — so if you copy that link and send it to someone, it opens on XL.
>
> **A couple of things to know about variants.**
>
> **Every colour needs its own image.** On a multi-colour product, if a colour has
> no image assigned, the site shows a grey placeholder — it deliberately will
> *not* show a different colour's photo, because that misleads the customer.
>
> *(switch to the Toothbrush Tube product page)*
>
> And here's the flip side, using the toothbrush tube — this is the bit you asked
> about, so I'll show it properly.
>
> This one used to come in Clear and Blue. Blue went out of stock, and you took it
> off. Look at the page: **no colour selector at all**, just Clear. That's exactly
> right — there's only one option now, so there's nothing to choose between.
>
> *(switch to Shopify, the tube, Manage publishing)*
>
> **This is how you do that on any product.** Open the product, go to Manage
> publishing, and turn that variant off for **Md Supplies Headless**. That's the
> whole thing.
>
> Within a few minutes it's gone from the site — off the buttons, not buyable, and
> not reachable even by an old link someone saved. And it's **completely
> reversible**: turn it back on when stock returns and the colour comes straight
> back with its price and images. Nothing is deleted.
>
> One thing worth knowing, because it explains why this wasn't obvious. **We don't
> track inventory in Shopify** — none of our products do, because stock sits with
> the suppliers. So marking something out of stock doesn't remove it, because
> Shopify always thinks everything is in stock. Publishing is the control that
> actually works.
>
> And on pricing — a variant priced at zero shows **"Contact for pricing"** and
> can't be added to the cart. That's deliberate: it's a quote-only item, not a
> free one.

---

## 4 — Categories *(6:00 – 10:30)*  ← the important one

> **This is the most important section, so I'm going to go slowly, and I'm going
> to correct something that has confused all of us.**
>
> *(point at the site breadcrumb)* Home, Hygiene, Toothbrush Holder, then the
> product.
>
> There are four things in Shopify that *sound* like they control that. Let me
> take the two that don't, first.
>
> *(scroll to Shopify Product Category)*
>
> **Shopify Product Category** — ours says "Toothbrush Holders in Bathroom
> Accessories". This is Shopify's own global taxonomy. **It has no effect on our
> website at all.** It's useful for Google Shopping and other sales channels, so
> please keep filling it in — it just doesn't drive anything here.
>
> **Product Type.** Also nothing, for categories. It can show up as a filter on
> the site-wide search page, and that's it.
>
> And I want to be direct about this one, because I know at one point changing
> Product Type and hitting Save seemed to make a product appear. **That was a
> coincidence.** Category changes can take up to an hour to show up, so a change
> you'd made earlier surfaced right after an unrelated Save. Product Type had
> nothing to do with it.
>
> So if you change a category tag and the site looks the same — **that's normal,
> give it an hour.** Don't go changing other fields to try to force it.
>
> One more warning on that: our category pages *do* have a filter called "Type" —
> but that's a **different field**, a metafield also called Type. Easy to mix up.
>
> *(scroll to Tags)*
>
> **Here's what actually controls placement. Tags — and you need two kinds.**
>
> **The first kind sets the breadcrumb.** Look for the tag starting `category:` —
> ours is `category:hygiene`. That's what puts this in the **Hygiene** department,
> and it's the first breadcrumb step. And `subcategory:toothbrush-holder` —
> that's the **Toothbrush Holder** step and its page.
>
> **The second kind fills the collection.** Look at this tag: just
> `Toothbrush Holder`, plain, no colon. *(point)* That's what our Shopify
> automated collection uses to pull this product into the Toothbrush Holders
> collection — and **the collection is what fills the product grid** customers
> actually browse on a category page.
>
> *(switch to the Shower Commode product)*
>
> Same pattern here, and it's clearer: `category:home-care`,
> `subcategory:shower-commodes`, and then the plain tag `Shower Commode`.
> *(point to the site)* Breadcrumb reads Home, Home Care, Shower Commodes — and
> the Shower Commodes page lists all ten of them.
>
> **So the rule is: placing a product takes both kinds of tag.**
>
> The prefixed `category:` and `subcategory:` tags give you the right breadcrumb
> and department. The plain descriptive tag gets it into the collection, which is
> what makes it show up in the grid. If you only do one, the product is
> half-placed — either it has a breadcrumb but isn't in the listing, or it's in
> the listing with a wrong or missing breadcrumb.
>
> **The safest way to get this right: copy the tags from a similar product that's
> already correct.** And that `category:` tag has to exactly match one of our
> twenty-five departments — a typo doesn't put it somewhere else, it puts it
> nowhere. If you think we need a genuinely new department, that's a conversation
> with the dev team, not a tag you can invent.
>
> Last thing: **the top navigation menu is built in our code**, not in Shopify. If
> you edit Shopify's navigation menu, the Categories mega-menu won't change.

---

## 5 — Metafields that matter *(10:30 – 13:30)*

*Scroll to the pinned metafields.*

> The metafields you'll actually use. I'll skip the ones that aren't connected.
>
> **RX Only.** Tick this and the product gets a red "RX Only" badge, and the
> customer can't check out until they create an account and upload a
> prescription. It's a compliance control — only change it if you have the
> authority to.
>
> **Backorder.** Tick this and you get a "Backorder" badge. Two things: **this
> checkbox is the only thing that creates that badge** — stock levels never do —
> and it doesn't stop anyone ordering. Remember to untick it when stock is back.
>
> **Estimated Back Order Restock Date.** Fill this in and the badge becomes
> "Backorder, ships" plus the date. It only works if Backorder is *also* ticked,
> and a date in the past is ignored — it just goes back to plain "Backorder".
>
> There's a second field called **Backorder Restock ETA**. That one isn't
> displayed at all. Use *Estimated Back Order Restock Date*. Only one date field
> ever reaches the customer, so those two can't contradict each other on the page.
>
> **Free Shipping.** Ours is ticked. This one's a bit different: ticking it
> **doesn't create a free shipping badge on its own.** It's a permission. The
> badge appears only if you tick it *and* our separate shipping data
> independently confirms the item genuinely ships free. So ticking it on
> something that isn't free-shipping does nothing. And it's a **message only** —
> it doesn't change what Shopify charges at checkout.
>
> *(point to the trust icons on the site)*
>
> While we're here — these three icons: Quality Certified, Fast Shipping,
> Reliable Fulfilment. **These are fixed website text.** They're on every product,
> and no Shopify field controls them. In particular **"Fast Shipping" is not the
> Free Shipping metafield.** Completely unrelated.
>
> **Shipping & Returns.** *(scroll to it)* Ours has Dukal's terms. This fills the
> "Vendor Shipping & Returns" tab. And usefully: **if you leave it blank, the
> whole tab disappears** rather than showing something generic.
>
> **Customer Filter Category.** *(scroll to it)* This one's interesting — it
> **doesn't appear on the product page**, but it powers the "Category" filter,
> the first and most-used filter on every category page. Probably the single
> highest-impact field for helping customers find things.

---

## 6 — Specifications *(13:30 – 15:00)*

*Switch to the Nitrile Exam Gloves product, Shopify side.*

> Now the specifications — and this is genuinely new, so it's worth showing
> properly.
>
> On this glove, look at the metafields: **Material** is Nitrile, **Color** is
> Blue, **Thickness** is 3.5 mil, **Glove Size** is Small, **Type** is Exam.
> *(highlight each)*
>
> *(switch to the site, Specifications tab)*
>
> And there they are, as a specifications table. Material, Colour, Thickness,
> Glove Size, Type.
>
> **The rule is simple: if a relevant specification exists in Shopify, the site
> displays it automatically. Anything you leave blank simply doesn't appear.**
>
> *(switch back to the Toothbrush Tube's Specifications tab)*
>
> And here's the toothbrush tube — no specifications filled in, so there's no
> table at all. Nothing looks broken or empty. You'll also never see irrelevant
> fields: a toothbrush tube will never sprout a "Needle Gauge" row.
>
> *(optional: show the 12-panel drug test cup)*
>
> One more — this drug test cup has twelve detectable drugs listed, and they come
> through as a clean readable list.
>
> So: **fill in whatever specifications genuinely apply and leave the rest
> blank.** These same fields also build the filters on the category pages, so
> accurate data does double duty — it describes the product *and* makes it
> findable.

---

## 7 — Related and complementary products *(15:00 – 16:00)*

*Scroll to the bottom of a product page.*

> Up to three recommendation rows, and it's easy to get these backwards.
>
> **"Frequently Bought With"** comes from **Complementary products**, which you
> set in the **Search & Discovery** app. These are the ones **you hand-pick**. Up
> to four show.
>
> **"You May Also Like"** is Shopify's **automatic** related-products algorithm.
> Shopify chooses those, not us.
>
> **"You May Also Need"** — and here's the one that surprises people. **This is
> not your complementary products.** It's the *overflow* of that same automatic
> list. Shopify's related list comes back, the first four go into "You May Also
> Like", and everything after that becomes "You May Also Need".
>
> So practically: **the only recommendation row you control directly is
> "Frequently Bought With"**, through Complementary products in Search &
> Discovery.

---

## 8 — Adding a new product *(16:00 – 18:00)*

> Your checklist for a new product.
>
> **One — the basics.** Title, description, images, Vendor, and the **Brand
> Name** metafield. Brand Name is what customers see.
>
> **Two — variants, SKU and pricing.** Set each variant's SKU and price, and
> **assign an image to every colour**.
>
> **Three — placement, and remember it's two things.** Add the **`category:`
> tag** and the **`subcategory:` tag** if one fits — copy them from a similar
> product so they match exactly. Then make sure the **plain collection tag** is
> there too, or add the product to the collection directly.
>
> **Four — the metafields that apply.** RX Only if it's prescription. Backorder if
> relevant. Free Shipping if eligible. Shipping & Returns. Order Size and Units
> per Order. **Customer Filter Category.** And the specifications you have data
> for — Material, Size, Sterility and so on — because those now show on the page
> *and* build the filters.
>
> **Five — publish.** Set the status to **Active**, and in the Publishing section
> make sure it's published to **Md Supplies Headless**. That's the sales channel
> our website reads. It's essential: if that one isn't ticked, the product won't
> exist on the site no matter how perfect everything else is.
>
> **Six — check it.** Open the product page first — that updates within about five
> minutes. Then check the category page, and give that one **up to an hour**,
> because the site rebuilds the whole category structure on a slower cycle.
>
> So: product page, five minutes. Category placement, up to an hour. If it's
> still wrong well past that, that's worth flagging.

---

## 9 — Updating and removing a product *(18:00 – 19:15)*

> **Updating** — just edit and save. Most changes appear within about five
> minutes. Category and subcategory tag changes are the slow one — up to an hour.
>
> **Removing something discontinued** — **set the status to Draft.** That's it. It
> disappears from the website within about five minutes and it's completely
> reversible: flip it back to Active and it returns.
>
> **Please don't delete products.** Deleting is permanent and breaks the link
> between the product and every past order containing it. Draft does exactly what
> you want — the product is off the site — while keeping the record and order
> history intact.
>
> And one more: **don't change a product's URL handle** once it's live. That
> breaks every existing link, bookmark and Google result for it. If a handle
> genuinely needs to change, that needs a redirect setting up — ask first.
>
> That's everything. The written guide has all of this plus a
> "safe to edit / check first / ask a developer" table for every field. Thanks
> Juliette.

---

## Presenter notes — do not read on camera

**Accuracy**

- The sales channel is **"Md Supplies Headless"** — confirmed against the store,
  2026-08-25. It is named in §8 step five; say it exactly.
- **Timing in this script is the CURRENT, pre-webhook reality**: ~5 minutes for a
  product page, **up to an hour** for category placement. Checked 2026-08-25: the
  store has **zero webhook subscriptions**, so the instant-invalidation path is
  built but not switched on. Do not promise "within minutes" for category changes.
- If the webhooks get registered before you film, the faster wording becomes
  true and §4, §8 step six and §9 can each drop to "within a few minutes". Ask
  the dev team which state you are in on the day.
- Don't promise a reviews feature date. The Reviews tab is still a placeholder.
- Don't imply Free Shipping changes checkout charges — it is display only.
- If asked about Custom Badge 1/2/3 or Custom Dynamic Badge, the honest answer is
  "not currently connected", not "coming soon". The fields exist but are on/off
  switches with no wording attached, so connecting them needs a decision about
  what each one should say.
- Both `compliance:rx-only` and `rx-required` currently trigger RX. Don't get
  drawn into which is canonical on camera; that's still being reconciled.

**Recording**

- Record §4 (Categories) and §6 (Specifications) last, or in their own take.
  They're the two sections most likely to need a retake, and they're the two the
  client most needs to be right.
- The Toothbrush Tube has **no** specification metafields populated, which is why
  §6 switches to the gloves. Don't try to demo specifications on the tube. It
  also has no colour selector any more (Blue withdrawn), which is why §3 uses the
  gloves too — the tube appears in §3 only as the "withdrawn colour" example.
- Don't say the withdrawn Blue variant is fully removed. It is hidden from
  browsing but still attached to the product underneath; a customer with a direct
  variant link could still reach it. That gap is written up as D-13 in the
  technical map and has not been fixed.
- The Toothbrush Tube has no "Frequently Bought With" row (no complementary
  products configured). If you want to show all three recommendation rows in §7,
  pick a product that has complementary products set — or narrate the absence.
