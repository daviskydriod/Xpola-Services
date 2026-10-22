# Xpola Services — Internal Implementation Guide

**Purpose:** Internal handover and verification guide  
**Baseline:** `XpolanigeriaPageReviewv1.pdf`  
**Project:** Xpola Services complete final archive  
**Updated:** 11 October 2026

## 1. Scope

This guide records what was checked in the original Nigeria shop review and where the updated implementation lives. It also records the later client requests: staff-owned catalogue management, sample-product notices, newsletter subscriber management, a CSV export, an in-page product form, and a built-in rich-text description editor.

The source archive is a React/Vite frontend with a PHP API. The public shop and private staff area are separate concerns. The private route and API folder still use the historical word `admin` for compatibility, but the visible product-management experience is the **Staff Portal**.

## 2. Original 16-point review verification

| # | Requirement from the PDF | Current implementation | Verification |
|---:|---|---|---|
| 1 | Slim location bar, remembered dismissal, labelled close | `Navbar.tsx` uses a slim location bar, stores dismissal, and exposes a labelled Close button. | Open a mobile viewport, dismiss the message, refresh, and inspect the close label. |
| 2 | Prevent duplicate categories | The admin categories endpoint checks duplicate names/slugs and returns a conflict response. | Try creating or renaming a category to an existing category. |
| 3 | Hide empty categories and show counts | The categories API filters to categories with in-stock products and returns `product_count`; the shop renders the counts and filtered total. | Compare All Categories with a category filter and confirm empty categories do not show. |
| 4 | Correct product names and category assignment | The product response includes normalised Nigeria names and the database migration persists the intended mapping. | Review `api/migrations/20261011_nigeria_catalog_cleanup.sql`, then run once after checking production category IDs. |
| 5 | Readable Sort By control | The shop select uses dark readable text and a clear select affordance. | Test the control in mobile and desktop layouts. |
| 6 | Hero, mobile height, filters, stock | Local hero assets are used, the mobile height is shorter, filters collapse on small screens, and Add to Cart respects stock. | Test at phone width and try an out-of-stock item. |
| 7 | SVG flags | `public/flags/ng.svg` and `public/flags/ca.svg` are used instead of relying on platform emoji rendering. | Test on Windows/Android and confirm the flags are images. |
| 8 | Product information and Add to Cart | Product cards and detail pages support images, summary, description, specifications, warranty, brand, stock, and Add to Cart. | Open a product card, quick view, detail page, and cart. |
| 9 | Delivery and payment information | Product shipping information and payment messaging appear before checkout; delivery fee is selected later. | Enter a delivery area and inspect the final order review. |
| 10 | Search and share visibility | SEO generation creates server-visible shop/product entry pages with titles, descriptions, canonicals, and Product schema. | Run `npm run build:seo` on a deployment-capable environment and inspect generated entry pages. |
| 11 | Newsletter sign-up feedback and notification | `api/newsletter.php` stores sign-ups, attempts subscriber confirmation, attempts staff notification, and the footer reports success/error. | Verify SMTP settings on the deployment host and submit a test address. |
| 12 | Quick preview | `src/components/shop/ProductCard.tsx` provides Quick view on desktop and mobile, including image, summary, stock, and Add to Cart. | Test hover/tap equivalent at desktop and phone widths. |
| 13 | Rich product editing | The active editor is in `src/pages/admin/AdminProducts.tsx`. `RichTextEditor` is built in-page and supports formatting without an external editor plugin. | Open Staff Dashboard → Products → Add Product/Edit. Confirm the editor is inside the page, not a pop-up. |
| 14 | Guest checkout | Checkout accepts guest details and the API keeps guest order ownership using the checkout token. | Place a test order without signing in. |
| 15 | Cart survives account transition | The browser cart key remains available through authentication/account creation. | Add items, move through account creation, and confirm the items remain. |
| 16 | Delivery fee only at final review | The API resolves delivery fee after delivery details and the checkout presents it as its own final line. | Confirm no delivery fee is added while browsing; confirm it appears before payment. |

## 3. Staff catalogue implementation

### 3.1 Visible staff language

Updated files:

