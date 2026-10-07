<?php
/**
 * FILE PATH: api/categories.php
 * Public endpoint — no auth required.
 * GET /categories.php            → all categories
 * GET /categories.php?country=NG → filtered by country
 *
 * FIX: require paths already correct in original, kept consistent.
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
$db->exec("CREATE TABLE IF NOT EXISTS categories (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(255) NOT NULL,
    country    ENUM('NG','CA') NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$country = strtoupper(trim($_GET['country'] ?? ''));
if ($country === 'CA') requireCanadaMarketEnabled();

if ($country && in_array($country, ['NG', 'CA'], true)) {
    $stmt = $db->prepare("SELECT id, name, slug, country FROM categories WHERE country = ? ORDER BY sort_order, name");
    $stmt->execute([$country]);
} else {
    $stmt = $db->query("SELECT id, name, slug, country FROM categories WHERE country <> 'CA' ORDER BY country, sort_order, name");
}

echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
