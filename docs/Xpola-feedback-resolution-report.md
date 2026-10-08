# Xpola Services — Feedback Resolution Report

**Review date:** 7 October 2026  
**Repository reviewed:** `daviskydriod/Xpola-Services` (`main`, commit `94f1d3d`)  
**Inputs:** Client feedback, bracketed owner decisions, and the supplied *Xpola Services Brand & Website Guide*.

## Executive summary

The requested website-facing changes have been applied and the frontend builds successfully. The Canada marketplace is now explicitly presented as **switched off** while Moneris setup is pending; Canadian visitors are directed to company information, services, and enquiries rather than checkout. The public site no longer presents unverified projects, client names, client counts, 24/7 support, testimonials, or “100% compliant” counters as established facts. The admin order screen now includes paid/failed status filters and date-range filtering. Password registration now requires at least eight characters, and the privacy page names Nigeria’s NDPA and Canada’s PIPEDA.

The supplied `api.zip` has now been audited, sanitized, and integrated into the selected GitHub repository under `/api`. Real credentials were removed from code and replaced with environment-variable configuration. An API-backed Projects module is now available in the admin dashboard, with public publication disabled by default. A staff-managed restock-alert queue and Admin → Notifications stock dashboard are now available. Low-stock/out-of-stock items are dashboard alerts; staff-triggered restock emails reuse the existing PHPMailer SMTP service. Hosting is outside Nosyra Digital’s scope and remains controlled by the owner/hosting provider.

## Feedback-to-action matrix

| Client feedback / owner decision | Action taken | Status / follow-up |
|---|---|---|
| Use ET, not EST, for Canadian hours | Updated Canada copy to `9:00 AM–5:00 PM ET` in the frontend and revised guide. | Done |
| Section 11 did not provide a real review list | Reworked Section 11 as a decision and handover checklist covering Moneris, Canadian marketplace, claims, passwords, privacy, operations, contacts, and ownership. | Done |
| Nosyra Digital contact details were missing | Added `info@nosyradigital.com.ng` and `+234 705 846 6586` as the approved email and phone/WhatsApp contact. | Done |
| Canada marketplace, loyalty, thresholds, referral discounts, and Canadian categories should be off | Canada marketplace and checkout routes remain gated by `MARKET_CONFIG.canadaEnabled = false`; Canada-facing copy now says visitors cannot order. Nigerian-only commerce language is separated in the revised guide. | Done for frontend and supplied API; verify production deployment variables |
| Explain what a Canadian shopper sees while Moneris is off | Updated `CanadaComingSoon` to say no Canadian marketplace order or checkout is possible; added links to Canada services/contact and Nigeria marketplace. | Done |
| Ownership and handover | Added ownership section: owner holds domain, Paystack access, and renewals; Nosyra uses FTP for uploads and does not control those credentials. | Done in guide; owner should insert registrar/hosting renewal dates and backup location |
| Unverified projects, “7+ sectors”, counters, testimonials | Removed/hidden public project pages, project navigation, animated stats/counters, and testimonial display until the client supplies verified material and approves publication. | Done; restore only after written client approval |
| Six-character password minimum | Registration UI and supplied PHP API now require at least eight characters. | Done |
| Restock alerts automatic or manual | The API now exposes Admin → Notifications for stock conditions and Admin → Restock alerts for customer opt-ins. Low/out-of-stock alerts are dashboard-only; staff can send an email once stock is restored through the existing PHPMailer SMTP service. | Done; staff-managed, not automatic |
| Coupon case sensitivity | Frontend, order validation, Moneris validation, and admin coupon creation/update normalize codes to uppercase. | Done at application layer |
| Privacy compliance | Added NDPA and PIPEDA references, and clarified Moneris is planned/inactive while Canada commerce is off. | Done; obtain legal review before publishing a compliance guarantee |
| Tables/lists splitting across pages | Revised guide uses page-break-friendly sections and avoids forcing long table rows across pages. | Done in revised PDF |
| Admin low-stock notification API documentation | Added the exact admin route, Bearer-token requirement, response fields, low-stock calculation, and separation from email delivery to the guide. | Done |
| Projects held for future client additions | Added public/admin project APIs and Admin → Projects CRUD, while keeping frontend and API publication flags disabled by default. | Done; requires owner approval before enabling |

## Repository and integration audit

### Verified in the frontend repository

- Vite production build completes successfully with `npm run build`.
- Direct TypeScript validation completes successfully with `npx tsc --noEmit`.
- Canada information, service, and contact routes remain available; project routes are intentionally hidden until owner approval.
- Canada marketplace and checkout routes resolve to the “market switched off” page while `canadaEnabled` is false.
- Nigeria checkout remains Paystack-based.
- Admin order status model includes `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, and `failed`.
- Admin order UI includes status, country, search, and date-from/date-to filters.
- Frontend API client already expects `status` and `payment_status` and normalises legacy payment outcomes for display.
- Activity logging calls are present in the frontend, but persistence remains dependent on the deployed PHP API.

### Supplied API audit and deployment checks

The supplied archive is now included under `/api`. It contains the main auth, products, orders, admin, support, notifications, wishlist, referral, loyalty, Paystack, and Moneris endpoints, but it is not a complete match for the original 33-file naming list and has no `schema.sql`. The following must still be tested against the deployed database and hosting environment:

1. `api/orders.php` creates pre-payment orders and maps Paystack success/failure idempotently.
2. `api/payments/paystack_verify.php` performs server-to-server verification and updates `payment_status` plus `status` transactionally.
3. `api/admin/orders.php` now supports `status`, `payment_status`, country, `dateFrom`, and `dateTo` filters and returns both status fields.
4. The supplied API enforces an eight-character password minimum and defaults `CANADA_MARKET_ENABLED=0`.
5. User and admin activity is written server-side; browser activity calls are not the authority.
6. Canada product/category/delivery commerce and Moneris checkout are rejected while the flag is disabled, including direct public API reads.
7. Low-stock/out-of-stock notifications are dashboard-only. Customer restock email delivery is manual: Admin → Restock alerts calls `config/mail.php` → `sendMail()` through the existing PHPMailer SMTP configuration; no notification worker is deployed.
8. Production must provide database, JWT, existing mail, Paystack, and Moneris environment variables; no real secrets remain in the repository and no second restock-specific SMTP setup is required.

## Validation performed

```text
npx tsc --noEmit  ✅ passed
npm run build      ✅ passed
PHP syntax lint (39 files) ✅ passed
```

The build reports only Vite’s existing bundle-size advisory; TypeScript, frontend compilation, and PHP syntax validation passed.

## Owner decisions still required

- Approved Nosyra Digital email address and phone number for the guide.
- Domain registrar, hosting/FTP renewal dates, and backup location/retention policy.
- Confirmation of the production PHP API path, database access, deployment variables, and successful SMTP test for the existing mail configuration.
- Written approval and verified source material for any real projects, client testimonials, names, logos, sector/client counters, or compliance claims. Enable both project publication switches only after approval.
- Confirmation that low-stock email automation is not enabled; customer restock emails remain staff-triggered.
- Confirmation of coupon case sensitivity at the PHP API/database layer.
