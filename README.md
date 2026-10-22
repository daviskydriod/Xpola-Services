# Xpola Services — Platform Handover Guide

**Client handover documentation for the Xpola Services website, React frontend, PHP API, marketplace, and admin platform.**

## 1. What this repository contains

Xpola Services is a full web platform with two connected parts:

1. **Frontend website** — a React and TypeScript application that visitors and customers use in the browser.
2. **Backend API** — a PHP API that provides authentication, products, orders, payments, customer accounts, notifications, admin operations, and maintenance controls.

The frontend source is in [`src/`](src/). The PHP backend is in [`api/`](api/). The frontend and backend are deployed separately but work together through HTTP API requests.

The project is built with:

- React 18 and TypeScript
- Vite
- React Router
- Tailwind CSS and reusable UI components
- Firebase client configuration where required by the existing application
- PHP and MySQL/MariaDB on the backend
- Paystack for the Nigerian payment flow

## 2. Platform overview for the client

The website is designed as a **multi-country services and commerce platform**. A visitor can learn about Xpola Services, browse services by country and sector, view company information, contact the business, browse marketplace products, create an account, place an order, and manage their account after purchase.

The platform supports two audience areas:

- **Public/customer experience:** the marketing website, country pages, service pages, projects, shop, cart, checkout, account, and legal pages.
- **Staff/admin experience:** a protected dashboard for managing products, orders, customers, projects, stock notifications, restock requests, maintenance mode, communications, and operational settings.

## 3. Frontend website explanation

### 3.1 Public website structure

The public React application is routed from [`src/App.tsx`](src/App.tsx). The main public sections are:

- **Home** — company introduction, hero section, calls to action, sectors, partners, process, and featured content.
- **Services** — overview of the company’s service offering.
- **About** — company information, team, timeline, and reasons to work with Xpola Services.
- **Projects** — approved project content when the projects feature flag is enabled.
- **Contact** — customer enquiries and contact information.
- **Shop** — marketplace products, categories, filters, product details, stock status, and product variations.
- **Cart drawer** — a slide-out cart where customers can review products, adjust quantities, remove items, and continue to checkout.
- **Checkout** — protected checkout flow for authenticated customers, including delivery information, order creation, and payment initiation.
- **Account** — customer profile, saved addresses, order history, wishlist, loyalty information, referrals, notifications, and support features.
- **Legal pages** — privacy policy, terms of service, cookie policy, and email verification pages.

The core page components are stored in [`src/pages/`](src/pages/) and reusable UI/section components are stored in [`src/components/`](src/components/).

### 3.2 Country switching

The header includes a country selector for **Nigeria** and **Canada**. The selected country changes the active routes, service content, marketplace context, currency, and country-specific navigation.

Country-specific routes include:

- `/nigeria`
- `/nigeria/about`
- `/nigeria/services`
- `/nigeria/shop`
- `/nigeria/contact`
- `/nigeria/services/consulting`
- `/nigeria/services/oil-gas`
- `/nigeria/services/construction`
- `/nigeria/services/mining`
- `/nigeria/services/commerce`
- `/nigeria/services/ecommerce`
- `/nigeria/services/logistics`

Canada information and services are also available:

- `/canada`
- `/canada/about`
- `/canada/services`
- `/canada/contact`
- `/canada/services/consulting`
- `/canada/services/operations`
- `/canada/services/logistics`
- `/canada/services/trade`
- `/canada/services/community`

The country state and switching behavior are managed through [`src/contexts/CountryContext.tsx`](src/contexts/CountryContext.tsx), with country content in [`src/data/countryData.ts`](src/data/countryData.ts).

### 3.3 Current country and marketplace settings

The current frontend feature settings are in [`src/config/markets.ts`](src/config/markets.ts):

- **Nigeria marketplace:** enabled.
- **Nigeria shop and checkout:** available, subject to customer authentication and backend configuration.
- **Canada information and service pages:** available.
- **Canada marketplace and checkout:** currently disabled. Visitors who open Canada shop or checkout routes see the Canada coming-soon page instead.
- **Projects:** currently disabled publicly by the frontend feature flag. Admins can prepare project records, but public display requires the feature flag and approved project status.

