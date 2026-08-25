# Client Walkthrough — Video Script

**Runtime:** ~8–9 minutes
**Primary example:** Dawn Mist Toothbrush Tube (`MILDTHLU0072NU`),
`/product/toothbrush-tube-clear`
**Second example (for specifications):** 100 Nitrile Exam Gloves (`MED MNE5052`)
**Third example (for categories):** Folding Rehab Shower Commode (`12022010`)

**Setup before recording:** Shopify Admin on the left, the MDSupplies site on the
right. Have all three products open in tabs on both sides.

*Stage directions in italics. Everything else is spoken.*

> **This script matches the implementation on branch
> `shopify-client-training-wiring`.** Every behaviour described was verified
> rendering live. If you record before that branch is merged, the specifications
> table and the Blue variant button will not be there.

---

## 1 — Shopify vs the custom site *(0:00 – 0:30)*

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

## 2 — Product basics *(0:30 – 1:50)*

*Shopify Admin, Toothbrush Tube, top of the page.*

> **Title.** *(highlight, then point at the site heading)* That's the big heading.
>
> Notice Shopify says "Toothbrush Tube" and the site says "Toothbrush Tube —
> Clear". The site adds the selected colour automatically. You never type that.
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

## 3 — Variants and pricing *(1:50 – 2:50)*

*Scroll to Variants in Shopify.*

> This product comes in two colours — Clear and Blue. *(point to both variants)*
>
> On the site: **SELECT COLOR**, with a Clear button at $46.30 and a Blue button
> at $45.55. *(point)* That heading text comes from your option name, so whatever
> you call the option is what customers read.
>
> *(click Blue on the site)*
>
> The price updates, the SKU updates, the title suffix updates, and the address
> quietly gains a variant parameter — so if you copy that link and send it to
> someone, it opens on Blue.
>
> **Two things to watch on variants.**
>
> First, **every colour needs its own image.** On a multi-colour product, if a
> colour has no image assigned, the site shows a grey placeholder — it
> deliberately will *not* show a different colour's photo, because that misleads
> the customer.
>
> Second — and this one's worth knowing. *(back to Shopify Variants)* Occasionally
> a product ends up with a variant whose value isn't listed in the option itself.
> That was actually the case here: Blue existed as a variant, but "Blue" was
> missing from the Color option's list of values. The site now recovers those
> automatically so the variant is still selectable and still buyable. But if you
> notice it, it's worth tidying in Shopify.
>
> And on pricing — a variant priced at zero shows **"Contact for pricing"** and
> can't be added to the cart. That's deliberate: it's a quote-only item, not a
> free one.

---

## 4 — Categories *(2:50 – 4:40)*

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
> coincidence.** What was actually happening: category changes were taking up to
> an hour to show up, so a change you'd made earlier surfaced right after an
> unrelated Save. That delay has now been fixed — category changes appear within
> minutes. Product Type had nothing to do with it.
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

## 5 — Metafields that matter *(4:40 – 6:00)*

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

## 6 — Specifications *(6:00 – 6:50)*

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

## 7 — Related and complementary products *(6:50 – 7:30)*

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

## 8 — Adding a new product *(7:30 – 8:20)*

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
> make sure it's published to the sales channel the website uses. That part is
> essential: if it's not ticked, the product won't exist on the site no matter how
> perfect everything else is.
>
> **Six — check it.** Open the product page, then the category page. Both should
> be current within a few minutes.
>
> And that's the other thing that's changed: **you no longer have to wait an
> hour** to find out whether a category change worked. If something's still stale
> after about five minutes, that's worth telling the dev team about.

---

## 9 — Updating and removing a product *(8:20 – 8:50)*

> **Updating** — just edit and save. Changes appear within a few minutes,
> including category changes.
>
> **Removing something discontinued** — **set the status to Draft.** That's it. It
> disappears from the website within a few minutes and it's completely
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

- Confirm the **sales channel name** with the dev team before recording §8 step
  five, and say the real name instead of "the sales channel the website uses".
- §4's "category changes appear within minutes" and §8's "no longer wait an hour"
  are **true only once the Shopify webhooks are registered** against
  `POST /api/revalidate`. Confirm that before recording — if they are not yet
  registered, cut both lines and say "within the hour".
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
  §6 switches to the gloves. Don't try to demo specifications on the tube.
- The Toothbrush Tube has no "Frequently Bought With" row (no complementary
  products configured). If you want to show all three recommendation rows in §7,
  pick a product that has complementary products set — or narrate the absence.
