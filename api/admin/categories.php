<?php
/** Admin CRUD for catalogue categories. */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/audit_helper.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));
$adminPayload = requireAdmin();
$db = getDB();

$db->exec("CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    country ENUM('NG','CA') NOT NULL DEFAULT 'NG',
    sort_order INT NOT NULL DEFAULT 0,
    description TEXT DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_category_market_slug (country, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
foreach (['description TEXT DEFAULT NULL', 'image_url VARCHAR(500) DEFAULT NULL'] as $column) {
    try { $db->exec("ALTER TABLE categories ADD COLUMN $column"); } catch (Throwable $ignored) {}
}

$slugify = static fn(string $name): string => trim(strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name)), '-');
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $db->query('SELECT c.*, COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.country, c.sort_order, c.name')->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $rows]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];
if ($method === 'POST' || $method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    $name = trim((string)($data['name'] ?? ''));
    $slug = $slugify(trim((string)($data['slug'] ?? ''))) ?: $slugify($name);
    $country = in_array($data['country'] ?? '', ['NG', 'CA'], true) ? $data['country'] : 'NG';
    $sort = (int)($data['sort_order'] ?? 0);
    $description = trim((string)($data['description'] ?? '')) ?: null;
    $image = trim((string)($data['image_url'] ?? '')) ?: null;
    if ($name === '' || $slug === '') { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Category name is required']); exit; }
    $dup = $db->prepare('SELECT id FROM categories WHERE country=? AND slug=? AND id<>? LIMIT 1');
    $dup->execute([$country, $slug, $id]);
    if ($dup->fetch()) { http_response_code(409); echo json_encode(['success'=>false,'error'=>'A category with this name already exists in this market.']); exit; }
    if ($method === 'POST') {
        $stmt = $db->prepare('INSERT INTO categories (name,slug,country,sort_order,description,image_url) VALUES (?,?,?,?,?,?)');
        $stmt->execute([$name,$slug,$country,$sort,$description,$image]);
        $id = (int)$db->lastInsertId();
        logAudit($db, $adminPayload, 'CREATE', 'category', "Created category: $name (id=$id)");
        http_response_code(201);
    } else {
        if (!$id) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Category ID required']); exit; }
        $stmt = $db->prepare('UPDATE categories SET name=?,slug=?,country=?,sort_order=?,description=?,image_url=? WHERE id=?');
        $stmt->execute([$name,$slug,$country,$sort,$description,$image,$id]);
        logAudit($db, $adminPayload, 'UPDATE', 'category', "Updated category id=$id: $name");
    }
    $row = $db->prepare('SELECT * FROM categories WHERE id=?'); $row->execute([$id]);
    echo json_encode(['success'=>true, 'data'=>$row->fetch(PDO::FETCH_ASSOC)]);
    exit;
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Category ID required']); exit; }
    $stmt = $db->prepare('DELETE FROM categories WHERE id=?'); $stmt->execute([$id]);
    if (!$stmt->rowCount()) { http_response_code(404); echo json_encode(['success'=>false,'error'=>'Category not found']); exit; }
    logAudit($db, $adminPayload, 'DELETE', 'category', "Deleted category id=$id");
    echo json_encode(['success'=>true]); exit;
}
http_response_code(405); echo json_encode(['success'=>false,'error'=>'Method not allowed']);