To launch the Canada marketplace, the frontend flag and backend market configuration must be reviewed together after Moneris/payment setup, delivery rules, refund handling, and launch testing are complete. Do not enable only one side of the platform.

### 3.4 Navigation and customer experience

The shared navigation is implemented in [`src/components/Navbar.tsx`](src/components/Navbar.tsx). It provides:

- Country selection
- Home, services, shop, about, and contact navigation
- Light/dark theme toggle
- Cart access and item count
- Sign-in/account access
- Wishlist access for signed-in users
- Responsive mobile navigation
- A dismissible Canada visitor notice for visitors detected in Canada; it does not force a redirect

The application uses shared providers in [`src/App.tsx`](src/App.tsx) for theme, country, cart, authentication, admin state, and maintenance state. This keeps the customer experience consistent across routes.

### 3.5 Marketplace and checkout

The marketplace frontend includes:

- Product listing and category pages
- Product detail pages
- Product images and variations such as size, colour, weight, or type
- Stock and out-of-stock states
- Country-specific products and currencies
- Cart quantity controls and cart validation
- Wishlist and optional restock notifications
- Delivery fee calculation through the API
- Authenticated checkout
- Order confirmation and payment verification pages

The cart is intentionally country-aware. Customers should not mix products from different country stores in one cart. The checkout and backend validate the final order and payment state.

Nigeria orders use the Paystack flow. A browser callback is not the final proof of payment; the backend performs server-side verification before an order should be treated as paid or dispatched.

### 3.6 Customer accounts

Customers can create an account and use the account area to:

- Register, sign in, verify an email, and reset a password
- Update profile information and upload an avatar
- Add, edit, delete, and select default delivery addresses
- View orders and order status
- Manage a wishlist
- Opt in to restock notifications
- View loyalty points and tier information
- View referral information
- Read account notifications
- Open and follow up on support requests
- Sign out or delete the account