- `src/pages/admin/AdminLogin.tsx` — Staff Portal wording.
- `src/pages/admin/AdminDashboard.tsx` — Xpola Staff branding and Newsletter navigation.
- `src/pages/admin/AdminProducts.tsx` — sample-product notice and staff instructions.
- `src/pages/Shop.tsx` — public sample-catalogue notice.

The API still uses `/api/admin/*` because changing the paths would create an unnecessary deployment compatibility risk. This is an internal naming detail, not an owner responsibility.

### 3.2 Product form is an in-page screen

The active `AdminProducts` component keeps the product list and editing state in the same dashboard view. When `editing` is set, it returns `ProductModal` as a normal page section rather than a fixed overlay. The editor has a **Back to Products** button and the product list is hidden while editing.

Verify that:

1. Add Product opens the full page form.
2. Edit opens the full page form.
3. Back to Products returns to the list.
4. Delete confirmation remains the only confirmation overlay.
5. Saving refreshes the product list.

### 3.3 Built-in rich-text editor

`RichTextEditor` in `src/pages/admin/AdminProducts.tsx` is deliberately in-page and has no third-party editor dependency. It uses the browser editing surface and includes:

- Bold and italic.
- Paragraph, heading, and small-heading styles.
- Bulleted and numbered lists.
- Link insertion.
- Image URL insertion.
- Live editing within the product form.

The API already limits stored description HTML to the allowed tags in `api/admin/products.php`. Verify saved output on `src/pages/ProductDetail.tsx` and test links/images with safe URLs before production use.

## 4. Newsletter subscriber implementation

### 4.1 Public subscription

`api/newsletter.php` creates or updates `newsletter_subscribers`, stores the email and country, sends the configured subscriber email, attempts a staff notification, and returns a success response. `src/components/Footer.tsx` displays the form result.

### 4.2 Staff list and CSV export

New files:

- `api/admin/newsletter.php` — authenticated list endpoint and CSV export endpoint.
- `src/pages/admin/AdminNewsletter.tsx` — list, refresh, and export UI.

Updated file:

- `src/pages/admin/AdminDashboard.tsx` — Newsletter menu item and view.

The list endpoint returns email, country, confirmation status, and subscription date. The export endpoint returns a CSV with the same fields and records `EXPORT_NEWSLETTER_SUBSCRIBERS` in the audit log.

Deployment checks:

1. Confirm the `newsletter_subscribers` table can be created or already exists.
2. Confirm an authorised staff token is required.
3. Test an empty list and a list with multiple rows.
4. Open the CSV in Excel/Sheets and verify the header and values.
5. Confirm subscriber data is handled as confidential information.

## 5. Catalogue status control

The public sample-catalogue notice is backed by a persisted setting so the site can clearly distinguish demonstration data from an approved production catalogue.

### Implementation

- `api/catalogue-status.php` exposes a public read-only `GET` endpoint. It safely defaults to `sample` when no setting exists.
- `api/admin/settings.php` creates or uses the `site_settings` table and persists `catalogue_mode`. Only `sample` and `live` are accepted.
- `src/lib/api.ts` provides the catalogue status and settings API methods.
- `src/pages/Shop.tsx` shows the sample notice only when the API reports `sample`.
- `src/pages/admin/AdminDashboard.tsx` exposes **Settings → Catalogue Status** to super-admin users.

### Operational procedure

1. Keep the mode set to **Sample Catalogue** while the products are demonstration data.
2. Confirm the approved production catalogue has been loaded and reviewed.
3. Back up the database.
4. From the Staff Portal, open **Settings → Catalogue Status** and choose **Live Catalogue**.
5. Verify the public shop, product pages, cart, checkout, and staff product workflow.
6. Return to **Sample Catalogue** if the approved catalogue is withdrawn or the site needs to return to demonstration mode.

The owner/super-admin retains control of this decision. Authorised staff operate the routine catalogue workflow, but should not switch to Live Catalogue without the owner’s approval.

## 6. Required deployment checks

Before production deployment:

1. Back up the current frontend, API, and database.
2. Preserve the live API `.env`; never replace it with example values.
3. Run PHP syntax checks on the deployment host, especially `api/admin/newsletter.php` and changed API files.
4. Run the Nigeria catalogue migration once after reviewing category IDs.
5. Confirm SMTP settings for newsletter confirmation and staff notification.
6. Test public Nigeria shop, filters, product detail, cart, checkout, payment verification, and delivery fee.
7. Test Staff Portal login, product add/edit/delete, category controls, rich-text description saving, newsletter list, and CSV export.
8. Test at phone width and desktop width.
9. Keep sample products until the owner supplies and approves the final catalogue.
10. Replace sample products only after receiving the approved names, categories, photos, prices, stock, and descriptions.

