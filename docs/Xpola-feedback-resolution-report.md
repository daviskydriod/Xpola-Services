# Xpola Services — Feedback Resolution Report

**Review date:** 7 October 2026  
**Repository reviewed:** `daviskydriod/Xpola-Services` (`main`, commit `94f1d3d`)  
**Inputs:** Client feedback, bracketed owner decisions, and the supplied *Xpola Services Brand & Website Guide*.

## Executive summary

The requested website-facing changes have been applied and the frontend builds successfully. The Canada marketplace is now explicitly presented as **switched off** while Moneris setup is pending; Canadian visitors are directed to company information, services, and enquiries rather than checkout. The public site no longer presents unverified client names, client counts, 24/7 support, or “100% compliant” counters as established facts. The admin order screen now includes paid/failed status filters and date-range filtering. Password registration now requires at least eight characters, and the privacy page names Nigeria’s NDPA and Canada’s PIPEDA.

The separate PHP API deployment is **not contained in the selected GitHub repository**. The repository contains frontend PHP helper/debug files only, so the report records the required PHP contract and deployment checks rather than claiming that the absent API files were changed.

## Feedback-to-action matrix

| Client feedback / owner decision | Action taken | Status / follow-up |
|---|---|---|
| Use ET, not EST, for Canadian hours | Updated Canada copy to `9:00 AM–5:00 PM ET` in the frontend and revised guide. | Done |
| Section 11 did not provide a real review list | Reworked Section 11 as a decision and handover checklist covering Moneris, Canadian marketplace, claims, passwords, privacy, operations, contacts, and ownership. | Done |
| Nosyra Digital contact details were missing | The guide now provides a clearly labelled owner-confirmation field rather than inventing an email or phone number. | Owner must supply the agency’s approved contact details |
| Canada marketplace, loyalty, thresholds, referral discounts, and Canadian categories should be off | Canada marketplace and checkout routes remain gated by `MARKET_CONFIG.canadaEnabled = false`; Canada-facing copy now says visitors cannot order. Nigerian-only commerce language is separated in the revised guide. | Done for frontend; verify API blocks CA orders server-side |
| Explain what a Canadian shopper sees while Moneris is off | Updated `CanadaComingSoon` to say no Canadian marketplace order or checkout is possible; added links to Canada services/contact and Nigeria marketplace. | Done |
| Ownership and handover | Added ownership section: owner holds domain, Paystack access, and renewals; Nosyra uses FTP for uploads and does not control those credentials. | Done in guide; owner should insert registrar/hosting renewal dates and backup location |
| Unverified “7+ sectors”, counters, testimonials | Changed badges to exact published counts, replaced unsupported counters, removed the public testimonial carousel from the home and About pages, and retained only a generic reference placeholder in source data. | Done; restore testimonials only after written client approval |
| Six-character password minimum | Registration UI now requires eight characters. | Done; PHP API must enforce the same minimum |
| Restock alerts automatic or manual | Documented as an open deployment check: the UI stores an opt-in, but the PHP notification job/provider must be verified before promising automatic alerts. | Confirm on API/hosting |
| Coupon case sensitivity | Checkout normalises typed codes to uppercase. Backend normalization/case sensitivity still needs confirmation in the PHP API. | Confirm on API |
| Privacy compliance | Added NDPA and PIPEDA references, and clarified Moneris is planned/inactive while Canada commerce is off. | Done; obtain legal review before publishing a compliance guarantee |
| Tables/lists splitting across pages | Revised guide uses page-break-friendly sections and avoids forcing long table rows across pages. | Done in revised PDF |

## Repository and integration audit

### Verified in the frontend repository

- Vite production build completes successfully with `npm run build`.
- Direct TypeScript validation completes successfully with `npx tsc --noEmit`.
- Canada information, service, project, and contact routes remain available.
- Canada marketplace and checkout routes resolve to the “market switched off” page while `canadaEnabled` is false.
- Nigeria checkout remains Paystack-based.
- Admin order status model includes `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, and `failed`.
- Admin order UI includes status, country, search, and date-from/date-to filters.
- Frontend API client already expects `status` and `payment_status` and normalises legacy payment outcomes for display.
- Activity logging calls are present in the frontend, but persistence remains dependent on the deployed PHP API.

### Not verifiable from this repository

The requested 33-file PHP API set and `schema.sql` are not present in the selected repository. Only frontend-side PHP helper/debug files are present. Therefore the following must be checked in the separately deployed API codebase:

1. `api/orders.php` creates pre-payment orders and maps Paystack success/failure idempotently.
2. `api/payments/paystack_verify.php` performs server-to-server verification and updates `payment_status` plus `status` transactionally.
3. `api/admin/orders.php` supports `status`, `payment_status`, country, `dateFrom`, and `dateTo` filters and returns both status fields.
4. The schema accepts all required order statuses and has `payment_status` plus suitable indexes.
5. User and admin activity is written server-side; browser activity calls are not the authority.
6. Canada order creation is rejected while the Canada marketplace flag is disabled, even if a client calls the API directly.
7. Restock notification delivery and coupon normalization are implemented or explicitly described as manual operations.

## Validation performed

```text
npm run build  ✅ passed
```

The build reports only Vite’s existing bundle-size advisory; it does not report TypeScript or compilation errors.

## Owner decisions still required

- Approved Nosyra Digital email address and phone number for the guide.
- Domain registrar, hosting/FTP renewal dates, and backup location/retention policy.
- Confirmation of the deployed PHP API path and repository/access for the 33 backend files.
- Written approval for any real client testimonials, names, logos, sector/client counters, or compliance claims.
- Confirmation of whether restock alerts are automatic, manual, or not yet enabled.
- Confirmation of coupon case sensitivity at the PHP API/database layer.
