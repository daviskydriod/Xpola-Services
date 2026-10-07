<?php
/**
 * FILE PATH: api/delivery_fees.php
 * Public endpoint — no auth required.
 * GET /delivery_fees.php              → all zones
 * GET /delivery_fees.php?country=NG   → filtered by country
 * GET /delivery_fees.php?active=1     → active zones only
 *
 * FIX: require paths corrected from '/../config/' to '/config/'
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/market.php';
header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}
$db = getDB();
// Ensure table exists
$db->exec("CREATE TABLE IF NOT EXISTS delivery_fees (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    area      VARCHAR(255) NOT NULL,
    state     VARCHAR(255) NOT NULL,
    country   VARCHAR(5)   NOT NULL DEFAULT 'NG',
    fee       DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active TINYINT(1)   NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$country    = strtoupper(trim($_GET['country'] ?? ''));
$activeOnly = isset($_GET['active']);

$where = []; $params = [];
if (!$country && !CANADA_MARKET_ENABLED) { $where[] = "country <> 'CA'"; }

if ($country && in_array($country, ['NG', 'CA'], true)) {
    $where[]  = 'country = ?';
    $params[] = $country;
}
if ($activeOnly) {
    $where[] = 'is_active = 1';
}

$w    = $where ? 'WHERE ' . implode(' AND ', $where) : '';
$stmt = $db->prepare(
    "SELECT id, area, state, country, fee, IF(country='CA','CAD','NGN') AS currency
     FROM delivery_fees $w
     ORDER BY country, state, area"
);
$stmt->execute($params);

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as &$r) {
    $r['id']  = (int)   $r['id'];
    $r['fee'] = (float) $r['fee'];
}
unset($r);

echo json_encode(['success' => true, 'data' => $rows]);