Authentication tokens are stored in browser local storage using the existing Xpola token keys. Protected pages such as account and checkout are guarded by [`src/components/ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx).

### 3.7 Maintenance mode

The public frontend checks the backend maintenance status when the application loads and refreshes it every 30 seconds. When maintenance mode is enabled:

- Public visitors see the maintenance page and configured message.
- Staff can still access `/admin` and `/admin/dashboard`.
- The admin team can enable or disable maintenance from the dashboard.

The maintenance context is implemented in [`src/contexts/MaintenanceContext.tsx`](src/contexts/MaintenanceContext.tsx), and the public page is [`src/pages/MaintenancePage.tsx`](src/pages/MaintenancePage.tsx).

## 4. Admin dashboard explanation

The admin area is separate from the public customer experience and is available at:

- `/admin` — admin login
- `/admin/dashboard` — protected admin dashboard

The dashboard is assembled in [`src/pages/admin/AdminDashboard.tsx`](src/pages/admin/AdminDashboard.tsx). It provides staff controls for:

- **Dashboard overview** — operational statistics and recent activity.
- **Products** — create and edit products, categories, images, variations, prices, stock, and featured status.
- **Orders** — review orders, payment status, customer information, delivery details, and order progress.
- **Customers** — view customer records and account-related information.
- **Projects** — create drafts, upload project imagery, set country/sector information, approve projects, and control publication.
- **Notifications** — review low-stock, out-of-stock, and pending restock-request information.
- **Restock** — review opted-in restock requests and send staff-triggered restock emails after inventory is restored.
- **Maintenance** — enable or disable public maintenance mode and edit the visitor message/estimated return time.
- **Delivery** — manage delivery zones and fees.
- **Categories and coupons** — manage catalogue categories and promotional coupons.
- **Communications and support** — manage announcement content and customer support operations.
- **Audit and activity logs** — review important staff and system actions.

Admin routes bypass the public maintenance guard so staff can recover or update the site while the public site is offline.

## 5. How the frontend connects to the backend

The frontend communicates with the PHP API using the helpers in [`src/lib/api.ts`](src/lib/api.ts) and [`src/api/index.ts`](src/api/index.ts). These helpers handle common requests for:

- Authentication and customer profiles
- Products and categories
- Cart/order creation and order history
- Delivery fees
- Paystack payment verification
- Wishlist, loyalty, referral, and notifications
- Support requests
- Projects
- Admin dashboard data and actions
- Maintenance status

The API client also includes authentication headers, admin authentication, request error handling, request timeouts/retries in the upgraded client, rate-limit handling, and token refresh behavior where supported.

The production API URL is configured through `VITE_API_URL` in the frontend environment. For the live site, use:

```text
https://xpolaservices.com/api
```

The upgraded request helper in `src/api/index.ts` supports `VITE_API_URL` and falls back to `/api`. When deploying to a different environment, confirm all frontend API imports and environment settings point to the intended API host before launch. The frontend and backend must also be configured for HTTPS, CORS, uploads, and matching authentication settings.

## 6. Frontend development and deployment

### Install dependencies

```bash
npm install
```

### Run the frontend locally

```bash
npm run dev
```

Vite will provide a local development URL, normally `http://localhost:5173`.

### Build the production frontend

```bash
npm run build
```

The production output is written to `dist/`.

### Optional type checking

The repository does not currently define a dedicated type-check script, but TypeScript can be run with:

```bash
npx tsc --noEmit
```

### Frontend deployment requirements

The frontend host must:

1. Serve the contents of the Vite `dist/` directory.
2. Support SPA fallback routing so paths such as `/nigeria/shop`, `/account`, and `/admin/dashboard` return `index.html`.
3. Use HTTPS in production.
4. Provide the correct API base URL and compatible CORS configuration.
5. Preserve uploaded image URLs and API response access.
6. Keep production secrets out of the frontend bundle. Payment verification and other sensitive operations must remain server-side.

The included [`vercel.json`](vercel.json) provides an SPA rewrite for Vercel-style hosting. Other hosts need an equivalent rewrite rule.

### Frontend `.env` setup

The frontend uses Vite environment variables. Start from the committed template:

```bash
cp .env.example .env.local
```

For local development, set the API URL to the local PHP API:

```dotenv
VITE_API_URL=http://localhost:8080/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_flutterwave_public_key
```

For production, configure these same values in the frontend host (for example, Vercel → Project Settings → Environment Variables), then redeploy:

```dotenv
VITE_API_URL=https://xpolaservices.com/api
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_flutterwave_public_key
```

Only `VITE_` values are compiled into browser JavaScript. A Paystack or Flutterwave **public** key is allowed here; database passwords, JWT secrets, Paystack secret keys, SMTP passwords, and Moneris private values must never be placed in the frontend `.env.local` file.

After changing a frontend environment variable, restart `npm run dev` or create a new production build. The frontend now uses `VITE_API_URL` for normal API requests, payment verification, and verification-email requests instead of a hardcoded API host.

### Exact cPanel/FTP upload process

Vite does **not** read `.env` files from a finished website after upload. Frontend `VITE_` values are inserted when `npm run build` creates `dist/`. If you are using FTP, use this order:

1. On your computer, create a private `.env.local` in the project root and set `VITE_API_URL` to the real API URL, for example `https://xpolaservices.com/api`, plus the public Paystack key.
2. Run `npm install` and `npm run build` on your computer. Do not upload the source `src/` folder as the live website instead of the build.
3. In cPanel File Manager or FTP, open the domain’s document root, normally `public_html/`, and upload the **contents of `dist/`** into it. The generated `dist/.htaccess` enables React route fallback on Apache/cPanel.
4. Upload the complete `api/` folder into `public_html/api/`. If the API is hosted at another subdomain or folder, change `VITE_API_URL` before rebuilding.
5. Create `public_html/api/.env` through cPanel File Manager, or upload it temporarily and confirm its permissions. Put database passwords, `JWT_SECRET`, `PAYSTACK_SECRET_KEY`, SMTP password, and other private backend values in this file. Do **not** upload the frontend `.env.local` file to `public_html/`.
6. Set `FRONTEND_URL=https://xpolaservices.com` and `CORS_ALLOWED_ORIGINS=https://xpolaservices.com,https://www.xpolaservices.com` in `api/.env`.
7. Upload `api/vendor/` as part of the API folder if Composer is not available in cPanel. If cPanel Terminal/SSH is available, run `composer install --no-dev --optimize-autoloader` inside `public_html/api/` instead.
8. In cPanel, create the MySQL database and user, then copy the exact database name, username, host, port, and password into `api/.env`.
9. Visit the frontend and test `/`, `/nigeria/shop`, `/login`, `/admin`, and `https://xpolaservices.com/api/maintenance.php`.

If the frontend was already built with the wrong API URL, editing `api/.env` alone will not fix it. Update `.env.local`, rebuild `dist/`, and upload the new `dist/` contents again.

### Client procedure for future updates

For a normal future update, keep the live site working while preparing a backup and a tested release:

1. Download a backup of the current `public_html/` files and export a database backup from cPanel before changing production.
2. Make the change in the project source code, not directly inside the generated `dist/` files or a minified JavaScript file.
3. If the change is frontend-only, update the source, keep the production `.env.local` values, run `npm run build`, and upload the new **contents of `dist/`** to `public_html/`.
4. If the change is backend-only, upload only the changed PHP/configuration files into `public_html/api/`. Do not overwrite `api/.env` with the committed `.env.example`.
5. If a dependency changed, run `composer install --no-dev --optimize-autoloader` in `public_html/api/` using cPanel Terminal, or upload the newly generated `api/vendor/` directory by FTP.
6. If a `VITE_` value changed, rebuild the frontend before uploading. If a backend secret or feature flag changed, edit `public_html/api/.env` directly in cPanel and do not put the real value into GitHub.
7. Test the home page, country switching, login, shop, cart, checkout, one API endpoint, and `/admin` after the upload. Check the browser Network tab if the frontend cannot reach the API.
8. If the release fails, enable Admin → Maintenance, restore the previous files/database backup, test again, and then disable maintenance.

For larger updates, use a staging subdomain first, such as `staging.xpolaservices.com`, with a separate database and environment values. Do not test new code against the live production database or live payment keys.

## 7. Backend/API deployment

The PHP backend is in [`api/`](api/). It connects the frontend to the database, authentication, products, orders, payments, email, admin tools, projects, notifications, and maintenance mode.

For backend deployment:

1. Upload the complete `api/` directory to the hosting provider.
2. Use PHP 8.1+ or the version approved by the hosting provider.
3. Create the production MySQL/MariaDB database and restricted database user.
4. Create a private `api/.env` file from [`api/.env.example`](api/.env.example), or configure the same variables in the hosting provider’s server environment. The backend now loads `api/.env` automatically for local PHP development; server-provided variables take precedence.
5. Install dependencies:

   ```bash
   composer install --no-dev --optimize-autoloader
   ```

6. Configure HTTPS, PHP-FPM/cPanel routing, upload permissions, and CORS for the frontend domain.
7. Configure Paystack secret keys, webhook signing, and server-to-server verification.
8. Configure SMTP if staff will send restock or support emails.
9. Keep the Canada marketplace disabled until its payment and launch testing are complete.
10. Configure daily backups and perform a restore test before launch.

The frontend and backend must point to each other:

| Side | File/setting | Example | Contains secrets? |
|---|---|---|---|
| Frontend | `.env.local` or frontend host settings | `VITE_API_URL=https://xpolaservices.com/api` | No; browser-visible values only |
| Backend | `api/.env` or server environment | `DB_PASS=...`, `JWT_SECRET=...`, `PAYSTACK_SECRET_KEY=...` | Yes; keep private |

Set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` in the backend to the exact frontend origin, without a path such as `/api`. For example, if the frontend is hosted at `https://www.xpolaservices.com`, use `FRONTEND_URL=https://www.xpolaservices.com` and include that origin in `CORS_ALLOWED_ORIGINS`.

See [`api/README.md`](api/README.md) for the detailed PHP/API deployment checklist.

## 8. Important business and release settings

- **Nigeria marketplace:** enabled for the configured Nigerian payment and delivery flow.
- **Canada information/services:** available.
- **Canada marketplace and checkout:** deliberately disabled while Moneris setup, server-side verification, refunds, delivery rules, and launch testing are pending.
- **Public projects:** require the frontend feature flag, backend configuration, and approved project records.
- **Maintenance mode:** controlled from Admin → Maintenance and surfaced by the public frontend.
- **Payment status:** Paystack payment status must be confirmed server-side before dispatch.

## 9. Security and ownership boundaries

The client/owner or hosting provider remains responsible for:

- Domain and hosting ownership, renewals, and access
- Production database, backups, restore testing, and server security
- PHP version, PHP-FPM/cPanel, Composer, HTTPS, cron jobs, and file permissions
- Paystack, SMTP, and future Moneris account credentials
- Legal review of privacy, compliance, payment, and customer-facing claims
- Final production testing and approval before launch

Never commit or share real passwords, JWT secrets, database credentials, SMTP passwords, Paystack keys, Moneris keys, or other private credentials in Git, screenshots, tickets, or chat.

## 10. Agency role and client ownership

**Nosyra Digital** is the technical agency for website fixes, maintenance, deployment support, and technical questions.

Agency support contact:

- Email: `info@nosyradigital.com.ng`
- Phone/WhatsApp: `+234 705 846 6586`

Nosyra Digital may upload approved frontend and API releases through the FTP/cPanel access provided by the owner. The agency should use least-privilege access and should not receive or store unnecessary payment, database, email, or hosting-owner credentials.

The client/owner remains responsible for domain registration, cPanel/hosting, the production database, backups, Paystack and Moneris accounts, SMTP/email, legal approval of customer-facing claims, and final approval before enabling Canada commerce or publishing projects/testimonials.

For support, the client should provide the affected page or API endpoint, approximate problem time, screenshot/error message, and whether the issue affects customers, checkout, admin, or email.

### Source-release condition

The client has the built frontend `dist` files deployed on the client-controlled hosting server. The complete raw frontend source and public source files will be supplied to the client after the outstanding balance has been paid in full. The client’s control of the domain, hosting account, deployed `dist` files, and production operation is not changed by this source-release condition.

## 11. Production sign-off checklist

Before accepting live orders, confirm:

- [ ] Frontend production build completes successfully.
- [ ] Frontend hosting has SPA fallback routing.
- [ ] Frontend API URL points to the correct production backend.
- [ ] HTTPS and CORS work between frontend and API.
- [ ] Database and environment variables are configured privately.
- [ ] Customer registration, login, email verification, and password reset work.
- [ ] Products, categories, images, variations, stock, and prices load correctly.
- [ ] Cart prevents unsupported country mixing.
- [ ] Delivery fees and address validation work.
- [ ] One successful and one failed Paystack payment have been tested.
- [ ] Server-side payment verification and webhook handling have been checked.
- [ ] Customer order history and admin order management work.
- [ ] Admin product, stock, project, restock, support, and maintenance tools work.
- [ ] Restock email delivery has been tested if SMTP is enabled.
- [ ] Maintenance mode has been enabled and disabled successfully.
- [ ] Canada marketplace remains disabled until formally approved.
- [ ] Daily backups and a restore test are documented.
- [ ] Domain owner, hosting owner, renewal dates, and support contacts are recorded.

## 12. Related documentation

- [Backend/API handover guide](api/README.md)
- [Backend API contract](docs/BACKEND-API-HANDOVER-CONTRACT.md)
- [General fixes and release notes](docs/GENERAL-FIXES-AND-RELEASE-NOTES.md)
- [Brand and website guide](docs/Xpola-Services-Brand-and-Website-Guide-revised.md)
- [Feedback resolution report](docs/Xpola-feedback-resolution-report.md)
