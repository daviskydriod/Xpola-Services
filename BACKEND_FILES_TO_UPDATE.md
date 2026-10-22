# Xpola Services backend files to update

The current repository contains the React/Vite frontend. The live PHP API is hosted separately, so these changes need to be applied to the deployed API codebase.

## Required payment/status files

1. `api/orders.php`
   - Keep an order in a pre-payment state while checkout is open.
   - Set both `status = 'failed'` and `payment_status = 'failed'` when Paystack returns a declined, abandoned, cancelled, or otherwise unsuccessful result.
   - Set `payment_status = 'paid'` and move the order to `paid`/`processing` when Paystack verification or the webhook confirms payment.
   - Make the update idempotent using the Paystack reference and `order_id`.
   - Record the status transition in the activity/audit log.

2. `api/payments/paystack_verify.php` (the path used by the frontend)
   - Verify the reference server-to-server.
   - Update the matching order's `payment_status` and `status` in the same transaction.
   - Return the updated `order_ref`, `status`, and `payment_status`.

3. Paystack webhook handler, if separate (for example `api/payments/paystack_webhook.php`)
   - Apply the same success/failure mapping as `orders.php`.
   - Do not mark an order as paid from a client callback alone.

4. `api/admin/orders.php`
   - Return `status` and `payment_status` for every order.
   - Normalize legacy rows where `payment_status` is failed/declined/cancelled or paid/captured but `status` is still `pending`.
   - Support filtering by `failed` and `paid`.

5. Database migration/schema file
   - Confirm `orders.status` accepts `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, and `failed`.
   - Confirm `orders.payment_status` exists and is indexed if the admin list filters by it.
   - Do not delete existing orders during migration.

## Required unified activity/audit files

6. `api/activity.php` (new endpoint)
   - Authenticated `POST` endpoint for user activity.
   - Derive the actor from the bearer token; never trust actor identity from the browser payload.
   - Store: `actor_type`, `actor_id`, `actor_name`, `actor_email`, `action`, `target`, `details`, `ip_address`, and `created_at`.
   - Accept events such as `REGISTER`, `LOGIN`, `UPDATE_PROFILE`, `DELETE_ADDRESS`, `ADD_WISHLIST`, and `REMOVE_WISHLIST`.

7. `api/admin/audit_helper.php`
   - Extend the existing admin logger so admin actions write the same actor fields with `actor_type = 'admin'`.
   - Keep audit failures non-blocking for the original business request.

8. `api/admin/audit.php`
   - Add `scope=all` support to return admin, user, and system activity.
   - Add actor filtering (`actor=`) and retain admin filtering for compatibility.
   - Return consistent camelCase or snake_case fields; the frontend currently normalizes both.
   - Enforce admin authorization and paginate the result.

9. `api/auth.php`
   - Log registration, login success/failure, password reset, password change, profile update, and account deletion using the unified activity logger.

10. User-action endpoints
    - Add server-side activity logging to wishlist, support, address, and order endpoints. Browser activity calls are useful for coverage, but server-side logging is authoritative.

## Audit table fields

Add these fields to `audit_logs` (or create a separate `activity_logs` table with the same shape):

- `actor_type VARCHAR(20) NOT NULL DEFAULT 'system'`
- `actor_id VARCHAR(64) NULL`
- `actor_name VARCHAR(190) NULL`
- `actor_email VARCHAR(255) NULL`
- `action VARCHAR(100) NOT NULL`
- `target VARCHAR(255) NULL`
- `details TEXT NULL`
- `ip_address VARCHAR(45) NULL`
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

The frontend now sends user activity to `/activity.php` and asks the admin feed for `/admin/audit.php?scope=all`. These endpoints and migrations must exist on the deployed PHP API for the activity records to persist.
