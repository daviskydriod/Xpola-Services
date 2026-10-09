# Xpola Services — Backend Handover

**Client handover package for the Xpola Services website and PHP API**

Repository: `https://github.com/nosyradigital8-gif/Xpola-Services`
Latest handover commit: `4423e24`

## What this repository contains

This repository contains the PHP backend/API used by the Xpola Services website. It is deployed separately from the React frontend and connects the website to the database, authentication, orders, payments, emails, customer accounts, admin tools, maintenance mode, projects, and stock notifications.

The backend files are located in the [`api/`](api/) directory.

## Client-friendly overview

The API supports:

- Customer registration, login, profiles, wishlist, loyalty, referrals, and support.
- Product, category, delivery-fee, coupon, and order management.
- Nigerian Paystack payment verification and webhooks.
- Canada information and service pages while the Canada marketplace remains off.
- Admin maintenance mode with a public maintenance page.
- Admin project drafts, approvals, galleries, and public project feeds.
- Low-stock, out-of-stock, and customer restock-request dashboards.
- Staff-managed restock emails through the configured SMTP service.
- Activity and audit logging.
- Secure image uploads and account authentication.

## Important current business settings

- **Nigeria marketplace:** enabled for the configured Nigerian payment and delivery flow.
- **Canada information/services:** available.
- **Canada marketplace and checkout:** deliberately disabled while Moneris setup and launch testing are pending.
- **Public projects:** remain controlled by feature flags and approval status.
- **Maintenance mode:** controlled by Admin → Maintenance; when enabled, public visitors see the maintenance page while admin routes remain available.

## How to deploy the backend

1. Upload the contents of `api/` to the hosting provider’s PHP/API directory.
2. Create the production database and database user.
3. Copy `.env.example` to the hosting environment’s private configuration area and fill in the real values.
4. **Never commit or send real passwords, JWT secrets, database credentials, SMTP passwords, Paystack keys, or Moneris keys in Git.**
5. Run:

   ```bash
   composer install --no-dev --optimize-autoloader
   ```

6. Point the frontend API base URL to the deployed `/api` URL.
7. Configure HTTPS, PHP-FPM/cPanel routing, CORS, upload permissions, and scheduled backups.
8. Configure Paystack webhook signing and server-side payment verification.
9. Configure SMTP if staff need to send restock alerts or operational emails.
10. Test the API and database on the hosting server before accepting live orders.

See [`api/README.md`](api/README.md) and [`api/.env.example`](api/.env.example) for the technical configuration list.

## Maintenance mode procedure

1. Sign in to `/admin`.
2. Open **Maintenance**.
3. Turn the switch on.
4. Enter the visitor message and estimated return time if needed.
5. Click **Enable Maintenance Mode** / **Save**.
6. Check the public website in a private browser window.
7. When work is complete, turn the switch off and save again.
8. Confirm the public home page is visible again.

The public status endpoint is `GET /api/maintenance.php`. The current frontend avoids stale cached responses and re-checks the status every 30 seconds.

## Canada visitor notice

The frontend includes a small, dismissible Canada notice below the header for visitors identified as being in Canada. It links to the equivalent Canada information/service route and does not force a redirect. If the IP lookup service is unavailable, the website continues normally.

## Handover boundaries

The client/owner or hosting provider remains responsible for:

- Domain and hosting ownership, renewals, and access.
- Production database, backups, restore testing, and server security.
- PHP version, PHP-FPM, Composer, HTTPS, cron jobs, and file permissions.
- Paystack, SMTP, and future Moneris account credentials.
- Legal review of privacy, compliance, payment, and customer-facing claims.
- Final production testing and approval before launch.

Nosyra Digital should receive only the access required for agreed technical support. Do not place credentials in this repository or in the handover ZIP.

## Latest implementation record

- `eb57a54` — Add Canada IP location notice.
- `4423e24` — Fix public maintenance mode propagation.
- Earlier history includes projects management, Canada marketplace gating, stock/restock notifications, maintenance controls, API integration, payment safeguards, and guide/report updates.

Validation completed in the sandbox:

- `npx tsc --noEmit` passed.
- `npm run build` passed.
- `git diff --check` passed.
- Release ZIP archives passed `unzip -t` integrity checks.
- PHP lint must be run on the deployment server because PHP CLI is not installed in the current sandbox.

## Support and next steps

Before production launch, the client/hosting provider should complete the deployment checklist in `api/README.md`, verify the database and environment variables, test one successful and one failed payment, test maintenance mode, and confirm the backup/restore process.
