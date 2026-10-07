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
