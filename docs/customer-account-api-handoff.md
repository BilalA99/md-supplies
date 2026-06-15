# Customer Account API — Sign-in Flow: Developer Handoff

**Date:** 2026-06-15
**Scope:** Got the Shopify **Customer Account API** sign-in flow working end-to-end against a
public HTTPS tunnel (ngrok), fixed the GraphQL queries to match the Customer Account API schema,
added the order-detail page and full (Shopify-session) logout, and set up team onboarding files.

Read alongside [`auth-deferral.md`](./auth-deferral.md) (what ships vs. what's deferred).

---

## 1. TL;DR for a new developer

```bash
git clone https://github.com/AppFlow-Studio/md-supplies.git
cd md-supplies
cp .env.example .env.local          # fill the BLANK (secret) values from the team vault
# set NEXT_PUBLIC_SITE_URL to YOUR OWN ngrok domain (see §4)
npm install
npm run dev                         # terminal 1 → http://localhost:3000

# terminal 2 — public HTTPS tunnel (Shopify login does NOT work on http://localhost)
ngrok http 3000 --url=<your-domain>.ngrok-free.dev
```

Then a maintainer registers **your** ngrok callback URL on the Shopify Customer Account API client
(§5). Open the **ngrok URL** (not localhost) → `/account` → **Log In**.

> The app is **not** deployed anywhere. The ngrok URL forwards to *your* machine and only works while
> both `npm run dev` and `ngrok` are running locally. See §4 and §8 for the team/staging story.

---

## 2. How the auth flow works

Shopify's Customer Account API uses **OAuth 2.0 Authorization Code + PKCE** with Shopify's **hosted**
login form. There is no way to build a custom in-app email/password form — the button must redirect
to Shopify and back.

```
/account (logged out)
  └─ "Log In"  ──►  GET /api/auth/login
                      • generates PKCE verifier/challenge + state, stores them in httpOnly cookies
                      • 302 → https://shopify.com/authentication/<shop-id>/oauth/authorize?…
                                 (Shopify hosts the login UI)
                      ◄── Shopify redirects back with ?code=shcac_…&state=…
                    GET /api/auth/callback
                      • verifies state, exchanges code → tokens at /oauth/token
                      • stores session cookies, 302 → /account
/account (logged in)
  • reads session cookies, calls the Customer Account GraphQL API, renders the dashboard
  • "Log Out" → GET /api/auth/logout → ends the Shopify session + clears cookies
```

### Tokens & cookies (all `httpOnly`, server-only)
| Cookie | Holds | Notes |
|---|---|---|
| `shopify_access_token` | the `shcat_…` Customer Account API access token | scope `customer-account-api:full` makes the token endpoint return this directly — **no separate token-exchange step** |
| `shopify_refresh_token` | refresh token | 30-day cookie; used by `/api/auth/refresh` |
| `shopify_token_expires_at` | epoch-ms expiry | `/account` refreshes ~60s before expiry |
| `shopify_id_token` | OIDC id_token | used as `id_token_hint` for full logout |
| `shopify_code_verifier` / `shopify_oauth_state` | PKCE values | short-lived, deleted in the callback |

Session helpers live in `lib/shopify/session.ts` (`getSession()`, `SESSION_COOKIES`).

---

## 3. ⚠️ Gotchas (the things that cost us time — read this)

1. **Two different base URLs.** OAuth and GraphQL live on *different* paths for the same shop:
   - OAuth:   `https://shopify.com/authentication/<shop-id>/oauth/{authorize,token}` and `/logout`
   - GraphQL: `https://shopify.com/<shop-id>/account/customer/api/<version>/graphql`  *(no `/authentication/`)*

   We store the **OAuth base** in `SHOPIFY_CUSTOMER_ACCOUNT_URL` and **derive** the GraphQL base in
   `lib/shopify/customer.ts` by stripping `/authentication`. Confirmed against the shop's
   `…/.well-known/openid-configuration` and the discovery `graphql_api` value.

2. **Customer Account API schema ≠ Storefront API schema.** The original queries were written for the
   Storefront API and failed. On the Customer Account API:
   - `LineItem` is **flat** — there is **no** `variant { … }` sub-object. Use `title`, `quantity`,
     `variantTitle`, `sku`, `image { url altText }`, `price`, `totalPrice`.
   - `Order` money fields are `subtotal` / `totalShipping` / `totalTax` / `totalPrice`
     (**not** `subtotalPrice` / `totalShippingPrice`).
   - `fulfillments` is a **connection** (`{ nodes { … } }`); tracking is `trackingInformation`
     (a list of `{ company, number, url }`) — **not** `trackingInfo` / `trackingCompany`.
   - There is **no root `order(id:)` query** — fetch via `customer { orders }` and match in code.
   - Connections support both `nodes { … }` and `edges { node { … } }`; we use `nodes`.

3. **Authorization header has NO `Bearer` prefix** — pass the raw `shcat_` token
   (`Authorization: <token>`). See `customerFetch()` in `lib/shopify/customer.ts`.

4. **`redirect_uri` must match Shopify exactly** — scheme, host, full path `/api/auth/callback`,
   **no trailing slash**, and registered on **the same client_id** the app sends (§5). A trailing
   slash on `NEXT_PUBLIC_SITE_URL` produces `…//api/auth/callback` and fails.

5. **Client ID is a UUID.** Customer Account API client IDs look like
   `87bb2a4d-7725-4c9d-8494-84c908432f0f`, not a 32-char hex string.

6. **ngrok + Next.js dev:** Next 16 blocks cross-origin dev requests, which breaks HMR/hydration over
   a tunnel and shows a **blank page**. Fixed via `allowedDevOrigins` in `next.config.ts` (§6).

---

## 4. Local dev with ngrok

- ngrok is a **tunnel, not a host**: `https://<you>.ngrok-free.dev` forwards to your `localhost:3000`.
  Code edits hot-reload and appear immediately, but the URL is dead unless `npm run dev` **and**
  `ngrok` are both running on your machine.
- Use a **free static domain** (ngrok dashboard → Domains) so your URL is stable and you don't have to
  re-register the callback every restart: `ngrok http 3000 --url=<you>.ngrok-free.dev`.
- Skip the ngrok interstitial: for API/`fetch` calls add header `ngrok-skip-browser-warning: true`;
  for top-level browser navigation just click "Visit Site" once. Shopify webhooks are unaffected.
- `ERR_NGROK_3200` = the tunnel agent isn't running — restart the `ngrok http …` command.

---

## 5. Shopify Admin configuration (per environment / per developer)

In **Shopify Admin → Settings → Customer accounts** (or the Headless/Hydrogen channel's Customer
Account API application setup) for client **`87bb2a4d-7725-4c9d-8494-84c908432f0f`**, set:

| Field | Value (example for one dev) |
|---|---|
| **Callback URI(s)** | `https://<you>.ngrok-free.dev/api/auth/callback` |
| **JavaScript origin(s)** | `https://<you>.ngrok-free.dev` |
| **Logout URI** | `https://<you>.ngrok-free.dev/account` |

- The **Callback URI is the full path** — the bare origin goes in *JavaScript origins*, not here.
- Each developer's ngrok callback must be added (Shopify allows **multiple** redirect URIs on one
  client). Same for logout URIs.
