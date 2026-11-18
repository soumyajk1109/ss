# SS

Mobile-first shop for the Indian clothing brand SS. Men, women, and kids, shipping to Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata, and Pune.

Next.js App Router, TypeScript, Tailwind, Drizzle, postgres.js, NextAuth OTP login, Razorpay (UPI, cards, net banking, wallets, EMI, pay later) and cash on delivery confirmed with an OTP.

## Setup

```bash
docker compose up -d
copy .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

`schema.ts` is the source of truth. `npm run db:push` creates the tables. The first SQL migration is `drizzle/0000_ss_init.sql` if you prefer `psql` over push.

Use a **session** Postgres connection. Checkout takes `FOR UPDATE` row locks inside a transaction, which the Supabase transaction pooler (port 6543) will not hold. On Neon, use the direct connection string for the app, not the pooled one. `prepare: false` is already set for poolers that do support sessions.

### Staff login

With `OTP_DEBUG=true` the code is returned in the API response and printed on the sign-in screen. Turn that off in production and send the code from `deliverOtp()` in `src/lib/otp.ts`.

| Who | Destination | Role |
| --- | --- | --- |
| SS Admin | `+91 98765 43210` or `admin@ssapparel.example` | ADMIN |
| SS Floor | `+91 98765 43211` | FULFILLMENT |

Admin can create products, publish, and import CSV. Floor can adjust stock and move orders. Customers are created on first successful OTP.

## Payments

`PAYMENTS_MODE=demo` (or missing Razorpay keys) lets checkout simulate `payment.captured` and run the same stock commit as a live webhook.

Live mode:

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Webhook `POST /api/webhooks/razorpay` with `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `payment.failed`
- Automatic capture. The handler checks the raw-body HMAC before it parses JSON, then checks the amount in paise.

COD sends a 6-digit code to the shipping mobile. Verifying it commits the sale. A failed payment keeps the 15-minute hold so the shopper can retry. Expiry releases `reserved_quantity`. Call `POST /api/cron/release-reservations` with `Authorization: Bearer $CRON_SECRET` every minute; checkout also releases due holds before it starts a new one.

A capture that arrives after the hold expired is acknowledged and flagged `late_payment_needs_refund`. It does not decrement stock.

## Stock

`available = stock_quantity - reserved_quantity`.

| Event | stock | reserved | log |
| --- | --- | --- | --- |
| Checkout starts | unchanged | +qty | RESERVED |
| `payment.captured` or COD OTP | −qty | −qty | SOLD |
| Hold expires or unpaid cancel | unchanged | −qty | RELEASED |
| Cancel after sale, or return | +qty | unchanged | RETURNED |
| Warehouse add | +qty | unchanged | STOCK_IN |
| Recount down | −qty | unchanged | ADJUSTMENT |

Locks are always the order row first (when it exists), then variants in ascending id. A new checkout has no order yet, so it locks variants only, then inserts the order. All of that is one `db.transaction()`.

## GST

Selling prices are GST-inclusive rupees. Maharashtra (Mumbai, Pune) splits the tax into CGST and SGST. Every other seeded metro is IGST. The rate lives on the product (`5` at or under ₹1,000 in the seed, `12` above). Shipping and the COD fee are inclusive at 18% under SAC `996812`. Set `SELLER_GSTIN` before a real invoice; until then the invoice is marked as a sample. Confirm HSN and SAC with a tax advisor.

## Folder map

```
src/app/(shop)          storefront
src/app/admin           catalog, stock, import, orders, GST invoice
src/app/api             cart, checkout, Razorpay webhook, OTP, admin, cron
src/lib/db/schema.ts    Drizzle schema
src/lib/db/seed.ts      departments, categories, products, pincodes, staff
src/lib/inventory.ts    row locks and the stock ledger
src/lib/checkout.ts     reserve, price, Razorpay order or COD OTP
src/lib/pricing.ts      inclusive GST split
src/components          header, filters, buy box, checkout, admin tools
data/stock-import-sample.csv
```

Try pincodes `400001`, `110001`, `560001`, `500001`, `600001`, `700001`, `411001`. `SS-M-TEE-TUR-XL` is seeded at zero. `SS-M-KUR-IVY-XL` is under the low-stock threshold.
