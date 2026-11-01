# DomiCha customer ordering

Customer: https://domicha-customer-preview.netlify.app/
Owner workspace: https://domicha-customer-preview.netlify.app/owner.html

Separate static cream/orange customer application. Franchisees sign in using approved Supabase membership and their assigned Active branch. The owner workspace requires the exact linked owner identity and protected Admin role. No public sign-up, JWT storage or service key in the frontend.

## Current behavior

- 68 imported stock products and images; 63 have positive selling prices. The 5 unpriced items start paused.
- Owner chooses active / paused / hidden. Hidden products are excluded by the customer API; paused products remain visible but cannot be ordered. Availability is rechecked in the database on submit and confirmation. Stock quantity is not shown.
- Customer orders persist in `franchisee_orders` and `franchisee_order_items` with `sales_channel=customer-v1`. Customer history is scoped to the verified user; the branch is taken from server-side membership, never the form.
- Server computes totals from catalog prices in integer satang. The order and lines commit atomically; a request UUID prevents duplicate submission on retry.
- Orders start pending quote. Owner checks inventory manually and confirms the delivery fee (zero for pickup). The confirmed total is visible on customer refresh. Stale revisions cannot overwrite newer changes. Owner may cancel unpaid orders with a second confirmation click.
- Added owner-configured PromptPay QR after quote confirmation, owner-only manual receipt of funds, immutable receipts and queued Drive/LINE delivery. See ../payments/README.md for activation status and acceptance checks. Inventory reservation/deduction and shipment operations remain later phases. Orders are managed in owner.html; they are not copied into the original Firebase stock UI.

## Catalog imports

The catalog is an imported snapshot, not continuous stock synchronization. `scripts/import-stock.py` reads only the source itemCatalog and selling prices, saves photos and preserves product-image-overrides.json. No cost/personnel fields are imported. The source does not specify sale units, so the app uses หน่วย.

After importing: `node scripts/catalog-sales-sql.mjs > /tmp/domicha-catalog-sync.sql` (from customer-app). Review and apply with the service-side SQL tool, then rebuild/deploy updated photos. The sync preserves owner paused/hidden choices, pauses products losing their price, hides removed source products and increments changed row revisions. Never expose the SQL endpoint or service key to the browser.

## Backend

`supabase/migrations/20261031170654_customer_sales_orders.sql` adds customer_sale_products, customer_sales_events, quote fields and three atomic RPCs. Both new tables use RLS with no browser grants. RPCs are security invoker, service_role only. `supabase/functions/customer-commerce` validates auth.getUser plus protected role/active membership before every action; owner mutation checks are also inside SQL. Legacy orders and financial fields are outside this workflow. Deploy customer-commerce with verify_jwt=false because its handler performs its own auth.getUser verification; never remove the handler authorization.

`member-auth.js` retains the access token in memory and passes it only to the configured Supabase origin. Refreshing or closing the page requires login again. Cart-only storage is user-scoped sessionStorage; orders always reload from the backend. Expired sessions require signing in again.

## Validation

Run `node --test customer-app/tests/*.test.js onboarding/tests/*.test.mjs` from the repository root, and `npm --prefix customer-app run build`. Run `supabase/tests/customer-sales.sql` administratively for rollback-only database tests.

Live acceptance: TEST-MEMBER-01 submitted a clearly synthetic delivery order for tea (40 THB), owner confirmed 35.50 THB delivery, customer saw 75.50 THB and unpaid status, then owner cancelled the test order. Product hide/reopen was verified against the customer catalog. No payment or stock change occurred. The cancelled test record is retained for audit. A second labelled QR-only test order was also cancelled without payment or receipt.

Existing security advisor warnings on older functions' search_path and leaked password protection remain outside this change; new service-only tables intentionally have RLS with no client policies.

Member onboarding and invitations: see ../onboarding/README.md. `activate.html` uses a one-time email link, removes its fragment and does not store credentials. Product image cutouts and overrides: product-image-edit-notes.md.

## Backup payment reviewers
Owner menu **ผู้ตรวจรับเงิน** assigns/revokes a confirmed existing DomiCha account by email. No reviewer is provisioned by default. The separate `payment-review.html` accepts only the exact owner or a current protected reviewer grant. Staff see only the pending confirmed payment queue, names/branch/amount and payment request availability; no shipping/billing address, bank settings, catalog editing, quote approval, worker keys, receipts archive links or membership controls. A franchisee who is also a reviewer retains their own customer actions. Own-order confirmation is denied. Revocation is checked on every request and serialized against receipt confirmation in SQL. Owner detail shows the confirmer and confirmation time; immutable receipts/events keep the actor UUID.

The owner must arrange authorized access to actual bank transactions separately. This feature does not grant bank access, create users, or send invitations. Tests use rollback-only synthetic staff; no permanent grant or paid receipt is created.

New staff without an account: owner **เชิญผู้ตรวจใหม่** creates a private one-time activation link (manual delivery, no automatic email). Only a newly reserved email or the same known unconfirmed invitation may generate an invite; confirmed/existing accounts never receive a recovery link. New accounts become Sales staff without a franchise membership; SQL blocks reviewer access until email confirmation. Grants can be revoked before activation; generating/resending a link cannot reactivate a revoked grant. Invitations have a 60-second generation limit and a bound attempt ID; tokens are returned only after staff registration succeeds and are never stored in the database/browser storage. The owner may regenerate an expired pending invite. A partial Auth creation failure can leave an unassigned account requiring owner review; the flow fails closed instead of overwriting existing accounts. `owner.html#reviewers` routes to this view after owner login; activation uses an allowlisted `next=payment-review` destination.

Validation: 73 automated tests, build, deployed-file comparison, and rollback-only reviewer/invitation SQL suites passed. Layout preview was rendered from the actual owner view with no real account submission. No recipient was invited and no permanent reviewer grant was created by these tests.
