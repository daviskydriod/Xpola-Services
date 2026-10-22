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
- Build the frontend with `VITE_API_URL` pointing to the deployed API, for example `https://xpolaservices.com/api`; Vite values are build-time values and are not read from the uploaded website at runtime.
- Keep the real backend secrets in `public_html/api/.env`. The PHP API loads that file at runtime; never upload the frontend `.env.local` or replace the live `.env` with `.env.example`.
- Set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to the exact frontend origin, without `/api`.
- With cPanel/FTP, upload the contents of `dist/` to `public_html/` and upload the API to `public_html/api/`. Keep `api/.htaccess` in place so environment and Composer files are not served publicly.
- Confirm schema/migration for `orders.payment_status`, all required order statuses, and activity log fields/indexes.
- Admin → Notifications is dashboard-only for low/out-of-stock alerts. Customer restock emails are staff-managed in Admin → Restock alerts and reuse the existing SMTP service in `config/mail.php`; test the existing mail configuration before production use.
- Coupon codes are normalized to uppercase by the frontend and API; keep stored codes uppercase.
- Confirm backup, logging, webhook, and refund handling.


## Staff-managed restock alerts

The wishlist API stores `notify_on_restock`. The admin dashboard uses `/admin/notifications.php` for low/out-of-stock dashboard alerts and `/admin/restock.php` to list opted-in customers, send an email after stock is restored, dismiss requests, record audit history, and clear the opt-in after handling. The restock endpoint reuses the existing PHPMailer SMTP service in `config/mail.php`; no second restock-specific mail setup is required.

## Environment ownership

| Value | Stored in | Visibility |
|---|---|---|
| `VITE_API_URL` | Local `.env.local` before `npm run build` | Compiled into the browser; not secret |
| `VITE_PAYSTACK_PUBLIC_KEY` | Local `.env.local` before `npm run build` | Public payment key; not secret |
| `DB_*`, `JWT_SECRET`, `PAYSTACK_SECRET_KEY` | cPanel `public_html/api/.env` or server environment | Private server secrets |
| `MAIL_*`, `MONERIS_*` | cPanel `public_html/api/.env` or server environment | Private server secrets |
| `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` | cPanel `public_html/api/.env` or server environment | Server configuration |

For future changes, back up the current files and database first. Rebuild and re-upload `dist/` for frontend changes, update only the required files under `api/` for backend changes, preserve the live `api/.env`, and test the public site, API, authentication, shop, checkout, payments, admin routes, uploads, and mail before disabling maintenance mode.

## Agency and owner responsibilities

Nosyra Digital is the technical agency for approved website fixes, maintenance, FTP/cPanel deployment support, and API troubleshooting. Contact: `info@nosyradigital.com.ng` or `+234 705 846 6586` (phone/WhatsApp).

The client/owner retains control of the domain, hosting/cPanel, production database, backups, payment accounts, SMTP account, renewals, and final production approval. Give the agency only the least-privilege access required for the agreed work.

The client has the built frontend `dist` files deployed on the client-controlled hosting server. The complete raw frontend source and public source files will be supplied to the client after the outstanding balance has been paid in full. The client’s control of the domain, hosting account, deployed `dist` files, and production operation is not changed by this source-release condition.
