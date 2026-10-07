<?php
/**
 * FILE PATH: api/payments/moneris.php
 *
 * Moneris Hosted Tokenization + Purchase for CAD orders.
 *
 * Flow:
 *   POST /payments/moneris.php?action=token_url   → returns Moneris-hosted iframe URL
 *   POST /payments/moneris.php?action=purchase     → charges the temp token, creates order
 *   POST /payments/moneris.php?action=webhook      → Moneris webhook confirmation (optional)
 *
 * Env vars needed (set in cPanel → Software → PHP Environment Variables):
 *   MONERIS_STORE_ID       your store ID  (sandbox: store5)
 *   MONERIS_API_TOKEN      your API token
 *   MONERIS_CHECKOUT_ID    from Moneris portal (for hosted tokenization)
 *   MONERIS_ENV            "sandbox" or "production"
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/market.php';
requireCanadaMarketEnabled();

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

// ── Config ────────────────────────────────────────────────────────────────────
$storeId    = getenv('MONERIS_STORE_ID')    ?: '';
$apiToken   = getenv('MONERIS_API_TOKEN')   ?: '';
$checkoutId = getenv('MONERIS_CHECKOUT_ID') ?: '';
$env        = getenv('MONERIS_ENV')         ?: 'sandbox';

if (!$storeId || !$apiToken || !$checkoutId) {
    jsonError('Canada payment processing is not configured', 503);
}

$isSandbox  = ($env !== 'production');
$apiBase    = $isSandbox
    ? 'https://gatewayt.moneris.com/chkt/request/request.php'
    : 'https://gateway.moneris.com/chkt/request/request.php';

// ── Helpers ───────────────────────────────────────────────────────────────────
function monerisPost(string $url, array $payload): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $resp = curl_exec($ch);
    if (curl_errno($ch)) throw new RuntimeException('Moneris curl error: ' . curl_error($ch));
    curl_close($ch);
    $decoded = json_decode($resp, true);
    if (!is_array($decoded)) throw new RuntimeException('Moneris returned invalid JSON');
    return $decoded;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── POST /payments/moneris.php?action=token_url ───────────────────────────────
// Returns a Moneris-hosted tokenization URL for the frontend iframe.
// The frontend embeds this in an iframe; Moneris calls back with a temp token.
if ($method === 'POST' && $action === 'token_url') {
    $jwt    = requireAuth();
    $body   = getBody();
    $amount = number_format((float)($body['amount'] ?? 0), 2, '.', '');
    if ((float)$amount <= 0) jsonError('Invalid amount');

    $orderRef = 'XPL-' . strtoupper(bin2hex(random_bytes(5)));

    $payload = [
        'store_id'    => $storeId,
        'api_token'   => $apiToken,
        'checkout_id' => $checkoutId,
        'txn_total'   => $amount,
        'environment' => $isSandbox ? 'qa' : 'prod',
        'action'      => 'preload',
        'order_no'    => $orderRef,
        'cust_id'     => $jwt['uid'],
        'language'    => 'en',
    ];

    $result = monerisPost($apiBase, $payload);

    if (($result['response']['success'] ?? '') !== 'true') {
        jsonError('Failed to initialise Moneris: ' . ($result['response']['message'] ?? 'unknown'), 502);
    }

    $ticket = $result['response']['ticket'] ?? '';
    $hostedUrl = $isSandbox
        ? "https://gatewayt.moneris.com/chkt/payment/payment.php?id={$ticket}"
        : "https://gateway.moneris.com/chkt/payment/payment.php?id={$ticket}";

    json(['success' => true, 'url' => $hostedUrl, 'order_ref' => $orderRef, 'ticket' => $ticket]);
}

// ── POST /payments/moneris.php?action=purchase ────────────────────────────────
// Called after Moneris iframe posts back a temp token to the frontend.
// We charge the token server-side and save the order.
if ($method === 'POST' && $action === 'purchase') {
    $jwt  = requireAuth();
    $uid  = $jwt['uid'];
    $db   = getDB();
    $body = getBody();

    $ticket       = trim($body['ticket']       ?? '');
    $orderRef     = trim($body['order_ref']    ?? '');
    $idemKey      = trim($body['idempotency_key'] ?? '');
    $amount       = number_format((float)($body['amount'] ?? 0), 2, '.', '');
    $customerName = trim($body['customer_name'] ?? '');
    $email        = trim($body['customer_email'] ?? '');
    $phone        = trim($body['customer_phone'] ?? '');
    $address      = trim($body['delivery_address'] ?? '');
    $city         = trim($body['delivery_city'] ?? '');
    $state        = trim($body['delivery_state'] ?? '');
    $areaId       = (int)($body['delivery_area_id'] ?? 0);
    $deliveryFee  = (float)($body['delivery_fee'] ?? 0);
    $subtotal     = (float)($body['subtotal'] ?? 0);
    $discountCode = trim($body['discount_code'] ?? '');
    $items        = $body['items'] ?? [];

    if (!$ticket || !$orderRef || (float)$amount <= 0)
        jsonError('ticket, order_ref and amount are required');

    // Idempotency check
    if ($idemKey) {
        $dup = $db->prepare("SELECT id FROM orders WHERE idempotency_key = ? LIMIT 1");
        $dup->execute([$idemKey]);
        if ($row = $dup->fetch()) {
            json(['success' => true, 'id' => $row['id'], 'order_ref' => $orderRef, 'duplicate' => true]);
        }
    }

    // Verify delivery fee server-side
    $serverFee = $deliveryFee;
    if ($areaId > 0) {
        $feeRow = $db->prepare("SELECT fee FROM delivery_fees WHERE id = ? AND is_active = 1 LIMIT 1");
        $feeRow->execute([$areaId]);
        $row = $feeRow->fetch();
        if ($row) $serverFee = (float)$row['fee'];
    }
    $serverTotal = round($subtotal + $serverFee, 2);

    // Validate coupon
    $discountAmt = 0;
    if ($discountCode) {
        $coupon = $db->prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1 LIMIT 1");
        $coupon->execute([strtoupper($discountCode)]);
        $c = $coupon->fetch();
        if ($c) {
            $discountAmt = $c['type'] === 'percentage'
                ? round($subtotal * $c['value'] / 100, 2)
                : (float)$c['value'];
            $discountAmt = min($discountAmt, $subtotal);
            $serverTotal = max(0, $serverTotal - $discountAmt);
        }
    }

    // Retrieve the delivery area name
    $areaName = $state;
    if ($areaId > 0) {
        $areaRow = $db->prepare("SELECT area FROM delivery_fees WHERE id = ? LIMIT 1");
        $areaRow->execute([$areaId]);
        $ar = $areaRow->fetch();
        if ($ar) $areaName = $ar['area'];
    }

    // ── Charge the Moneris token ──────────────────────────────────────────────
    $chargePayload = [
        'store_id'  => $storeId,
        'api_token' => $apiToken,
        'checkout_id' => $checkoutId,
        'txn_total'   => number_format($serverTotal, 2, '.', ''),
        'environment' => $isSandbox ? 'qa' : 'prod',
        'action'      => 'receipt',
        'ticket'      => $ticket,
    ];

    $result = monerisPost($apiBase, $chargePayload);
    $receipt = $result['response'] ?? [];

    if (($receipt['success'] ?? '') !== 'true') {
        jsonError('Payment declined: ' . ($receipt['message'] ?? 'card declined'), 402);
    }

    $paymentRef  = $receipt['receipt']['cc']['order_no']       ?? $orderRef;
    $authCode    = $receipt['receipt']['cc']['approval_code']  ?? '';
    $last4       = $receipt['receipt']['cc']['pan']            ?? '';
    $cardType    = $receipt['receipt']['cc']['card_type']      ?? '';

    // ── Save order ────────────────────────────────────────────────────────────
    $stmt = $db->prepare("
        INSERT INTO orders (
            order_ref, uid, customer_name, customer_email, customer_phone,
            delivery_address, delivery_city, delivery_state, delivery_area,
            delivery_fee, subtotal, total_amount, currency, country,
            payment_ref, payment_status, status, items_json,
            discount_code, discount_amount, payment_gateway, idempotency_key
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, 'CAD', 'CA',
            ?, 'paid', 'pending', ?,
            ?, ?, 'moneris', ?
        )
    ");
    $stmt->execute([
        $orderRef, $uid, $customerName, $email, $phone,
        $address, $city, $state, $areaName,
        $serverFee, $subtotal, $serverTotal,
        $paymentRef, json_encode($items),
        $discountCode, $discountAmt, $idemKey,
    ]);
    $orderId = (int)$db->lastInsertId();

    // Audit log
    $db->prepare("INSERT INTO audit_logs (uid, action, meta, ip) VALUES (?, 'order_paid_moneris', ?, ?)")
       ->execute([$uid, json_encode(['order_id' => $orderId, 'ref' => $orderRef, 'auth' => $authCode]), $_SERVER['REMOTE_ADDR'] ?? '']);

    json([
        'success'      => true,
        'id'           => $orderId,
        'order_ref'    => $orderRef,
        'server_total' => $serverTotal,
        'auth_code'    => $authCode,
        'card_last4'   => $last4,
        'card_type'    => $cardType,
    ]);
}

jsonError('Unknown action', 404);
