<?php
/**
 * FILE PATH: api/payments/paystack_verify.php
 *
 * Verifies an original or retry Paystack reference. Retry references are
 * linked to the original order through Paystack metadata.order_id.
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../admin/audit_helper.php';

header('Content-Type: application/json');

$paystackConfig = __DIR__ . '/../config/paystack.php';
if (is_file($paystackConfig)) require_once $paystackConfig;

$secret = getenv('PAYSTACK_SECRET_KEY')
    ?: (defined('PAYSTACK_SECRET_KEY') ? PAYSTACK_SECRET_KEY : '')
    ?: (defined('PAYSTACK_SECRET') ? PAYSTACK_SECRET : '');
$ref = trim((string)($_GET['reference'] ?? ''));

if (!$secret) {
    http_response_code(503);
    echo json_encode(['error' => 'Payment verification is not configured']);
    exit;
}
if (!$ref) {
    http_response_code(400);
    echo json_encode(['error' => 'No reference provided']);
    exit;
}

$ch = curl_init('https://api.paystack.co/transaction/verify/' . rawurlencode($ref));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Authorization: Bearer {$secret}"],
    CURLOPT_TIMEOUT => 20,
]);
$raw = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error || !$raw) {
    http_response_code(503);
    echo json_encode(['error' => 'Unable to contact Paystack']);
    exit;
}

$response = json_decode($raw, true);
if (!$response || !($response['status'] ?? false)) {
    http_response_code(400);
    echo json_encode(['error' => 'Verification failed']);
    exit;
}

$data = $response['data'] ?? [];
$status = strtolower((string)($data['status'] ?? ''));
$db = getDB();

// Retry payments include metadata.order_id. Original references continue to
// work through order_ref/payment_ref fallback for backwards compatibility.
$metadata = is_array($data['metadata'] ?? null) ? $data['metadata'] : [];
$orderId = (int)($metadata['order_id'] ?? 0);

if ($orderId > 0) {
    $stmt = $db->prepare('SELECT * FROM orders WHERE id=? LIMIT 1');
    $stmt->execute([$orderId]);
} else {
    $stmt = $db->prepare('SELECT * FROM orders WHERE order_ref=? OR payment_ref=? LIMIT 1');
    $stmt->execute([$ref, $ref]);
}
$order = $stmt->fetch();
if (!$order) {
    http_response_code(404);
    echo json_encode(['error' => 'Order not found for this payment reference']);
    exit;
}

// Idempotent response if the callback/webhook already confirmed it.
if (($order['payment_status'] ?? '') === 'paid') {
    echo json_encode([
        'success' => true,
        'message' => 'Payment already verified',
        'order' => [
            'uid' => $order['uid'],
            'order_ref' => $order['order_ref'],
            'total_amount' => (float)$order['total_amount'],
            'status' => $order['status'],
            'payment_status' => $order['payment_status'],
        ],
    ]);
    exit;
}

// Only a successful transaction can change an order to Processing (Paid).
// Failed, abandoned, pending, or unavailable attempts remain resumable.
if ($status !== 'success') {
    echo json_encode([
        'success' => false,
        'message' => 'Payment not completed; order remains Awaiting Payment',
        'status' => $status,
        'order' => [
            'uid' => $order['uid'],
            'order_ref' => $order['order_ref'],
            'status' => 'pending',
            'payment_status' => 'pending',
        ],
    ]);
    exit;
}

$transactionCurrency = strtoupper((string)($data['currency'] ?? ''));
$orderCurrency = strtoupper((string)($order['currency'] ?? ''));
if ($transactionCurrency && $orderCurrency && $transactionCurrency !== $orderCurrency) {
    http_response_code(402);
    echo json_encode(['error' => 'Payment currency does not match the order; order remains Awaiting Payment']);
    exit;
}

$paidAmount = (float)($data['amount'] ?? 0) / 100;
$expectedAmount = (float)$order['total_amount'];
if (abs($paidAmount - $expectedAmount) > 1) {
    http_response_code(402);
    echo json_encode([
        'error' => 'Payment amount does not match the order; order remains Awaiting Payment',
        'expected' => $expectedAmount,
        'received' => $paidAmount,
    ]);
    exit;
}

$update = $db->prepare("UPDATE orders
    SET payment_status='paid', payment_ref=?, status='processing', updated_at=NOW()
    WHERE id=? AND payment_gateway='paystack' AND payment_status='pending'");
$update->execute([$ref, $order['id']]);

if ($update->rowCount() === 0) {
    $check = $db->prepare('SELECT uid, order_ref, total_amount, status, payment_status FROM orders WHERE id=? LIMIT 1');
    $check->execute([$order['id']]);
    $current = $check->fetch();
    if (($current['payment_status'] ?? '') === 'paid') {
        echo json_encode(['success' => true, 'message' => 'Payment already verified', 'order' => $current]);
        exit;
    }
    http_response_code(409);
    echo json_encode(['error' => 'Order could not be updated']);
    exit;
}

logActivity($db, 'user', (string)$order['uid'], null, null, 'PAYMENT_CONFIRMED', (string)$order['order_ref'], 'Payment verified by Paystack');

$row = $db->prepare('SELECT uid, order_ref, total_amount, status, payment_status FROM orders WHERE id=? LIMIT 1');
$row->execute([$order['id']]);
$updated = $row->fetch();

echo json_encode([
    'success' => true,
    'message' => 'Payment verified',
    'order' => $updated,
]);
