# Xpola Services PHP API — Client Handover Guide

This directory is the PHP backend for the Xpola Services website. It is deployed separately from the React frontend and connects the website to the database, authentication, shop, orders, payments, email, admin tools, projects, notifications, and maintenance mode.

## For the client / owner

The backend is ready to hand to the client or hosting provider for deployment. Production credentials are intentionally **not** included. The client or hosting provider must provide and protect the database, payment, SMTP, JWT, and server credentials.

The current business configuration is:

- Nigerian marketplace and Paystack checkout: enabled for the configured production setup.
- Canada information and service pages: available.
- Canada marketplace and Moneris checkout: disabled until Moneris setup, server-side verification, refund handling, and launch testing are complete.
- Public projects: controlled by approval and feature flags.
- Maintenance mode: controlled from Admin → Maintenance.

## Files and folders

- `config/` — database, CORS, authentication, mail, and market configuration.
- `admin/` — authenticated staff endpoints.
- `payments/` — Paystack verification/webhook and Moneris integration.
- `utils/` — shared upload and utility functions.
- Root PHP files — customer-facing API endpoints.
- `.env.example` — configuration names only; it contains no production secrets.
- `composer.json` — PHP dependency definition.

## Deployment checklist

1. Upload the complete `api/` directory to the hosting provider.
2. Use PHP 8.1+ or the version approved by the hosting provider.
3. Create the production MySQL/MariaDB database and restricted database user.
4. Configure the environment values listed in `.env.example` outside public Git history.
5. Install dependencies:

   ```bash
   composer install --no-dev --optimize-autoloader
   ```

6. Configure HTTPS, PHP-FPM/cPanel routing, upload permissions, and CORS for the frontend domain.
7. Configure the Paystack secret, webhook signing, and server-to-server verification.
8. Configure SMTP in the existing mail settings if staff will send restock or support emails.
9. Keep `CANADA_MARKET_ENABLED=0` until the owner approves the Canadian marketplace launch.
10. Run the PHP syntax check on the deployment host:

   ```bash
   find . -name '*.php' -not -path './vendor/*' -print0 | xargs -0 -n1 php -l
   ```

11. Test database connectivity, registration/login, product reads, order creation, payment verification, failed payment handling, admin access, image uploads, maintenance mode, and email configuration.
12. Configure daily backups and perform a restore test before launch.

## Environment and secrets

Copy the variable names from `.env.example` into the hosting provider’s private environment configuration. Do not put real values in GitHub, the handover ZIP, screenshots, email, or this README.

Sensitive values include database passwords, JWT secrets, Paystack keys, Moneris keys, SMTP passwords, admin credentials, and private storage credentials.

## Maintenance mode

Visitors read:

```text
GET /maintenance.php
```

Staff use the authenticated endpoint from Admin → Maintenance:

```text
GET  /admin/maintenance.php
POST /admin/maintenance.php
```

When enabled, the frontend displays the maintenance page and leaves `/admin` and `/admin/dashboard` available to staff. The public endpoint sends no-cache headers so an old OFF response is not retained by a browser or cache.

The admin switch must be followed by clicking the Save/Enable button. Changing the visual switch without saving does not update production.

## Projects

Staff use an admin Bearer token with:

```text
GET    /admin/projects.php
POST   /admin/projects.php
PUT    /admin/projects.php?id=123
DELETE /admin/projects.php?id=123
```

The public feed returns approved records only:

```text
GET /projects.php?country=NG
GET /projects.php?country=CA
```

Public project delivery requires both the API and frontend feature flags to be enabled, in addition to each project being approved.

## Stock and restock workflow

- `GET /admin/notifications.php` returns low-stock, out-of-stock, and pending restock-request dashboard data.
- `GET /admin/restock.php` returns opted-in customer restock requests.
- `POST /admin/restock.php?action=send` sends an alert after stock is restored.
- `POST /admin/restock.php?action=dismiss` clears a request without sending an email.

Low-stock and out-of-stock dashboard entries do not automatically send customer emails. Restock emails are staff-triggered and use the existing SMTP/PHPMailer configuration.

## Payments and Canada controls

Nigerian orders use server-side Paystack verification. A browser callback alone must never be treated as final proof of payment. Staff should check the server-side order and payment status before dispatch.

Canadian marketplace products, categories, delivery fees, and Moneris checkout are rejected while `CANADA_MARKET_ENABLED=0`. Canada information, service, and enquiry routes remain available.

## Security and ownership

The client/owner or hosting provider controls the domain, hosting account, production database, backups, payment accounts, SMTP account, and future Moneris account. Technical support should receive least-privilege access only.

Do not expose debug endpoints or database administration tools publicly. Rotate credentials if a secret is ever pasted into a chat, ticket, screenshot, or commit.

## Handover status

Latest related source commits:

- `eb57a54` — Add Canada IP location notice.
- `4423e24` — Fix public maintenance mode propagation.

Validation already completed in the development sandbox:

- TypeScript type-check passed.
- Frontend production build passed.
- Git diff check passed.
- Release ZIP integrity checks passed.
- PHP lint remains to be run on the deployment server because the sandbox does not include the PHP CLI.

## Final production sign-off

Before accepting live orders, the client/hosting provider should record:

- Production API URL and deployment date.
- PHP version and Composer deployment result.
- Database migration/creation result and backup location.
- Successful registration/login test.
- Successful product, cart, order, and failed-payment tests.
- Successful Paystack webhook and server-side verification test.
- Successful SMTP/restock email test.
- Maintenance enable/disable test.
- Confirmation that Canada marketplace remains off until approved.
- Hosting owner, renewal date, support contact, and restore-test date.
