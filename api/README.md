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
4. Create the private backend environment file:

   ```bash
   cp .env.example .env
   ```

   Edit `api/.env` with the real database, JWT, payment, mail, frontend-origin, and feature-flag values. The API automatically loads this file before reading `getenv()` values. On production hosting, you can instead define the same variables in cPanel/Apache/PHP-FPM/server environment settings; server-provided values take precedence over `api/.env`.
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

### Local development

From the `api/` directory:

```bash
cp .env.example .env
```

Then replace the placeholders in `api/.env` with real values:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=xpola_db
DB_USER=xpola_user
DB_PASS=your_real_database_password
JWT_SECRET=generate_a_long_random_secret
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
MAIL_HOST=mail.example.com
MAIL_PORT=465
MAIL_USERNAME=noreply@example.com
MAIL_PASSWORD=your_real_mail_password
MAIL_FROM_NAME=Xpola Services
APP_URL=http://localhost:8080
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
MONERIS_STORE_ID=
MONERIS_API_TOKEN=
MONERIS_CHECKOUT_ID=
MONERIS_ENV=sandbox
CANADA_MARKET_ENABLED=0
PROJECTS_PUBLIC_ENABLED=0
```

Start the API locally from the repository root with a PHP server, for example:

```bash
php -S 0.0.0.0:8080 -t api
```

Then create the frontend `.env.local` in the repository root:

```dotenv
VITE_API_URL=http://localhost:8080/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
```

The frontend receives only the public payment key. The backend receives the matching secret payment key and performs payment verification. **Never use `PAYSTACK_SECRET_KEY` or any database/mail/JWT secret in the frontend environment.**

### Production setup

For a production frontend at `https://xpolaservices.com` and API at `https://xpolaservices.com/api`:

Frontend host variables:

```dotenv
VITE_API_URL=https://xpolaservices.com/api
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
```

Backend `api/.env` or server environment variables:

```dotenv
APP_URL=https://xpolaservices.com
FRONTEND_URL=https://xpolaservices.com
CORS_ALLOWED_ORIGINS=https://xpolaservices.com,https://www.xpolaservices.com
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
```

If the frontend and API use different domains, put the real frontend origin in `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS`, while keeping `VITE_API_URL` pointed to the complete API URL. Do not add `/api` to `FRONTEND_URL` or to an origin inside `CORS_ALLOWED_ORIGINS`.

### cPanel/FTP placement

If the frontend and backend are uploaded by FTP to the same cPanel account, the usual layout is:

```text
public_html/
├── index.html                 # from the contents of frontend dist/
├── assets/                    # from frontend dist/assets/
├── .htaccess                  # from frontend dist/.htaccess
└── api/
    ├── .env                   # real backend secrets; never commit this
    ├── .htaccess
    ├── vendor/
    └── *.php
```

The frontend `.env.local` is **not** uploaded to `public_html/`. Vite reads it on the computer that runs `npm run build`; the resulting `dist/` JavaScript already contains the public API URL and public payment key. The backend `api/.env` is different: PHP reads it on the cPanel server at runtime.

For this layout, build the frontend locally with:

```dotenv
VITE_API_URL=https://xpolaservices.com/api
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
```

Then run `npm run build` and upload the **contents** of `dist/` to `public_html/`. Upload `api/` separately to `public_html/api/`, then create/edit `public_html/api/.env` with the private backend values. The included `public/.htaccess` is copied into `dist/` during the build and keeps React routes working on Apache. The included `api/.htaccess` denies web access to `.env`, `composer.json`, and `composer.lock`, but the file must still remain private and never be committed.

If cPanel provides Terminal/SSH, install PHP dependencies inside the uploaded API directory:

```bash
cd ~/public_html/api
composer install --no-dev --optimize-autoloader
```

If Composer is unavailable, upload the repository’s existing `api/vendor/` directory by FTP. After every change to `VITE_API_URL` or a `VITE_` payment key, rebuild the frontend and upload the new `dist/` contents; changing only `api/.env` cannot change a previously built frontend.

### Future backend updates through cPanel/FTP

Use this process whenever the client receives a new backend version:

1. In cPanel, download a copy of the current `public_html/api/` folder and export the production database before uploading anything.
2. Compare the new API files with the live files and upload only the changed PHP/configuration files where possible.
3. Keep the live `public_html/api/.env` file. Never replace it with `.env.example`, and never commit the real `.env` file to GitHub.
4. If `composer.json` changed, run `composer install --no-dev --optimize-autoloader` in `public_html/api/` through cPanel Terminal. Without Terminal, generate `vendor/` on a development machine and upload the complete updated `api/vendor/` folder.
5. If the database structure changed, take another backup and run the supplied migration/SQL instructions before testing the new PHP files.
6. Test `GET /maintenance.php`, registration/login, product loading, order creation, payment verification, admin login, uploads, email, and the frontend after the update.
7. If an error occurs, turn on Admin → Maintenance, restore the previous API files and database backup, confirm the API response, and then turn maintenance off.

Do not update production by editing generated frontend JavaScript. Frontend changes must be rebuilt from the React source using the frontend procedure in the root README. Keep a short release record containing the date, changed files, database change, test result, and rollback location.

The committed `.env.example` files contain placeholders only. Real `.env`, `.env.local`, and production environment values must never be committed to GitHub, included in a ZIP, pasted into screenshots, or sent in chat.

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

## Agency support and client ownership

**Nosyra Digital** provides technical support for website fixes, maintenance, deployment through FTP/cPanel, and API troubleshooting.

- Agency email: `info@nosyradigital.com.ng`
- Agency phone/WhatsApp: `+234 705 846 6586`

The client/owner remains responsible for the domain, cPanel/hosting account, production database, backups, Paystack and future Moneris accounts, SMTP account, renewals, and final production approval. Nosyra Digital should receive only the least-privilege FTP/cPanel or API access needed for the agreed work.

When reporting a problem, send the affected URL or API endpoint, approximate time, screenshot/error message, and affected area.

### Source-release condition

The client has the built frontend `dist` files deployed on the client-controlled hosting server. The complete raw frontend source and public source files will be supplied to the client after the outstanding balance has been paid in full. The client’s control of the domain, hosting account, deployed `dist` files, and production operation is not changed by this source-release condition.

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
