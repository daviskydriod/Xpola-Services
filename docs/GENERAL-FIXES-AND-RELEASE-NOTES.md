# Xpola Services — General Fixes and Release Notes

**Release date:** 7 October 2026  
**Source commit:** `15fd427`

## Fresh release files

- `xpola-frontend-dist.zip`: production Vite frontend only; upload the contents of `frontend/` to the website document root.
- `xpola-api-sanitized.zip`: sanitized PHP API; configure the hosting environment from `api/.env.example`.
- `xpola-services-release.zip`: combined frontend and API handover package.

## Frontend fixes
- Added an API-backed Projects page and Admin → Projects CRUD for future approved project additions; both public publication switches remain disabled by default.

- Disabled the Canada marketplace and checkout while Moneris setup is pending.
- Added a clear Canadian visitor journey for company information, services, and enquiries.
- Kept Canadian hours as **ET**, not EST.
- Hid public project pages and project navigation; retained the source files for a future owner-approved relaunch.
- Removed public animated counters and testimonial display until the client supplies approved figures and testimonials.
- Updated Canadian and Nigerian market copy so commerce and payment instructions are not mixed.
- Added NDPA and PIPEDA references to the privacy page.
- Increased the UI password minimum to eight characters.
- Corrected API-facing TypeScript types, pagination, maintenance response naming, Paystack options, product cards, toast exports, and calendar compatibility.
- Added order status, payment status, country, search, and date-range filtering in the admin order view.
- Updated terms so Canadian ordering and delivery are not presented as active.

## Backend/API fixes

- Added the supplied PHP API under `/api` and documented deployment requirements.
- Removed embedded database, JWT, mail, and Paystack credential fallbacks.
- Added `.env.example`; secrets must be supplied by hosting environment variables.
- Added `CANADA_MARKET_ENABLED=0` as the safe default.
- Blocked direct Canadian product, category, delivery, and Moneris commerce access while the flag is disabled.
- Added server-side `dateFrom`, `dateTo`, and `payment_status` filtering to admin orders.
- Enforced an eight-character minimum password for registration, password changes, and password resets.
- Normalized coupon codes to uppercase in validation and admin management paths.
- Preserved server-side Paystack verification and idempotent payment state transitions.
- Preserved server-side activity/audit logging hooks.
- Added Admin → Restock alerts: staff can see opted-in customers, send an email after stock is restored, and dismiss requests; each send is audited and duplicate sends are prevented.

## Documentation and layout fixes

- Added the approved Nosyra Digital agency support contact:
  - `info@nosyradigital.com.ng`
  - `+234 705 846 6586` — phone and WhatsApp
- Clarified that Nosyra Digital handles website fixes, maintenance, deployment support, and technical questions; hosting ownership and hosting operations are outside Nosyra Digital’s scope.
- Added the ownership and handover checklist.
- Added the order-status table.
- Kept the full five-step client process together on one page.
- Kept the order-status table together with the Admin Guide on a fresh page.
- Added page-break-avoidance rules for tables and lists.

## Deployment checks still required

1. Set database, JWT, mail, Paystack, and Moneris environment variables.
2. Install PHP dependencies with `composer install --no-dev --optimize-autoloader`.
3. Test the API against the production database and verify all required migrations/schema fields.
4. Keep `CANADA_MARKET_ENABLED=0` until the owner approves Moneris launch testing.
5. Client must supply verified public figures and approved testimonials before they are added back.
6. Confirm backup, renewal, webhook, refund, and restock-notification procedures.
7. Rotate any real credentials that were present in the original API archive before production deployment.

## Validation

- `npx tsc --noEmit` passed.
- `npm run build` passed.
- 38 PHP files passed `php -l`.
- `git diff --check` passed.
