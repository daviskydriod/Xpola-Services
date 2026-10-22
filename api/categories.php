<?php
/**
 * Public catalogue categories.
 * GET /categories.php            -> active-market categories
 * GET /categories.php?country=NG -> categories for one market
 *
 * Categories are read from the existing database. This endpoint never seeds
 * shop categories; admins manage the records through the protected endpoint.
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
$db->exec("CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    country ENUM('NG','CA') NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    description TEXT DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_category_market_slug (country, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Upgrade databases created by the older endpoint.
foreach ([
    'description TEXT DEFAULT NULL',
    'image_url VARCHAR(500) DEFAULT NULL',
] as $column) {
    try { $db->exec("ALTER TABLE categories ADD COLUMN $column"); } catch (Throwable $ignored) {}
}

$country = strtoupper(trim($_GET['country'] ?? ''));
if ($country === 'CA') requireCanadaMarketEnabled();
$where = '';
$params = [];
if (in_array($country, ['NG', 'CA'], true)) {
    $where = 'WHERE c.country = ?';
    $params[] = $country;
} else {
    $where = "WHERE c.country <> 'CA'";
}

$stmt = $db->prepare("SELECT c.id, c.name, c.slug, c.country, c.sort_order, c.description, c.image_url,
    COUNT(CASE WHEN p.stock_status = 'in_stock' AND (p.stock_qty IS NULL OR p.stock_qty > 0) THEN 1 END) AS product_count
    FROM categories c LEFT JOIN products p ON p.category_id = c.id
    $where GROUP BY c.id, c.name, c.slug, c.country, c.sort_order, c.description, c.image_url
    ORDER BY c.country, c.sort_order, c.name");
$stmt->execute($params);
echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
