# Xpola Services — Stock Limit and Shop Hero Update

**Prepared for FTP upload; not yet published to the live website.**

## Files to upload

1. Back up the live website files and these API files first.
2. Upload the **contents** of the frontend FTP ZIP to the website document root (normally `public_html/`). Do not add an extra `dist/` folder level. This includes the updated shop pages and the locally bundled Unsplash hero images.
3. From the backend PHP FTP ZIP, upload these files to their matching paths:
   - `api/products.php` → `public_html/api/products.php`
   - `api/admin/products.php` → `public_html/api/admin/products.php`
   - `api/orders.php` → `public_html/api/orders.php`
4. Keep the live `.env`, database credentials, Paystack configuration, and all unrelated API files unchanged.

## Stock setup

The APIs add `products.stock_qty` and `orders.inventory_reserved` automatically when first used. No manual SQL is required if the database account already has permission to alter the application tables.

For each product that needs a purchase cap, open **Staff Portal → Products → Edit → Pricing → Available Quantity** and enter the real available units. A blank value preserves legacy, untracked inventory; do not leave it blank if that product must have a hard quantity limit. Customers can add no more than the remaining amount. Pending unpaid checkouts reserve tracked units; cancelling the unpaid order returns them, while confirmed payments keep stock deducted.

## After upload

- Open `/nigeria/shop/` and `/canada/shop/` and confirm the hero images appear on desktop and mobile.
- Set a test/staging product to 2 units. Verify cards/details/cart stop additions at 2 and that a third add is blocked.
- In staging, verify a pending checkout reserves stock and cancelling it restores the count. Use the existing payment test procedure to confirm a paid order leaves the reduced stock count.
- Recheck product detail routes, the cart, checkout, and the Staff Portal product list.

Do not use a live payment as a test. The deployment itself and actual product count entry remain the site owner's steps.
