# Xpola Services — Platform Handover Guide

**Client handover documentation for the Xpola Services website, React frontend, PHP API, marketplace, and admin platform.**

Repository: [https://github.com/daviskydriod/Xpola-Services](https://github.com/daviskydriod/Xpola-Services)

## 1. What this repository contains

Xpola Services is a full web platform with two connected parts:

1. **Frontend website** — a React and TypeScript application that visitors and customers use in the browser.

1. **Backend API** — a PHP API that provides authentication, products, orders, payments, customer accounts, notifications, admin operations, and maintenance controls.

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

The main production API URL currently used by the existing feature modules is defined in `src/lib/api.ts` as:

```
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

1. Support SPA fallback routing so paths such as `/nigeria/shop`, `/account`, and `/admin/dashboard` return `index.html`.

1. Use HTTPS in production.

1. Provide the correct API base URL and compatible CORS configuration.

1. Preserve uploaded image URLs and API response access.

1. Keep production secrets out of the frontend bundle. Payment verification and other sensitive operations must remain server-side.

The included [`vercel.json`](vercel.json) provides an SPA rewrite for Vercel-style hosting. Other hosts need an equivalent rewrite rule.

## 7. Backend/API deployment

The PHP backend is in [`api/`](api/). It connects the frontend to the database, authentication, products, orders, payments, email, admin tools, projects, notifications, and maintenance mode.

For backend deployment:

1. Upload the complete `api/` directory to the hosting provider.

1. Use PHP 8.1+ or the version approved by the hosting provider.

1. Create the production MySQL/MariaDB database and restricted database user.

1. Configure the values listed in [`api/.env.example`](api/.env.example) outside public Git history.

1. Install dependencies:

   ```bash
   composer install --no-dev --optimize-autoloader
   ```

1. Configure HTTPS, PHP-FPM/cPanel routing, upload permissions, and CORS for the frontend domain.

1. Configure Paystack secret keys, webhook signing, and server-to-server verification.

1. Configure SMTP if staff will send restock or support emails.

1. Keep the Canada marketplace disabled until its payment and launch testing are complete.

1. Configure daily backups and perform a restore test before launch.

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

## 10. Production sign-off checklist

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

## 11. Related documentation

- [Backend/API handover guide](api/README.md)

- [Backend API contract](docs/BACKEND-API-HANDOVER-CONTRACT.md)

- [General fixes and release notes](docs/GENERAL-FIXES-AND-RELEASE-NOTES.md)

- [Brand and website guide](docs/Xpola-Services-Brand-and-Website-Guide-revised.md)

- [Feedback resolution report](docs/Xpola-feedback-resolution-report.md)
