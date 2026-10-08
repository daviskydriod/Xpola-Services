# Xpola PHP API

This API is deployed separately from the React frontend. Configure the variables in `.env.example` in the hosting environment; **do not commit real credentials**.

## Market state

`CANADA_MARKET_ENABLED=0` is the required default while Moneris setup and launch testing are pending. Canadian information, services, and enquiry routes remain available in the frontend, but Canadian product/category/delivery commerce and Moneris checkout return an unavailable response.

## Deployment

1. Install dependencies with `composer install --no-dev --optimize-autoloader`.
2. Set the environment variables from `.env.example` in cPanel/PHP-FPM.
3. Point the frontend API base URL to this `/api` directory.
4. Configure Paystack webhook signing and server-side verification.
5. Test order idempotency, payment verification, failed payments, date filters, coupon normalization, and the Canada-off guard before launch.

## Staff-managed restock alerts

Customers can opt into a restock request from their wishlist. Admins use `GET /admin/restock.php` to review opted-in customers. After the product is marked `in_stock`, an admin can `POST /admin/restock.php?action=send` with `{ "wishlistId": 123 }`. The endpoint sends the email using the configured SMTP environment variables, records the alert in `restock_alerts`, writes an audit entry, and clears the opt-in to prevent duplicate sends. `action=dismiss` clears a request without sending mail.

This is deliberately a staff-managed workflow; no automatic background worker is promised.


## Admin stock notifications

`GET /admin/notifications.php` requires an admin Bearer token and returns `data.lowStock`, `data.outOfStock`, `data.restockRequests`, and `data.total`. Low stock means a product with one or more variations whose combined `stock_qty` is 1–5. Explicitly `out_of_stock` products are returned separately. This endpoint is read-only and dashboard-only; it does not send email.