## 7. Validation completed in the sandbox

- `npm ci` completed successfully.
- `npm run build` completed successfully after the latest product-editor changes.
- The final project ZIP passed `unzip -t` integrity verification.
- PHP CLI is not installed in the sandbox, so PHP lint remains a deployment-host check.
- The Vite build reports a non-blocking large-chunk warning. This does not prevent deployment but can be addressed later through code splitting.

## 8. Known boundaries

- The owner’s final product catalogue has not been supplied; current products are samples.
- Production SMTP, database, payment, and hosting settings must be verified on the deployment host.
- The frontend build passing does not replace live API, payment, email, and database testing.
- The CSV export contains personal contact data and must not be shared publicly.


## 9. Product card, detail route, and prerender follow-up

### Source changes

- `src/components/shop/ProductCard.tsx` now prefers the product summary, falls back to the description, limits the visible card text to 112 characters, and applies a guaranteed two-line CSS clamp. It uses an equal-height card layout, consistent image ratio, responsive price/stock/CTA area, and clear **View details** links on the image, product name, and quick-view panel.
- `src/lib/productRoutes.ts` centralises product slug generation and the public detail URL.
- `src/pages/ProductDetail.tsx` now initializes state before using it for page metadata. It accepts both numeric ID routes and the public Nigeria slug routes. For a slug, it finds the matching Nigeria catalogue item and then loads the full record by ID, including images and variations.
- `src/pages/Shop.tsx` and `src/components/shop/ProductGrid.tsx` use a balanced one/two/three-column responsive grid instead of leaving an empty fourth column for the current three products.
- `api/products.php` in this package is byte-for-byte the corrected file supplied by the owner. It fetches the selected rows before returning the JSON response (`$rows = $stmt->fetchAll();`).
- `scripts/generate-seo-pages.mjs` writes visible, readable fallback HTML into every generated route, plus page title, description, robots directive, canonical URL, Open Graph tags, and Product JSON-LD on the three product pages. The Nigeria shop fallback includes direct links to the matching three product-detail routes.
- The generated `sitemap.xml` continues to contain 24 entry URLs, and `robots.txt` allows crawling and references the sitemap.

### Build and verification completed

Run from the project root:

```sh
npm ci
npm run build:prerender
npx tsc --noEmit
```

The frontend production build completed. TypeScript checking completed. A post-build check confirmed that all 24 sitemap URLs have generated HTML with an H1, page description, and canonical URL; the shop page has links to all three product detail pages; and robots.txt points to the sitemap. `unzip -t` passed on the owner-supplied source archive before editing.

The PHP CLI is not installed in the build sandbox, so `php -l` could not be run here. The PHP file was copied unchanged from the owner's upload; run `php -l api/products.php` on a PHP-enabled environment if an additional syntax check is required.

### FTP deployment

1. Back up the current website files and API file.
2. Extract the **frontend FTP update ZIP** into the website root using the ZIP's contents (not an extra `dist` folder level). This replaces the frontend assets and generated route folders.
3. Upload the included `api/products.php` to `public_html/api/products.php`. Keep the live `.env` and all other server configuration files unchanged.
4. No new database migration is included for this follow-up.
5. After upload, check `/nigeria/shop`, `/nigeria/shop/iphone-18-pro-max`, `/nigeria/shop/10-inch-bolts`, and `/nigeria/shop/ecoflow-solar-generator`. Confirm that each product link opens its own page and that each generated page source contains its title, description, canonical URL, and visible fallback content.
6. Recheck `/sitemap.xml` (24 entries) and `/robots.txt` (sitemap reference).

The live website has not been changed by this sandbox build; the FTP upload is still required to publish the prepared files.


### 9.1 Marketplace card presentation

The card ordering follows a familiar marketplace scan pattern: product image, category label, two-line item name, prominent current price, rating/review count, a short (maximum 92-character) plain-text summary, stock indicator, then the primary Add to Cart action and a separate product-detail link. The image, item name, and detail link all navigate to the matching product page. Xpola's red identity is retained; no original/discount price is invented because the current product API does not provide one.


