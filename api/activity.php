<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/auth.php';
require_once __DIR__ . '/admin/audit_helper.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => 'Server error'], 500));
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);

$jwt = requireAuth();
$body = getBody();
$action = strtoupper(trim((string)($body['action'] ?? '')));
$target = trim((string)($body['target'] ?? ''));
$details = trim((string)($body['details'] ?? ''));
$allowed = ['REGISTER','LOGIN','UPDATE_PROFILE','DELETE_ADDRESS','ADD_WISHLIST','REMOVE_WISHLIST','ORDER_CREATED','PAYMENT_FAILED','PAYMENT_CONFIRMED'];
if (!in_array($action, $allowed, true)) jsonError('Unsupported activity action');

$db = getDB();
$stmt = $db->prepare('SELECT uid, first_name, last_name, email FROM users WHERE uid=? LIMIT 1');
$stmt->execute([$jwt['uid']]);
$user = $stmt->fetch() ?: [];
$name = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? '')) ?: null;
logActivity($db, 'user', (string)$jwt['uid'], $name, $user['email'] ?? ($jwt['email'] ?? null), $action, $target ?: null, substr($details, 0, 4000));
json(['success' => true]);
