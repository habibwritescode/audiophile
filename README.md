# audiophile

A headphone and speaker store with a real backend. Stock runs out, the server verifies every card payment, and a payment can't turn into two orders.

**[Try it on the live site](https://audiophile-ochre.vercel.app/)** · Payments run in Paystack's test mode, so no real money moves. Prices are in dollars, but Paystack charges cards in naira at a fixed demo rate (see [Try it](#try-it) for why).

![Browsing the headphones category, a sold-out product, Add to Cart stopping at the 2 in stock, then a Cash on Delivery checkout ending in order AUD-000001](docs/demo.gif)

_Recorded on the live site: stock labels, the Add to Cart limit, the cart, and a Cash on Delivery order with made-up details._

---

## Where this came from

The design and product data come from the [Audiophile e-commerce challenge](https://www.frontendmentor.io/challenges/audiophile-ecommerce-website-C8cuSd_wx) on Frontend Mentor. The storefront pages (home, categories, products, checkout) follow that brief. Some of the design's colours fail WCAG AA contrast, so I changed them to a deeper orange (`#B05C2B` instead of `#D87D4A`) and darker grey body text. I also dropped the footer's placeholder social links.

The brief stops at the browser. Its checkout form leads to a thank-you screen with nothing behind it. Built beyond it:

- **A database.** Products and stock live in Postgres. The build prerenders pages from it, and an order that changes stock refreshes the affected pages.
- **Real payments.** Cards go through Paystack (test mode), and the server verifies every payment with Paystack before it creates an order. Cash on Delivery creates an order too.
- **Orders placed exactly once.** Two shoppers buying the last unit can't both get it. If the browser and Paystack's webhook confirm the same payment at the same moment, it still makes one order. The server refunds a payment it can't fulfil.
- **Stock on the page.** Product and category pages show "Sold out" or "Only N left". Add to Cart stops at what's in stock, counting what's already in your cart.
- **Tests and CI.** 217 tests run on every push, many of them against a real Postgres database and Paystack's test API.

## Why full-stack here

My other two portfolio projects, [Listenprint](https://github.com/habibwritescode/listenprint) and [Pennywise](https://github.com/habibwritescode/penny-wise), are client-only on purpose. Each handles one person's data, and keeping that data on their device is the point. There's no server and no account to delete later.

A shop needs the opposite, for three reasons:

- **Stock is shared.** The last unit belongs to whoever pays first, and only a database can decide that.
- **The shop can't trust the browser with prices.** The cart in `localStorage` is a display copy. The server prices every line again from the database before charging.
- **The server has to confirm the payment itself.** A popup saying "success" proves nothing. The server asks Paystack, and Paystack also notifies the server directly (the webhook) in case the shopper closed the tab.

## Try it

1. Add something to the cart. XX59 has 2 left, and XX99 Mark I is sold out.
2. Check out with made-up details, because the store keeps orders (see [Limitations](#limitations)).
3. Pay either way:
   - **Card.** Paystack's popup opens in test mode. Use one of [Paystack's test cards](https://paystack.com/docs/payments/test-payments/).
   - **Cash on Delivery.** The store places the order straight away.

You get an order number (`AUD-000123`), and the product page shows the new stock on its next load.

**Why naira?** The Paystack account is Nigerian, and USD isn't enabled on it. Prices stay in dollars as the design shows them, and Paystack charges cards in naira at a fixed demo rate of ₦1,600 per $1. The checkout shows the naira amount before you pay.

## Running it locally

`.nvmrc` pins Node 22. You need Postgres 17. On macOS: `brew install postgresql@17 && brew services start postgresql@17`.

```bash
createdb audiophile && createdb audiophile_test
cp .env.example .env         # point DATABASE_URL at audiophile
cp .env.example .env.test    # point DATABASE_URL at audiophile_test
npm install                  # also generates the Prisma client
npm run db:migrate && npm run db:seed
npm run dev
```

Card payments need a Paystack test secret key (`sk_test_…`) in `PAYSTACK_SECRET_KEY`. Without one, the Card option is disabled and Cash on Delivery still works. The code refuses live keys.

|                     |                                                                               |
| ------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`       | Dev server (Turbopack)                                                        |
| `npm run build`     | Production build; type errors fail it                                         |
| `npm test`          | Vitest once; database tests use `.env.test`, Paystack tests need the test key |
| `npm run lint`      | ESLint, `--max-warnings=0`                                                    |
| `npm run typecheck` | `tsc --noEmit`                                                                |
| `npm run db:seed`   | Loads `lib/data.json`; safe to run again, and never resets stock              |
| `npm run db:reset`  | Drops and re-migrates the local database; refuses any non-local host          |

To see stock refresh after an order, use `npm run build && npm run start`. The dev server renders every request fresh, so it can't show the refresh.

## Architecture decisions

### Postgres and Prisma, prerendered pages

Products, stock, orders and rate limits live in Postgres (Prisma 7, with Neon on Vercel). The build prerenders product and category pages from the database, so a page view doesn't query it.

Every deploy runs the migrations and the seed before the build. The seed writes the product content from `lib/data.json` but sets stock only when it first creates a product, so a deploy never undoes orders. Prisma can't express CHECK constraints, so `stock >= 0` and the order-amount rules live in hand-written migration SQL, as a second check under the application's own.

### Paystack, not Stripe

Stripe doesn't open accounts in Nigeria, so the store uses Paystack. The flow:

1. The server checks the cart again, prices it and asks Paystack to start a transaction. The server sets the amount and order id.
2. The browser opens Paystack's popup for that transaction. The popup's script loads only when someone pays.
3. The server verifies status, currency and amount with Paystack before it places the order.

The account had two surprises. USD returned "Currency not supported by merchant", hence naira. Paystack also has an undocumented amount limit. A test charge of ₦200M went through and one of ₦500M didn't. The checkout catches that rejection and says the order is too large to pay online.

### An order exists before the payment

When Paystack accepts a transaction, the server records a `PENDING_PAYMENT` order that holds no stock. Only `fulfillCardPayment` turns it into `PLACED`. Three callers use it, often at the same moment: the browser after the popup, the "Check payment again" button, and Paystack's webhook.

Calling it twice is safe because the claim is a conditional update. The change from `PENDING_PAYMENT` to `PLACED` succeeds for exactly one caller, and the others find nothing to change. `paymentReference` is unique in the database, so one payment can never become two orders. If the browser loses its connection after paying, the checkout keeps the reference and only checks it again. It never offers to pay again for the same cart.

The cost is a table of pending orders from abandoned checkouts. The store keeps them and doesn't clean them up.

### Stock under concurrency

Taking stock is `UPDATE … SET stock = stock - n WHERE id = … AND stock >= n`, in the same transaction as the order claim. If any line updates no row, the whole transaction rolls back. There's no gap between reading and writing, and no stock count can go below zero.

The transaction locks rows in product-id order. Without that, two carts holding the same products in opposite orders can lock each other, and Postgres kills one of them with a deadlock error. A test runs those opposing carts against a real database. With the sort removed, it caught the deadlock in 5 of 5 runs.

### Refunds when a paid item sells out

The store doesn't reserve stock while someone is in the popup, so the last unit can sell between the cart check and the payment. The order then becomes `REFUND_PENDING`, and the server asks Paystack for a full refund. The checkout tells the shopper the refund can take up to 10 business days.

The server claims a refund request before sending it and releases the claim if Paystack refuses, so it retries and never sends the request twice. It checks a claim older than 5 minutes against Paystack's refund list, in case the server stopped mid-request. The webhook answers 500 until Paystack has accepted the refund, so Paystack keeps redelivering the event. When Paystack reports a refund as failed, the server logs it for a person to handle.

### Fresh stock on static pages

Pages show stock as of their last render. After an order takes stock, the server calls `revalidatePath` for that product's page and its category page, and Next.js regenerates them on the next request. Repeat confirmations and refunds don't trigger this.

The first version returned 404s. The routes used `dynamicParams = false`, so unknown slugs never rendered. On a production build, Next.js 15.5 answered a revalidated page on such a route with a 404 (`NoFallbackError`). One order took the ZX7 page and the speakers category offline. The dev server doesn't show this, so I had to check on a production build.

Both routes dropped the setting. Without it, every made-up URL would render its own 404 page, cached for a year, and made-up product URLs would also cost a database query. So `middleware.ts` turns unknown product slugs and category names away first. The trade-off is that the middleware runs on every product and category view. That's a small cost per visit, instead of an unbounded one per made-up URL.

### The cart lives in the browser, and the server doesn't trust it

The cart is a Zustand store saved to `localStorage`. It loads after the first render, so the server and browser HTML match. The store treats saved lines as untrusted input. It drops malformed lines and caps carts at 20 products and 99 of each.

The real check is on the server. The cart modal and checkout both send the cart to `validateCart`, which returns current stock and prices in one query. A pure function, `reconcileCart`, turns those facts into corrections like "only 2 left, quantity updated". If the shopper edits the cart while the check runs, the checkout discards the answer.

### Rate limiting in Postgres

The server allows 10 payment starts or cash orders per IP every 10 minutes. The counter is one upsert into a `RateLimit` table, so it holds across serverless instances without adding Redis.

The IP comes from `x-real-ip`, which Vercel sets and clients can't fake on Vercel. On any other host, someone has to check that assumption.

## Testing and CI

217 tests across 19 files. GitHub Actions runs lint, migrations, the seed, the tests, the build and the type-check on every push and pull request, against a Postgres service container.

- **Order logic runs against a real database.** Concurrency bugs come from how the database locks and orders writes, and a mock would agree with whatever the code assumes. Race tests send simultaneous fulfilments and opposing carts at the same rows.
- **The tests call Paystack's test API for real** when a test key is present. They create a transaction and verify it end to end, and deliver a signed webhook to the real route against the test database.
- **Test files run one at a time.** They share one test database, so a file that changes stock would otherwise break another file's assertions mid-run.

Tests can't show some things, so I checked them by hand on a production build: stock refreshing after an order (three cash orders, each followed by a page load), and the 404s that led to the middleware.

## Limitations

- **Test mode only.** The code refuses live Paystack keys. Going live would first need the refund-claim fix below and a real review of the payment flow.
- **The store keeps order data indefinitely.** Orders store the name, email, phone and address entered at checkout, with no retention policy or deletion. That's acceptable for a demo where the README asks everyone to use made-up details, and not for real customers.
- **The store doesn't reserve stock during checkout.** Someone can pay for an item that sells out while they're in the popup. The server refunds them automatically, but a real shop might hold stock for a few minutes instead.
- **Refund claims assume test-mode retry timing.** One timestamp marks both "refund being requested" and "refund accepted". In test mode Paystack retries webhooks hourly, longer than the 5-minute stale-claim window, so the server always retries an interrupted request. Live mode first retries every 3 minutes, so a crash at the wrong moment could stop the retries. Splitting the timestamp in two fixes it.
- **The rate limit trusts Vercel's `x-real-ip`.**
- **The catalog has two sources.** The middleware's product list is `lib/data.json`, and the pages read the database. They agree because every deploy seeds every product in the file and never deletes one. A product added only to the database would 404, so new products go through `lib/data.json`.

## On AI-assisted development

I built this with Claude Code.

I set the scope and the standard in a written build spec that asked for real persistence, real payments and a differentiator, written up as a case study. I switched to Paystack when Stripe wouldn't open a Nigerian account, and kept payments in test mode. I approved each module's spec and plan before any code existed, and decided which review findings got fixed. Where the tool proposed options, I chose among them.

## Credits

Design and product content: [Frontend Mentor](https://www.frontendmentor.io/challenges/audiophile-ecommerce-website-C8cuSd_wx). Typeface: [Manrope](https://fonts.google.com/specimen/Manrope). Payments: [Paystack](https://paystack.com) test mode.
