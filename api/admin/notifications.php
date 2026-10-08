<?php
/**
 * Admin stock notifications.
 * GET /admin/notifications.php
 * Low stock is calculated from product variations with a total quantity of 1–5.
 * Products with no variation quantities use the explicit stock_status field.
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));
requireAdmin();
$db = getDB();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonError('Method not allowed', 405);

$stmt = $db->query("SELECT p.id, p.name, p.country, p.stock_status,
    COUNT(v.id) AS variation_count, COALESCE(SUM(v.stock_qty), 0) AS variation_stock
  FROM products p
  LEFT JOIN product_variations v ON v.product_id = p.id
  GROUP BY p.id, p.name, p.country, p.stock_status
  ORDER BY p.stock_status = 'out_of_stock' DESC, p.name ASC");
$low = [];
$out = [];
foreach ($stmt->fetchAll() as $row) {
    $variationCount = (int)$row['variation_count'];
    $variationStock = (int)$row['variation_stock'];
    $status = $row['stock_status'] === 'out_of_stock'
        ? 'out_of_stock'
        : (($variationCount > 0 && $variationStock <= 5) ? 'low_stock' : 'in_stock');
    if ($status === 'out_of_stock') {
        $out[] = ['id' => (int)$row['id'], 'name' => $row['name'], 'country' => $row['country'], 'stockStatus' => $status, 'variationStock' => $variationCount ? $variationStock : null];
    } elseif ($status === 'low_stock') {
        $low[] = ['id' => (int)$row['id'], 'name' => $row['name'], 'country' => $row['country'], 'stockStatus' => $status, 'variationStock' => $variationStock];
    }
}
$restock = (int)$db->query("SELECT COUNT(*) FROM wishlists WHERE notify_on_restock = 1")->fetchColumn();
json(['success' => true, 'data' => [
    'lowStock' => $low,
    'outOfStock' => $out,
    'restockRequests' => $restock,
    'total' => count($low) + count($out) + $restock,
]]);