**Visual reference reviewed:** [Jumia Nigeria Smartphones catalogue](https://www.jumia.com.ng/smartphones/) (accessed 11 October 2026). The Xpola card keeps its own red brand styling and uses only the fields available in its catalogue; no Jumia assets or discount claims are copied.


### 9.2 Mobile navigation spacing

`src/components/Navbar.tsx` keeps the compact flag-and-chevron market switch visible in the mobile top bar, hides the theme toggle below the `lg` breakpoint, and removes the redundant market row from the expanded mobile menu. The header uses a shorter mobile height, with accessible market-switch label and expanded state.


### 9.3 Product image fit

Product cards already use `object-contain`. Quick-view images, the product-detail main gallery, and thumbnails now also use `object-contain` on a neutral background with modest padding, so the entire product photo is visible instead of being cropped to fill the frame.


## 10. Product stock limits and shop hero follow-up

### Inventory model

- `products.stock_qty` is a nullable product-level remaining count. `NULL` preserves legacy behavior for items whose inventory count has not been entered; a finite value is a hard customer limit, and `0` is unavailable.
- The public endpoint (`api/products.php`) exposes that count and reports zero-quantity products as out of stock. It adds the new nullable column when needed.
- Staff set the count in `src/pages/admin/AdminProducts.tsx` → Products → edit product → Pricing → **Available Quantity**. Existing counts are intentionally not guessed; the current product catalogue needs real counts entered to activate the gate.
- `src/lib/inventory.ts`, `src/contexts/CartContext.tsx`, `src/components/shop/ProductCard.tsx`, `src/components/CartDrawer.tsx`, and `src/pages/ProductDetail.tsx` share the same quantity-limit behavior. The product detail stepper and cart plus button stop at the remaining available count, and blocked attempts show a message.
- `api/orders.php` validates and locks product rows in a transaction, decrements finite counts when creating a pending order, and marks which order lines were reserved. A cancelled unpaid order restores only those reserved units. Successful payment commits the reservation; payment retries keep it reserved.
- The order API adds `orders.inventory_reserved` automatically. Both API changes preserve existing rows by adding nullable/defaulted fields only.

### Hero images

- `src/pages/Shop.tsx` imports local files from `src/assets/shop-hero-containers.jpg`, `shop-hero-warehouse.jpg`, and `shop-hero-port.jpg` for the Nigeria and Canada shop carousels.
- The previous Nigeria paths pointed at `/assets/...` files that were stored under `src/assets` and therefore were not copied to those public URLs. Bundler imports correct the paths and give each image a fingerprinted production URL.
- The source notes and Unsplash search references are recorded in `docs/unsplash-shop-hero-images.md`. The local JPEGs are resized proportionally and optimized; the source images were not cropped during optimization.

### Release and operational checks

1. Upload the contents of the frontend FTP ZIP to the site document root.
2. Upload `api/products.php`, `api/admin/products.php`, and `api/orders.php` from the backend PHP ZIP to their matching live paths. Preserve `.env`, database credentials, and Paystack configuration.
3. Confirm the database user can run the existing `ALTER TABLE` migrations. The first API request creates `products.stock_qty` and `orders.inventory_reserved` if missing.
4. In Staff Portal, enter the real available quantity for each product that needs a cap. Blank means untracked; it is not treated as a guessed stock count.
5. In staging, set a product to 2, verify a customer can add two but the next add/plus action is disabled, create an unpaid order and confirm stock is reserved, cancel it and confirm stock is restored, then complete a test payment using the existing payment test procedure and confirm stock stays reduced.
6. Verify the Nigeria and Canada hero carousels display all local photos at desktop and mobile widths.

### Validation completed for this release

- `npm run build:prerender` completed; all 24 SEO entry pages were regenerated.
- `npx tsc --noEmit` completed successfully after the frontend changes.
- `php -l` passed for `api/products.php`, `api/admin/products.php`, and `api/orders.php` using PHP 8.3 CLI.
- The Vite build still reports its pre-existing non-blocking large JavaScript chunk warning.
- This is a prepared release, not a live deployment. The owner still needs to upload the frontend and PHP packages and enter actual inventory counts for items that need quantity limits.
