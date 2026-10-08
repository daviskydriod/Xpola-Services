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
- Admin → Notifications is dashboard-only for low/out-of-stock alerts. Customer restock emails are staff-managed in Admin → Restock alerts and reuse the existing SMTP service in `config/mail.php`; test the existing mail configuration before production use.
- Coupon codes are normalized to uppercase by the frontend and API; keep stored codes uppercase.
- Confirm backup, logging, webhook, and refund handling.


## Staff-managed restock alerts

The wishlist API stores `notify_on_restock`. The admin dashboard uses `/admin/notifications.php` for low/out-of-stock dashboard alerts and `/admin/restock.php` to list opted-in customers, send an email after stock is restored, dismiss requests, record audit history, and clear the opt-in after handling. The restock endpoint reuses the existing PHPMailer SMTP service in `config/mail.php`; no second restock-specific mail setup is required.
