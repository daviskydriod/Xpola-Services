# Xpola PHP API — Required Handover Contract

The selected GitHub repository now contains the supplied, sanitized PHP API under `/api` alongside the React/Vite frontend. Use this contract when deploying and reconciling the API against the final frontend.

## Order and payment contract

- `api/orders.php` must create an order in a pre-payment state and accept an idempotency key.
- Payment verification must be server-to-server. A browser callback alone must never mark an order paid.
- Paystack success maps to `payment_status=paid` and `status=paid` or `processing`.
- Declined, abandoned, cancelled, or otherwise unsuccessful payments map to `payment_status=failed` and `status=failed`.
- Repeated verification for the same reference/order must be idempotent.
- `api/admin/orders.php` must return both `status` and `payment_status` and support `status`, `payment_status`, `country`, `dateFrom`, and `dateTo` filters.
- While the Canada marketplace feature flag is off, the API must reject Canadian product/order creation even if called directly.

## User/account contract

The API must enforce an eight-character minimum password (or stronger), preserve generic password-reset responses, and persist server-side activity for registration, login, profile changes, addresses, wishlist, support, and orders.

## Commerce behavior while Canada is off

Canadian information, services, projects, and enquiries remain live. Canadian marketplace categories, checkout, loyalty/free-delivery thresholds, referral discounts, and payment processing remain unavailable until the owner approves launch and Moneris/API testing is complete.

## Open deployment checks

- Confirm actual deployed API path, database, and environment variables.
- Confirm schema/migration for `orders.payment_status`, all required order statuses, and activity log fields/indexes.
- Restock alerts are currently recorded for staff follow-up; deploy and verify an automatic worker before promising email alerts.
- Confirm coupon normalization and case sensitivity.
- Confirm backup, logging, webhook, and refund handling.
