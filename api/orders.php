<?php
/**
 * FILE PATH: api/orders.php
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/auth.php';
require_once __DIR__ . '/admin/audit_helper.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

function requireMail(): void {
    static $loaded = false;
    if (!$loaded) { require_once __DIR__ . '/config/mail.php'; $loaded = true; }
}

// ── Logo / app URL (same as auth.php) ────────────────────────────────────────
if (!defined('XPOLA_LOGO_URL')) define('XPOLA_LOGO_URL', 'https://xpolaservices.com/assets/logo-black-BzW0SzNp.png');
if (!defined('XPOLA_APP_URL'))  define('XPOLA_APP_URL',  'https://xpolaservices.com');

// ── Shared email template with Xpola logo ────────────────────────────────────
function xpolaEmailTemplate(string $title, string $bodyHtml): string {
    $logo   = XPOLA_LOGO_URL;
    $appUrl = XPOLA_APP_URL;
    return "<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width,initial-scale=1'>
  <title>{$title}</title>
</head>
<body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f5f5;padding:32px 16px;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>

        <!-- Header with logo -->
        <tr>
          <td style='background:#ffffff;padding:28px 40px 20px;border-bottom:3px solid #E02020;text-align:center;'>
            <a href='{$appUrl}' style='display:inline-block;'>
              <img src='{$logo}' alt='Xpola Services' width='160' height='auto'
                   style='display:block;margin:0 auto;max-height:52px;object-fit:contain;' />
            </a>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style='padding:36px 40px 28px;color:#222222;font-size:15px;line-height:1.7;'>
            <h2 style='margin:0 0 20px;font-size:22px;font-weight:700;color:#1a1a2e;'>{$title}</h2>
            {$bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style='background:#f9f9f9;padding:20px 40px;border-top:1px solid #eeeeee;text-align:center;'>
            <p style='margin:0 0 6px;font-size:12px;color:#999999;'>
              &copy; " . date('Y') . " Xpola Services &middot; <a href='{$appUrl}' style='color:#E02020;text-decoration:none;'>xpolaservices.com</a>
            </p>
            <p style='margin:0;font-size:11px;color:#bbbbbb;'>
              This email was sent because you placed an order with Xpola Services.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>";
}

// ── CTA button helper ─────────────────────────────────────────────────────────
function ctaButton(string $url, string $label, string $color = '#E02020'): string {
    return "<p style='text-align:center;margin:32px 0;'>
      <a href='{$url}' style='background:{$color};color:#ffffff;padding:14px 36px;border-radius:8px;
         text-decoration:none;font-size:15px;font-weight:700;display:inline-block;letter-spacing:0.3px;'>
        {$label}
      </a>
    </p>
    <p style='text-align:center;color:#888888;font-size:12px;margin-top:-16px;'>
      Or copy this link: <a href='{$url}' style='color:#E02020;word-break:break-all;'>{$url}</a>
    </p>";
}

$db     = getDB();
try { $db->exec("ALTER TABLE products ADD COLUMN stock_qty INT NULL DEFAULT NULL"); } catch (Throwable $ignored) {}
try { $db->exec('UPDATE products SET stock_qty=0 WHERE stock_qty IS NULL'); } catch (Throwable $ignored) {}
try { $db->exec("ALTER TABLE orders ADD COLUMN guest_token VARCHAR(128) DEFAULT NULL"); } catch (Throwable $ignored) {}
$method = $_SERVER['REQUEST_METHOD'];

$db->exec("CREATE TABLE IF NOT EXISTS orders (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    order_ref        VARCHAR(32)   NOT NULL UNIQUE,
    uid              VARCHAR(64)   NOT NULL,
    customer_name    VARCHAR(200)  NOT NULL DEFAULT '',
    customer_email   VARCHAR(200)  NOT NULL DEFAULT '',
    customer_phone   VARCHAR(25)   NOT NULL DEFAULT '',
    delivery_address VARCHAR(500)  NOT NULL DEFAULT '',
    delivery_city    VARCHAR(100)  NOT NULL DEFAULT '',
    delivery_state   VARCHAR(100)  NOT NULL DEFAULT '',
    delivery_area    VARCHAR(100)  NOT NULL DEFAULT '',
    delivery_fee     DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal         DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency         VARCHAR(5)    NOT NULL DEFAULT 'NGN',
    country          VARCHAR(5)    NOT NULL DEFAULT 'NG',
    payment_ref      VARCHAR(200)  NOT NULL DEFAULT '',
    payment_status   ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending',
    payment_gateway  VARCHAR(20)   NOT NULL DEFAULT 'paystack',
    status           ENUM('pending','paid','processing','shipped','delivered','cancelled','failed') NOT NULL DEFAULT 'pending',
    items_json       LONGTEXT,
    inventory_reserved TINYINT(1) NOT NULL DEFAULT 0,
    discount_code    VARCHAR(50)   DEFAULT NULL,
    discount_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
    idempotency_key  VARCHAR(100)  DEFAULT NULL,
    guest_token      VARCHAR(128)  DEFAULT NULL,
    tracking_number  VARCHAR(100)  DEFAULT NULL,
    notes            TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uid (uid), INDEX idx_ref (order_ref), INDEX idx_idem (idempotency_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
try { $db->exec("ALTER TABLE orders MODIFY status ENUM('pending','paid','processing','shipped','delivered','cancelled','failed') NOT NULL DEFAULT 'pending'"); } catch (Throwable $e) { error_log('[Xpola Orders] status migration: ' . $e->getMessage()); }
try { $db->exec("ALTER TABLE orders ADD COLUMN inventory_reserved TINYINT(1) NOT NULL DEFAULT 0"); } catch (Throwable $ignored) {}

// Optional server-only Paystack config. This file must never be committed or
// served to the browser; it may define PAYSTACK_SECRET_KEY or PAYSTACK_SECRET.
$paystackConfig = __DIR__ . '/config/paystack.php';
if (is_file($paystackConfig)) require_once $paystackConfig;

// ── Verify payment with Paystack ──────────────────────────────────────────────
function verifyPaystackPayment(string $reference): ?array {
    // Prefer the server environment, while supporting deployments that define
    // the existing secret in a PHP config constant. Never expose this secret
    // in frontend code or commit it to the repository.
    $secret = getenv('PAYSTACK_SECRET_KEY')
        ?: (defined('PAYSTACK_SECRET_KEY') ? PAYSTACK_SECRET_KEY : '')
        ?: (defined('PAYSTACK_SECRET') ? PAYSTACK_SECRET : '');
    if (!$secret) { error_log('[Xpola] PAYSTACK_SECRET_KEY is not configured'); return null; }
    $ch = curl_init("https://api.paystack.co/transaction/verify/" . urlencode($reference));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ["Authorization: Bearer $secret"],
        CURLOPT_TIMEOUT        => 20,
    ]);
    $resp = curl_exec($ch);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($err || !$resp) { error_log('[Xpola] Paystack verify cURL error: ' . $err); return null; }
    $data = json_decode($resp, true);
    if (!($data['status'] ?? false)) return null;
    return $data['data'] ?? null;
}

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $bearer = getBearerToken();
    $guestToken = trim((string)($_GET['guest_token'] ?? ''));
    $jwt = $bearer ? requireAuth() : null;
    if ($jwt) { $uid = $jwt['uid']; }
    elseif ($guestToken && preg_match('/^[a-f0-9-]{16,128}$/i', $guestToken)) { $uid = 'guest_' . substr(hash('sha256', $guestToken), 0, 58); }
    else { jsonError('Unauthorized — sign in or provide a guest order token', 401); }

    // Validate discount
    if (!empty($_GET['action']) && $_GET['action'] === 'validate_discount') {
        $code     = strtoupper(trim($_GET['code'] ?? ''));
        $subtotal = (float)($_GET['subtotal'] ?? 0);
        if (!$code) jsonError('Code required');
        $stmt = $db->prepare("SELECT * FROM coupons WHERE code=? AND is_active=1 LIMIT 1");
        $stmt->execute([$code]);
        $c = $stmt->fetch();
        if (!$c) jsonError('Invalid or expired discount code', 404);
        if ($c['expires_at'] && strtotime($c['expires_at']) < time()) jsonError('Code has expired', 404);
        if ($c['max_uses'] && $c['used_count'] >= $c['max_uses']) jsonError('Code usage limit reached', 404);
        if ($c['min_order'] && $subtotal < $c['min_order']) jsonError('Minimum order ₦' . number_format($c['min_order']) . ' required', 400);
        if (!empty($c['max_uses_per_user'])) {
            $used = $db->prepare("SELECT COUNT(*) FROM orders WHERE uid=? AND discount_code=? AND payment_status='paid'");
            $used->execute([$uid, $code]);
            if ((int)$used->fetchColumn() >= (int)$c['max_uses_per_user']) jsonError('You have already used this code');
        }
        $discount = $c['type'] === 'percentage' ? round($subtotal * $c['value'] / 100, 2) : (float)$c['value'];
        $discount = min($discount, $subtotal);
        json(['valid' => true, 'code' => $code, 'type' => $c['type'], 'value' => (float)$c['value'], 'discount' => $discount]);
    }

    // Single order by ref
    if (!empty($_GET['ref'])) {
        $stmt = $db->prepare("SELECT * FROM orders WHERE order_ref=? AND uid=? LIMIT 1");
        $stmt->execute([trim($_GET['ref']), $uid]);
        $o = $stmt->fetch();
        if (!$o) { http_response_code(404); echo json_encode(['error' => 'Order not found']); exit; }
        $o['items'] = json_decode($o['items_json'] ?? '[]', true);
        $o['total'] = (float)$o['total_amount'];
        unset($o['items_json']);
        echo json_encode(['success' => true, 'data' => $o]); exit;
    }

    // All orders for user
    $stmt = $db->prepare("SELECT id,order_ref,customer_name,customer_email,customer_phone,delivery_address,delivery_city,delivery_state,delivery_area,subtotal,delivery_fee,discount_amount,discount_code,total_amount AS total,currency,country,payment_gateway,payment_status,payment_ref,status,created_at,items_json,tracking_number,notes FROM orders WHERE uid=? ORDER BY created_at DESC");
    $stmt->execute([$uid]);
    $orders = $stmt->fetchAll();
    foreach ($orders as &$o) {
        $o['items'] = json_decode($o['items_json'] ?? '[]', true);
        $o['total'] = (float)$o['total'];
        unset($o['items_json']);
    }
    echo json_encode(['success' => true, 'data' => $orders]); exit;
}

// ── POST ──────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $b   = getBody();
    $bearer = getBearerToken();
    $guestToken = trim((string)($b['guest_token'] ?? ''));
    $jwt = $bearer ? requireAuth() : null;
    if ($jwt) { $uid = $jwt['uid']; }
    elseif ($guestToken && preg_match('/^[a-f0-9-]{16,128}$/i', $guestToken)) { $uid = 'guest_' . substr(hash('sha256', $guestToken), 0, 58); }
    else { jsonError('Guest checkout token required', 401); }

    $userStmt = $db->prepare("SELECT email_verified, email, first_name FROM users WHERE uid=? LIMIT 1");
    $userStmt->execute([$uid]);
    $userRow = $userStmt->fetch();

    if ($userRow && !(bool)$userRow['email_verified']) {
        http_response_code(403);
        echo json_encode(['error' => 'Please verify your email before placing an order.', 'code' => 'EMAIL_NOT_VERIFIED']);
        exit;
    }

    $action = $b['action'] ?? '';

    // ── CANCEL / ABANDON PAYMENT ──────────────────────────────────────────────
    // Closing Paystack is not a failed order. Keep it pending so the customer
    // can see Awaiting Payment and resume checkout from the account dashboard.
    if ($action === 'fail_payment') {
        $orderId = (int)($b['order_id'] ?? 0);
        $paystackRef = trim((string)($b['paystack_reference'] ?? ''));
        if (!$orderId) jsonError('order_id required');
        $stmt = $db->prepare("UPDATE orders SET payment_ref=CASE WHEN ?='' THEN payment_ref ELSE ? END, status='pending', payment_status='pending', updated_at=NOW() WHERE id=? AND uid=? AND payment_status='pending'");
        $stmt->execute([$paystackRef, $paystackRef, $orderId, $uid]);
        if ($stmt->rowCount() > 0) {
            $refStmt = $db->prepare('SELECT order_ref FROM orders WHERE id=? AND uid=? LIMIT 1');
            $refStmt->execute([$orderId, $uid]);
            $ref = $refStmt->fetchColumn() ?: (string)$orderId;
            logActivity($db, 'user', (string)$uid, $userRow['first_name'] ?? null, $userRow['email'] ?? null, 'PAYMENT_ABANDONED', (string)$ref, 'Payment window closed; order remains available to resume');
        }
        json(['success' => true, 'status' => 'pending', 'payment_status' => 'pending']);
    }

    // ── CANCEL UNPAID ORDER ────────────────────────────────────────────────────
    // Cancellation is distinct from a failed payment: keep payment_status
    // pending for reporting, but release stock reserved for this unpaid order.
    if ($action === 'cancel_payment') {
        $orderId = (int)($b['order_id'] ?? 0);
        if (!$orderId) jsonError('order_id required');

        $db->beginTransaction();
        try {
            $lock = $db->prepare("SELECT order_ref, items_json, inventory_reserved FROM orders WHERE id=? AND uid=? AND status='pending' AND payment_status='pending' FOR UPDATE");
            $lock->execute([$orderId, $uid]);
            $orderToCancel = $lock->fetch();
            if (!$orderToCancel) {
                $db->rollBack();
                jsonError('Order was not found or is no longer awaiting payment', 409);
            }

            if ((int)$orderToCancel['inventory_reserved'] === 1) {
                foreach (json_decode($orderToCancel['items_json'] ?? '[]', true) ?: [] as $item) {
                    if (empty($item['stock_reserved'])) continue;
                    $productId = (int)($item['id'] ?? 0);
                    $quantity = max(0, (int)($item['quantity'] ?? 0));
                    if ($productId > 0 && $quantity > 0) {
                        $db->prepare("UPDATE products SET stock_qty=stock_qty+? WHERE id=? AND stock_qty IS NOT NULL")
                           ->execute([$quantity, $productId]);
                    }
                }
            }
            $db->prepare("UPDATE orders SET status='cancelled', inventory_reserved=0, updated_at=NOW() WHERE id=? AND uid=?")
               ->execute([$orderId, $uid]);
            $ref = $orderToCancel['order_ref'];
            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            throw $e;
        }

        logActivity($db, 'user', (string)$uid, $userRow['first_name'] ?? null, $userRow['email'] ?? null, 'ORDER_CANCELLED', (string)$ref, 'Customer cancelled unpaid order; reserved stock was released');
        json(['success' => true, 'status' => 'cancelled', 'payment_status' => 'pending']);
    }

    // ── CONFIRM PAYMENT ───────────────────────────────────────────────────────
    if ($action === 'confirm_payment') {
        $orderId     = (int)($b['order_id'] ?? 0);
        $paystackRef = trim($b['paystack_reference'] ?? '');
        if (!$orderId || !$paystackRef) jsonError('order_id and paystack_reference required');

        $stmt = $db->prepare("SELECT * FROM orders WHERE id=? AND uid=? AND payment_status='pending' LIMIT 1");
        $stmt->execute([$orderId, $uid]);
        $order = $stmt->fetch();
        if (!$order) jsonError('Order not found or already processed', 404);

        // Verify with Paystack
        $txn = verifyPaystackPayment($paystackRef);
        if (!$txn) {
            logActivity($db, 'user', (string)$uid, $userRow['first_name'] ?? null, $userRow['email'] ?? null, 'PAYMENT_RETRY_PENDING', (string)$order['order_ref'], 'Payment verification unavailable; order remains resumable');
            jsonError('Payment verification is temporarily unavailable. Your order remains Awaiting Payment; please try again.', 503);
        }
        if (($txn['status'] ?? '') !== 'success') {
            logActivity($db, 'user', (string)$uid, $userRow['first_name'] ?? null, $userRow['email'] ?? null, 'PAYMENT_RETRY_PENDING', (string)$order['order_ref'], 'Paystack status: ' . ($txn['status'] ?? 'unknown') . '; order remains resumable');
            jsonError('Payment was not completed. Your order remains Awaiting Payment so you can try again.', 402);
        }

        $txnCurrency = strtoupper((string)($txn['currency'] ?? ''));
        if ($txnCurrency && $txnCurrency !== strtoupper((string)$order['currency'])) {
            logActivity($db, 'user', (string)$uid, $userRow['first_name'] ?? null, $userRow['email'] ?? null, 'PAYMENT_RETRY_PENDING', (string)$order['order_ref'], 'Paystack currency mismatch; order remains resumable');
            jsonError('Currency mismatch. Your order remains Awaiting Payment.', 402);
        }

        $paidNaira = (float)($txn['amount'] ?? 0) / 100;
        $expected  = (float)$order['total_amount'];
        if (abs($paidNaira - $expected) > 1) {
            logActivity($db, 'user', (string)$uid, $userRow['first_name'] ?? null, $userRow['email'] ?? null, 'PAYMENT_RETRY_PENDING', (string)$order['order_ref'], 'Paystack amount mismatch; order remains resumable');
            jsonError("Amount mismatch. Your order remains Awaiting Payment. Expected ₦{$expected}, got ₦{$paidNaira}", 402);
        }

        // Mark paid only after successful server-side verification. This is the
        // only transition from Awaiting Payment to Processing (Paid).
        $upd = $db->prepare("UPDATE orders SET payment_status='paid', payment_ref=?, status='processing', inventory_reserved=0, updated_at=NOW() WHERE id=? AND uid=? AND payment_status='pending'");
        $upd->execute([$paystackRef, $orderId, $uid]);
        if ($upd->rowCount() === 0) jsonError('Order already processed', 409);
        logActivity($db, 'user', (string)$uid, $userRow['first_name'] ?? null, $userRow['email'] ?? null, 'PAYMENT_CONFIRMED', (string)$order['order_ref'], 'Payment verified by Paystack');

        // Loyalty points (1 pt per ₦100)
        $points = (int)($paidNaira / 100);
        if ($points > 0 && $userRow) {
            $db->prepare("INSERT INTO loyalty_transactions (uid, points, type, description) VALUES (?, ?, 'earn', ?)")
               ->execute([$uid, $points, "Order {$order['order_ref']}"]);
        }

        // Coupon usage
        if ($order['discount_code']) {
            $db->prepare("UPDATE coupons SET used_count=used_count+1 WHERE code=?")
               ->execute([$order['discount_code']]);
        }

        // Notification
        $notifMsg = "Your order {$order['order_ref']} is confirmed and processing." . ($points > 0 ? " You earned {$points} pts!" : '');
        if ($userRow) {
            $db->prepare("INSERT INTO notifications (uid, title, body) VALUES (?, ?, ?)")
               ->execute([$uid, '✅ Order Confirmed!', $notifMsg]);
        }

        // ── Order confirmation email (Xpola branded) ──────────────────────────
        try {
            requireMail();

            $items    = json_decode($order['items_json'] ?? '[]', true);
            $orderUrl = XPOLA_APP_URL . '/account/orders';

            // Build item rows
            $itemRows = '';
            foreach ($items as $it) {
                $name  = htmlspecialchars($it['name'] ?? 'Item');
                $qty   = (int)($it['quantity'] ?? 1);
                $price = number_format((float)($it['price'] ?? 0) * $qty, 2);
                $itemRows .= "
                <tr>
                  <td style='padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;'>{$name}</td>
                  <td style='padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;'>{$qty}</td>
                  <td style='padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;font-size:14px;'>&#8358;{$price}</td>
                </tr>";
            }

            // Delivery row
            $deliveryRow = "
            <tr>
              <td colspan='2' style='padding:10px 8px;font-size:14px;color:#666;'>Delivery ({$order['delivery_area']})</td>
              <td style='padding:10px 8px;text-align:right;font-size:14px;'>&#8358;" . number_format((float)$order['delivery_fee'], 2) . "</td>
            </tr>";

            // Discount row
            $discRow = '';
            if ((float)$order['discount_amount'] > 0) {
                $discRow = "
                <tr>
                  <td colspan='2' style='padding:10px 8px;font-size:14px;color:#16a34a;'>Discount ({$order['discount_code']})</td>
                  <td style='padding:10px 8px;text-align:right;font-size:14px;color:#16a34a;font-weight:700;'>-&#8358;" . number_format((float)$order['discount_amount'], 2) . "</td>
                </tr>";
            }

            // Total row
            $totalRow = "
            <tr style='background:#1a1a2e;'>
              <td colspan='2' style='padding:12px 8px;font-weight:800;color:#ffffff;font-size:15px;'>Total Paid</td>
              <td style='padding:12px 8px;text-align:right;font-weight:800;color:#ffffff;font-size:15px;'>&#8358;" . number_format($paidNaira, 2) . "</td>
            </tr>";

            // Loyalty points badge
            $ptsHtml = $points > 0
                ? "<div style='background:#fef9c3;border:1px solid #fbbf24;border-radius:8px;padding:14px 18px;margin:20px 0;font-size:14px;'>
                     🎁 <strong>You earned {$points} loyalty points</strong> on this order!
                   </div>"
                : '';

            // Delivery address
            $deliveryAddr = htmlspecialchars(implode(', ', array_filter([
                $order['delivery_address'],
                $order['delivery_area'],
                $order['delivery_city'],
                $order['delivery_state'],
            ])));

            $bodyHtml = "
            <p>Hi <strong>" . htmlspecialchars($order['customer_name']) . "</strong>,</p>
            <p>Great news — your payment has been confirmed and your order is now being processed. Here's a summary:</p>

            <div style='background:#f9f9f9;border-radius:8px;padding:20px;margin:20px 0;'>
              <p style='margin:0 0 4px;font-size:13px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;'>Order Reference</p>
              <p style='margin:0 0 16px;font-size:24px;font-weight:800;color:#E02020;font-family:monospace;'>{$order['order_ref']}</p>

              <table width='100%' cellpadding='0' cellspacing='0'>
                <tr style='background:#eeeeee;'>
                  <th style='text-align:left;padding:10px 8px;font-size:13px;font-weight:700;'>Item</th>
                  <th style='text-align:center;padding:10px 8px;font-size:13px;font-weight:700;'>Qty</th>
                  <th style='text-align:right;padding:10px 8px;font-size:13px;font-weight:700;'>Price</th>
                </tr>
                {$itemRows}
                {$deliveryRow}
                {$discRow}
                {$totalRow}
              </table>
            </div>

            <p><strong>Delivering to:</strong><br>
            <span style='color:#555;'>{$deliveryAddr}</span></p>

            {$ptsHtml}

            " . ctaButton($orderUrl, 'Track Your Order') . "

            <p style='color:#999;font-size:13px;margin-top:24px;'>
              We'll send you another email once your order has been shipped. If you have any questions, reply to this email or visit our website.
            </p>";

            $emailBody = xpolaEmailTemplate('Your Order is Confirmed! 🎉', $bodyHtml);
            $sent = sendMail($order['customer_email'], "Order Confirmed — {$order['order_ref']}", $emailBody, $order['customer_name']);
            if (!$sent) error_log('[Xpola Orders] Confirmation email failed for order: ' . $order['order_ref']);

        } catch (\Throwable $e) {
            error_log('[Xpola Orders] Email error: ' . $e->getMessage());
        }

        json(['success' => true, 'order_ref' => $order['order_ref'], 'points_earned' => $points]);
    }

    // ── CREATE PENDING ORDER ──────────────────────────────────────────────────
    $customerName = trim($b['customer_name'] ?? '');
    $email        = trim($b['customer_email'] ?? $userRow['email'] ?? '');
    $phone        = trim($b['customer_phone'] ?? '');
    $address      = trim($b['delivery_address'] ?? '');
    $city         = trim($b['delivery_city'] ?? '');
    $state        = trim($b['delivery_state'] ?? '');
    $areaId       = (int)($b['delivery_area_id'] ?? 0);
    $deliveryFee  = (float)($b['delivery_fee'] ?? 0);
    $subtotal     = (float)($b['subtotal'] ?? 0);
    $discountCode = strtoupper(trim($b['discount_code'] ?? ''));
    $idemKey      = trim($b['idempotency_key'] ?? '');
    $items        = $b['order_items'] ?? [];
    $notes        = trim($b['notes'] ?? '');

    if (!$customerName) jsonError('customer_name required');
    if (!is_array($items) || count($items) === 0) jsonError('Your cart is empty. Please add a product before checkout.');

    // Validate product identifiers and aggregate duplicate lines before locking stock.
    $quantityByProduct = [];
    foreach ($items as $item) {
        $productId = (int)($item['id'] ?? 0);
        $quantity = (int)($item['quantity'] ?? 0);
        if ($productId <= 0 || $quantity <= 0) jsonError('A cart item has an invalid product or quantity. Please review your cart.');
        $quantityByProduct[$productId] = ($quantityByProduct[$productId] ?? 0) + $quantity;
    }

    // Idempotency check
    if ($idemKey) {
        $dup = $db->prepare("SELECT id, order_ref, total_amount FROM orders WHERE idempotency_key=? LIMIT 1");
        $dup->execute([$idemKey]);
        if ($row = $dup->fetch()) {
            json(['success' => true, 'id' => (int)$row['id'], 'order_ref' => $row['order_ref'], 'server_total' => (float)$row['total_amount']]);
        }
    }

    // Resolve delivery fee from DB
    $serverFee = $deliveryFee;
    $areaName  = $state;
    if ($areaId > 0) {
        $feeRow = $db->prepare("SELECT fee, area FROM delivery_fees WHERE id=? AND (is_active=1 OR active=1) LIMIT 1");
        $feeRow->execute([$areaId]);
        if ($row = $feeRow->fetch()) {
            $serverFee = (float)$row['fee'];
            $areaName  = $row['area'];
        }
    }

    // Resolve discount
    $discountAmt = 0;
    if ($discountCode) {
        $coupon = $db->prepare("SELECT * FROM coupons WHERE code=? AND is_active=1 LIMIT 1");
        $coupon->execute([$discountCode]);
        if ($c = $coupon->fetch()) {
            $discountAmt = $c['type'] === 'percentage'
                ? round($subtotal * $c['value'] / 100, 2)
                : (float)$c['value'];
            $discountAmt = min($discountAmt, $subtotal);
        }
    }

    $serverTotal = max(0, round($subtotal + $serverFee - $discountAmt, 2));
    $orderRef    = 'XPL-' . strtoupper(bin2hex(random_bytes(5)));

    // Reserve finite stock atomically before an unpaid order is created. The reservation
    // remains during payment retries and is released only if the customer cancels.
    $db->beginTransaction();
    $trackedProducts = [];
    foreach ($quantityByProduct as $productId => $quantity) {
        $productLock = $db->prepare('SELECT name, stock_status, stock_qty FROM products WHERE id=? FOR UPDATE');
        $productLock->execute([$productId]);
        $stockRow = $productLock->fetch();
        if (!$stockRow) {
            $db->rollBack();
            jsonError('A product in your cart is no longer available. Please refresh your cart.', 409);
        }
        if ($stockRow['stock_qty'] === null) {
            $db->rollBack();
            jsonError(($stockRow['name'] ?: 'A product') . ' has no available stock configured. Please refresh the product or contact the shop.', 409);
        }
        if ($stockRow['stock_status'] !== 'in_stock') {
            $db->rollBack();
            jsonError(($stockRow['name'] ?: 'A product') . ' is out of stock. Please remove it from your cart.', 409);
        }
        $available = max(0, (int)$stockRow['stock_qty']);
        if ($quantity > $available) {
            $db->rollBack();
            jsonError(($stockRow['name'] ?: 'A product') . ' has only ' . $available . ' unit' . ($available === 1 ? '' : 's') . ' left. Update your cart quantity and try again.', 409);
        }
        $updated = $db->prepare('UPDATE products SET stock_qty=stock_qty-? WHERE id=? AND stock_qty>=?');
        $updated->execute([$quantity, $productId, $quantity]);
        if ($updated->rowCount() !== 1) {
            $db->rollBack();
            jsonError(($stockRow['name'] ?: 'A product') . ' stock changed. Please refresh your cart and try again.', 409);
        }
        $trackedProducts[(int)$productId] = true;
    }

    $itemsForOrder = $items;
    foreach ($itemsForOrder as &$itemForOrder) {
        $itemForOrder['stock_reserved'] = isset($trackedProducts[(int)($itemForOrder['id'] ?? 0)]);
    }
    unset($itemForOrder);
    $inventoryReserved = $trackedProducts ? 1 : 0;

    $db->prepare("INSERT INTO orders
        (order_ref, uid, customer_name, customer_email, customer_phone,
         delivery_address, delivery_city, delivery_state, delivery_area,
         delivery_fee, subtotal, total_amount, currency, country,
         payment_status, payment_gateway, status,
         items_json, inventory_reserved, discount_code, discount_amount, idempotency_key, guest_token, notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'NGN','NG','pending','paystack','pending',?,?,?,?,?,?,?)")
      ->execute([
          $orderRef, $uid, $customerName, $email, $phone,
          $address, $city, $state, $areaName,
          $serverFee, $subtotal, $serverTotal,
          json_encode($itemsForOrder), $inventoryReserved, $discountCode ?: null, $discountAmt,
          $idemKey ?: null, $guestToken ?: null, $notes ?: null,
      ]);
    $createdOrderId = (int)$db->lastInsertId();
    $db->commit();

    logActivity($db, 'user', (string)$uid, $userRow['first_name'] ?? null, $email, 'ORDER_CREATED', $orderRef, 'Pending order created; available stock reserved');

    json(['success' => true, 'id' => $createdOrderId, 'order_ref' => $orderRef, 'server_total' => $serverTotal, 'guest_token' => $guestToken ?: null]);
}

jsonError('Method not allowed', 405);
