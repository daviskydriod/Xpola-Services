<?php
/**
 * Staff-managed restock alert queue.
 * GET  /admin/restock.php                 -> opted-in wishlist customers
 * POST /admin/restock.php?action=send     -> send one alert and clear opt-in
 * POST /admin/restock.php?action=dismiss  -> clear one opt-in without email
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/audit_helper.php';
header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));
$admin = requireAdmin();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$db->exec("CREATE TABLE IF NOT EXISTS restock_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wishlist_id INT NOT NULL,
    uid VARCHAR(64) NOT NULL,
    product_id INT NOT NULL,
    recipient_email VARCHAR(200) NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    admin_id INT NULL,
    INDEX idx_restock_product (product_id),
    INDEX idx_restock_sent (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

if ($method === 'GET') {
    $stmt = $db->query("SELECT
        w.id AS wishlist_id, w.uid, w.product_id, w.created_at AS opted_in_at,
        p.name AS product_name, p.stock_status, p.image_path,
        u.email, u.first_name, u.last_name,
        MAX(ra.sent_at) AS last_sent_at
      FROM wishlists w
      INNER JOIN products p ON p.id = w.product_id
      INNER JOIN users u ON u.uid = w.uid
      LEFT JOIN restock_alerts ra ON ra.wishlist_id = w.id
      WHERE w.notify_on_restock = 1
      GROUP BY w.id, w.uid, w.product_id, w.created_at, p.name, p.stock_status, p.image_path, u.email, u.first_name, u.last_name
      ORDER BY (p.stock_status = 'in_stock') DESC, w.created_at ASC");
    $rows = array_map(fn($r) => [
        'wishlistId' => (int)$r['wishlist_id'],
        'uid' => $r['uid'],
        'productId' => (int)$r['product_id'],
        'productName' => $r['product_name'],
        'stockStatus' => $r['stock_status'],
        'email' => $r['email'],
        'customerName' => trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? '')),
        'optedInAt' => $r['opted_in_at'],
        'lastSentAt' => $r['last_sent_at'],
    ], $stmt->fetchAll());
    json(['success' => true, 'data' => $rows]);
}

if ($method === 'POST' && in_array($action, ['send', 'dismiss'], true)) {
    $body = getBody();
    $wishlistId = (int)($body['wishlistId'] ?? $_GET['wishlist_id'] ?? 0);
    if (!$wishlistId) jsonError('wishlistId required');
    $stmt = $db->prepare("SELECT w.id, w.uid, w.product_id, p.name, p.stock_status, u.email, u.first_name
        FROM wishlists w JOIN products p ON p.id = w.product_id JOIN users u ON u.uid = w.uid
        WHERE w.id = ? AND w.notify_on_restock = 1 LIMIT 1");
    $stmt->execute([$wishlistId]);
    $row = $stmt->fetch();
    if (!$row) jsonError('Restock request not found or already handled', 404);

    if ($action === 'dismiss') {
        $db->prepare('UPDATE wishlists SET notify_on_restock = 0 WHERE id = ?')->execute([$wishlistId]);
        logAudit($db, $admin, 'DISMISS_RESTOCK_ALERT', 'wishlist', 'Dismissed restock request #' . $wishlistId);
        json(['success' => true, 'action' => 'dismissed']);
    }

    if ($row['stock_status'] !== 'in_stock') {
        jsonError('Product is not currently in stock. Restock the product before sending an alert.', 409);
    }
    $productName = htmlspecialchars($row['name'], ENT_QUOTES, 'UTF-8');
    $bodyHtml = mailTemplate('Back in stock: ' . $productName,
        '<p>Hello ' . htmlspecialchars($row['first_name'] ?: 'there', ENT_QUOTES, 'UTF-8') . ',</p>'
        . '<p>The product you asked us to watch, <strong>' . $productName . '</strong>, is back in stock.</p>'
        . '<p>You can now visit the Xpola Services shop to view availability and place an order.</p>'
        . '<p>If you no longer need the product, you can ignore this message.</p>');
    if (!sendMail($row['email'], 'Back in stock — ' . $row['name'], $bodyHtml, $row['first_name'] ?: null)) {
        jsonError('The email could not be sent. The request remains in the queue.', 502);
    }
    $db->prepare('INSERT INTO restock_alerts (wishlist_id, uid, product_id, recipient_email, admin_id) VALUES (?,?,?,?,?)')
       ->execute([$wishlistId, $row['uid'], $row['product_id'], $row['email'], $admin['admin_id'] ?? null]);
    $db->prepare('UPDATE wishlists SET notify_on_restock = 0 WHERE id = ?')->execute([$wishlistId]);
    logAudit($db, $admin, 'SEND_RESTOCK_ALERT', 'wishlist', 'Sent restock alert for product #' . $row['product_id'] . ' to ' . $row['email']);
    json(['success' => true, 'action' => 'sent']);
}

json(['error' => 'Method not allowed'], 405);
