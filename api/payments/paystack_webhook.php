<?php
/** Paystack webhook: https://xpolaservices.com/api/payments/paystack_webhook.php */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../admin/audit_helper.php';
header('Content-Type: application/json');

$secret = getenv('PAYSTACK_SECRET_KEY') ?: '';
$payload = file_get_contents('php://input');
$sig = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';
if (!$secret || !hash_equals(hash_hmac('sha512', $payload, $secret), $sig)) {
    http_response_code(401); echo json_encode(['error' => 'Invalid signature']); exit;
}
$event = json_decode($payload, true);
if (!is_array($event)) { http_response_code(400); echo json_encode(['error' => 'Invalid payload']); exit; }

$eventName = $event['event'] ?? '';
$data = $event['data'] ?? [];
$ref = (string)($data['reference'] ?? '');
$status = (string)($data['status'] ?? '');
if ($ref && in_array($eventName, ['charge.success', 'charge.failed'], true)) {
    $db = getDB();
    if ($eventName === 'charge.success' && $status === 'success') {
        $stmt = $db->prepare("UPDATE orders SET payment_status='paid', payment_ref=?, status='processing', updated_at=NOW() WHERE (order_ref=? OR payment_ref=?) AND payment_gateway='paystack' AND payment_status IN ('pending','failed')");
        $stmt->execute([$ref, $ref, $ref]);
        logActivity($db, 'system', null, 'Paystack', null, 'PAYMENT_CONFIRMED', $ref, 'Paystack webhook confirmed payment');
    } else {
        $stmt = $db->prepare("UPDATE orders SET payment_status='failed', payment_ref=?, status='failed', updated_at=NOW() WHERE (order_ref=? OR payment_ref=?) AND payment_status='pending'");
        $stmt->execute([$ref, $ref, $ref]);
        logActivity($db, 'system', null, 'Paystack', null, 'PAYMENT_FAILED', $ref, 'Paystack webhook status: ' . $status);
    }
}
http_response_code(200);
echo json_encode(['received' => true]);