- Symptom of a missing/!exact entry: **`redirect_uri mismatch`** on the Shopify login screen.

---

## 6. Environment variables

Template: [`.env.example`](../.env.example) (committed). Copy to `.env.local` (git-ignored). Never
commit secrets; share real token values via the team vault.

| Var | Secret? | Notes |
|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | no | `daebb2-76.myshopify.com` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | **yes** | Storefront API (catalog/cart/search) |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | **yes** | Admin API (referenced; not used by app code yet) |
| `SHOPIFY_CUSTOMER_ACCOUNT_URL` | no | OAuth base `https://shopify.com/authentication/71167377624`; GraphQL base is derived from it |
| `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` | no (public) | UUID `87bb2a4d-…`; sent in the OAuth redirect |
| `NEXT_PUBLIC_SITE_URL` | **per-dev** | your ngrok origin, **no trailing slash**; builds the OAuth `redirect_uri` |
| `NEXT_PUBLIC_IS_STAGING` | no | optional flag for non-prod |

`next.config.ts` → `allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app"]` whitelists any
teammate's free ngrok tunnel for dev requests.

---

## 7. Files changed in this work

| File | Change |
|---|---|
| `next.config.ts` | `allowedDevOrigins` for ngrok (fixes blank page over tunnel) |
| `.env.example` | **new** — onboarding template (var names + non-secret shared values) |
| `.gitignore` | `!.env.example` exception so the template is committable |
| `lib/shopify/customer.ts` | Split OAuth base vs derived GraphQL base; added `logoutUrl()`; `id_token` on `TokenResponse`; **temporary** debug logging in `customerFetch` |
| `lib/shopify/session.ts` | Added `ID_TOKEN` session cookie |
| `app/api/auth/callback/route.ts` | Store `id_token` cookie after login |
| `app/api/auth/logout/route.ts` | Full logout via `end_session_endpoint` (`id_token_hint` + `post_logout_redirect_uri`), falls back to cookie-clear |
| `lib/shopify/queries/customer.ts` | Fixed `GET_CUSTOMER_ORDERS` (removed Storefront `variant` block); replaced `GET_ORDER` with `GET_ORDER_DETAILS` (Customer Account API schema, via `customer { orders }`) |
| `components/account/AccountView.tsx` | Removed unused `OrderLineItem` type + `lineItems` field from `CustomerOrder` |
| `app/(noindex)/account/page.tsx` | **Temporary** debug logging around the customer fetch |
| `app/(noindex)/account/orders/[number]/page.tsx` | **new** — order-detail page (resolves order by number via `GET_ORDER_DETAILS`) |

