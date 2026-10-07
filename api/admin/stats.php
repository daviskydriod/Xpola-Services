<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');


set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

requireAdmin();
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json(['error' => 'Method not allowed'], 405);
}

// 1. Total Revenue (Paid orders)
$revStmt = $db->query("SELECT SUM(total_amount) as total FROM orders WHERE payment_status = 'paid'");
$totalRevenue = (float)($revStmt->fetchColumn() ?: 0);

// 2. Total Orders
$orderCountStmt = $db->query("SELECT COUNT(*) FROM orders");
$totalOrders = (int)$orderCountStmt->fetchColumn();

// 3. Total Products
$prodCountStmt = $db->query("SELECT COUNT(*) FROM products");
$totalProducts = (int)$prodCountStmt->fetchColumn();

// 4. Total Customers
$custCountStmt = $db->query("SELECT COUNT(DISTINCT customer_email) FROM orders");
$totalCustomers = (int)$custCountStmt->fetchColumn();

// 5. Pending Orders
$pendingStmt = $db->query("SELECT COUNT(*) FROM orders WHERE status = 'pending'");
$pendingOrders = (int)$pendingStmt->fetchColumn();

// 6. Country-specific stats
$ngProdStmt   = $db->query("SELECT COUNT(*) FROM products WHERE country = 'NG'");
$nigeriaProducts = (int)$ngProdStmt->fetchColumn();

$caProdStmt   = $db->query("SELECT COUNT(*) FROM products WHERE country = 'CA'");
$canadaProducts  = (int)$caProdStmt->fetchColumn();

$ngRevStmt    = $db->query("SELECT SUM(total_amount) FROM orders WHERE country = 'NG' AND payment_status = 'paid'");
$nigeriaRevenue  = (float)($ngRevStmt->fetchColumn() ?: 0);

$caRevStmt    = $db->query("SELECT SUM(total_amount) FROM orders WHERE country = 'CA' AND payment_status = 'paid'");
$canadaRevenue   = (float)($caRevStmt->fetchColumn() ?: 0);

// 7. Recent Orders (camelCase keys for frontend)
$recentStmt = $db->query("
    SELECT 
        id,
        customer_name  AS customerName,
        total_amount   AS total,
        currency,
        status,
        created_at     AS createdAt
    FROM orders
    ORDER BY created_at DESC
    LIMIT 5
");
$recentOrders = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

// Cast numeric fields so JS gets numbers, not strings
foreach ($recentOrders as &$row) {
    $row['total'] = (float)$row['total'];
}
unset($row);

// 8. Revenue by Day (last 7 days)
$revDayStmt = $db->query("
    SELECT DATE(created_at) AS date, SUM(total_amount) AS amount
    FROM orders
    WHERE payment_status = 'paid'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
");
$revenueByDay = $revDayStmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($revenueByDay as &$row) { $row['amount'] = (float)$row['amount']; }
unset($row);

// 9. Revenue Chart by country (last 7 days)
$revChartStmt = $db->query("
    SELECT
        DATE(created_at) AS date,
        SUM(CASE WHEN country = 'NG' THEN total_amount ELSE 0 END) AS nigeria,
        SUM(CASE WHEN country = 'CA' THEN total_amount ELSE 0 END) AS canada
    FROM orders
    WHERE payment_status = 'paid'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
");
$revenueChart = $revChartStmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($revenueChart as &$row) {
    $row['nigeria'] = (float)$row['nigeria'];
    $row['canada']  = (float)$row['canada'];
}
unset($row);

// 10. Top Products (parsed from items_json)
$topProducts = [];
try {
    $itemsStmt = $db->query("
        SELECT items_json, total_amount, currency
        FROM orders
        WHERE payment_status = 'paid'
          AND items_json IS NOT NULL AND items_json != ''
    ");
    $productMap = [];
    while ($orderRow = $itemsStmt->fetch(PDO::FETCH_ASSOC)) {
        $items = json_decode($orderRow['items_json'], true);
        if (!is_array($items)) continue;
        foreach ($items as $item) {
            $pid = $item['id'] ?? $item['productId'] ?? null;
            if (!$pid) continue;
            if (!isset($productMap[$pid])) {
                $productMap[$pid] = [
                    'id'        => $pid,
                    'name'      => $item['name'] ?? 'Unknown',
                    'soldCount' => 0,
                    'revenue'   => 0.0,
                ];
            }
            $qty = (int)($item['quantity'] ?? 1);
            $productMap[$pid]['soldCount'] += $qty;
            $productMap[$pid]['revenue']   += (float)($item['price'] ?? 0) * $qty;
        }
    }
    usort($productMap, fn($a, $b) => $b['soldCount'] <=> $a['soldCount']);
    $topProducts = array_values(array_slice($productMap, 0, 10));
} catch (Throwable) {
    // items_json column may not exist — silently skip
    $topProducts = [];
}

echo json_encode([
    'totalRevenue'    => $totalRevenue,
    'totalOrders'     => $totalOrders,
    'totalProducts'   => $totalProducts,
    'totalCustomers'  => $totalCustomers,
    'pendingOrders'   => $pendingOrders,
    'nigeriaProducts' => $nigeriaProducts,
    'canadaProducts'  => $canadaProducts,
    'nigeriaRevenue'  => $nigeriaRevenue,
    'canadaRevenue'   => $canadaRevenue,
    'recentOrders'    => $recentOrders,
    'revenueByDay'    => $revenueByDay,
    'revenueChart'    => $revenueChart,
    'topProducts'     => $topProducts,
]);