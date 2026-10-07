<?php
/**
 * FILE PATH: api/products.php
 * Public endpoint — no auth required.
 * GET /products.php           → paginated list
 * GET /products.php?id=N      → single product
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

// ── Single product by id ──────────────────────────────────────────────────────
if (!empty($_GET['id'])) {
    $stmt = $db->prepare("
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ?
        LIMIT 1
    ");
    $stmt->execute([(int)$_GET['id']]);
    $p = $stmt->fetch();
    if (!$p) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit;
    }
    if (($p['country'] ?? '') === 'CA' && !CANADA_MARKET_ENABLED) {
        jsonError('Canada marketplace is currently unavailable while Moneris setup is pending.', 503);
    }
    $p['images'] = json_decode($p['images_json'] ?? '[]', true);
    unset($p['images_json']);
    echo json_encode(['success' => true, 'data' => $p]);
    exit;
}

// ── Product list with filters & pagination ────────────────────────────────────
$country  = strtoupper(trim($_GET['country']  ?? ''));
$category = trim($_GET['category'] ?? '');
$search   = trim($_GET['search']   ?? '');
$sort     = $_GET['sort']          ?? 'newest';
$featured = isset($_GET['featured']);
$page     = max(1, (int)($_GET['page']     ?? 1));
$perPage  = min(100, max(1, (int)($_GET['per_page'] ?? 20)));
$offset   = ($page - 1) * $perPage;

$where = []; $params = [];

if ($country && in_array($country, ['NG', 'CA'], true)) {
    $where[]  = 'p.country = ?';
    $params[] = $country;
}
if ($category) {
    $where[]  = 'c.slug = ?';
    $params[] = $category;
}
if ($featured) {
    $where[] = 'p.featured = 1';
}
if ($search) {
    $where[]  = 'MATCH(p.name, p.description) AGAINST(? IN BOOLEAN MODE)';
    $params[] = $search . '*';
}


$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';
$orderSQL = match($sort) {
    'price_asc'  => 'p.price ASC',
    'price_desc' => 'p.price DESC',
    'popular'    => 'p.reviews DESC, p.rating DESC',
    'featured'   => 'p.featured DESC, p.created_at DESC',
    default      => 'p.created_at DESC',
};

$countStmt = $db->prepare("
    SELECT COUNT(*)
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    $whereSQL
");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

$stmt = $db->prepare("
    SELECT
        p.id, p.name, p.description, p.price, p.currency, p.country,
        p.image_path, p.stock_status, p.featured, p.rating, p.reviews,
        p.created_at, p.tags,
        c.name AS category_name, c.slug AS category_slug, c.id AS category_id
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    $whereSQL
    ORDER BY $orderSQL
    LIMIT ? OFFSET ?
");
$stmt->execute([...$params, $perPage, $offset]);

echo json_encode([
    'success'    => true,
    'data'       => $stmt->fetchAll(),
    'pagination' => [
        'page'      => $page,
        'per_page'  => $perPage,
        'total'     => $total,
        'last_page' => (int)ceil($total / max(1, $perPage)),
    ],
]);
