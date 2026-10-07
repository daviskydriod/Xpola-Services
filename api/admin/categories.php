<?php
/**
 * api/admin/categories.php
 * FIX: was using $pdo (undefined), now uses getDB()
 * FIX: schema aligned with actual DB (name, slug, country, sort_order + description, image_url via ALTER)
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

requireAdmin();
$db = getDB();

// Ensure description + image_url columns exist (safe to run every request)
try {
    $db->exec("ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `description` TEXT DEFAULT NULL");
    $db->exec("ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `image_url` VARCHAR(500) DEFAULT NULL");
} catch (Throwable) {}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        $stmt = $db->query("SELECT * FROM categories ORDER BY sort_order ASC, name ASC");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $categories]);
        break;

    case 'POST':
        $data        = json_decode(file_get_contents('php://input'), true) ?? [];
        $name        = trim($data['name']        ?? '');
        $description = trim($data['description'] ?? '');
        $image_url   = trim($data['image_url']   ?? '');
        $country     = in_array($data['country'] ?? '', ['NG','CA']) ? $data['country'] : 'NG';
        $sort_order  = (int)($data['sort_order'] ?? 0);
        // auto-generate slug
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));

        if (!$name) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Category name is required']);
            exit;
        }

        $stmt = $db->prepare("INSERT INTO categories (name, slug, country, sort_order, description, image_url)
                               VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $slug, $country, $sort_order, $description ?: null, $image_url ?: null]);
        $id = $db->lastInsertId();

        $row = $db->prepare("SELECT * FROM categories WHERE id = ?");
        $row->execute([$id]);
        http_response_code(201);
        echo json_encode(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
        break;

    case 'PUT':
        $id = intval($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Category ID required']);
            exit;
        }

        $data        = json_decode(file_get_contents('php://input'), true) ?? [];
        $name        = trim($data['name']        ?? '');
        $description = trim($data['description'] ?? '');
        $image_url   = trim($data['image_url']   ?? '');
        $country     = in_array($data['country'] ?? '', ['NG','CA']) ? $data['country'] : 'NG';
        $sort_order  = (int)($data['sort_order'] ?? 0);
        $slug        = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));

        if (!$name) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Category name is required']);
            exit;
        }

        $stmt = $db->prepare("UPDATE categories
                               SET name=?, slug=?, country=?, sort_order=?, description=?, image_url=?
                               WHERE id=?");
        $stmt->execute([$name, $slug, $country, $sort_order, $description ?: null, $image_url ?: null, $id]);

        $row = $db->prepare("SELECT * FROM categories WHERE id = ?");
        $row->execute([$id]);
        $cat = $row->fetch(PDO::FETCH_ASSOC);

        if (!$cat) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Category not found']);
            exit;
        }
        echo json_encode(['success' => true, 'data' => $cat]);
        break;

    case 'DELETE':
        $id = intval($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Category ID required']);
            exit;
        }
        $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Category not found']);
            exit;
        }
        echo json_encode(['success' => true, 'message' => 'Category deleted']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