---

## 8. Scaling beyond one laptop (recommended next step)

The ngrok-per-dev setup works but is laptop-dependent and means managing N callback URLs. To "push
this forward", stand up a **shared staging deploy** (Vercel is the natural Next.js host) with a
**fixed** domain, register its callback once, and point `NEXT_PUBLIC_SITE_URL` + Shopify env vars at
it per-environment. Note: Vercel's per-PR **preview URLs are unique per deploy**, which conflicts with
Shopify's exact-match callback requirement — so keep **one stable staging domain** for OAuth flows and
use previews for non-auth UI work.

---

## 9. Verification status

| Item | Status |
|---|---|
| OAuth login → callback → `shcat_` token stored | ✅ verified (token len 564, code exchanged) |
| `GET_CUSTOMER`, `GET_CUSTOMER_ADDRESSES` | ✅ verified (API returned data) |
| `GET_CUSTOMER_ORDERS` (dashboard) | ✅ fixed (was the only failing query); confirm by reloading `/account` |
| `GET_ORDER_DETAILS` (order detail page) | 🔶 schema doc-verified; confirm by opening an order |
| Full logout (`end_session`) | 🔶 implemented; confirm re-login re-prompts the hosted form |
| Token refresh (pre-expiry) | 🔶 implemented; confirm by editing the expiry cookie and reloading |
| `tsc --noEmit` | ✅ passes |

---

## 10. Outstanding TODOs

- [ ] **Remove temporary debug logging** once the flow is confirmed E2E:
      `lib/shopify/customer.ts` (`customerFetch`) and `app/(noindex)/account/page.tsx` — search
      `DEBUG (temporary)`.
- [ ] Final manual E2E confirmation of the 🔶 rows in §9 (requires a test customer with orders).
- [ ] Register each developer's ngrok callback on the client, or move to a shared staging deploy (§8).
- [ ] Deferred features (address/settings mutations, invoices, B2B, subscriptions) — see
      [`auth-deferral.md`](./auth-deferral.md).

---

## 11. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ERR_NGROK_3200` endpoint offline | ngrok agent not running | restart `ngrok http 3000 --url=…` |
| Blank/empty page over ngrok; `wss://…/_next/webpack-hmr` fails | Next blocks cross-origin dev requests | `allowedDevOrigins` in `next.config.ts`; restart dev server |
| `redirect_uri mismatch` on Shopify login | callback URL not registered exactly on the sent client | register full `…/api/auth/callback` (no trailing slash) on client `87bb2a4d-…` (§5) |
| Login succeeds but `/account` shows logged-out | `customerFetch` threw or returned null customer | check the `[customerFetch]`/`[account]` server logs; usually a GraphQL schema mismatch (§3.2) |
| `HTTP 400 … Field 'X' doesn't exist on type 'Y'` | query uses Storefront shape | use Customer Account API fields (§3.2); verify at shopify.dev/docs/api/customer |
| `HTTP 401` from the GraphQL API | bad/expired token or wrong header | token must be raw (no `Bearer`); re-login; confirm scope `customer-account-api:full` |
| OAuth `invalid_client` | wrong `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` | use the UUID `87bb2a4d-…` |

**Endpoints (this shop, id `71167377624`):**
- Authorize: `https://shopify.com/authentication/71167377624/oauth/authorize`
- Token:     `https://shopify.com/authentication/71167377624/oauth/token`
- Logout:    `https://shopify.com/authentication/71167377624/logout`
- GraphQL:   `https://shopify.com/71167377624/account/customer/api/2026-04/graphql`
