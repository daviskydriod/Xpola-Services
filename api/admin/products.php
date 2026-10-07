<?php
/**
 * FILE PATH: api/admin/products.php
 * Full CRUD for products with:
 *  - Multiple images (product_images table)
 *  - Variations (product_variations table)
 *  - Audit logging on every write
 *
 * GET    /admin/products.php              → list all / single product
 * GET    /admin/products.php?id=N        → single product with images+variations
 * POST   /admin/products.php?action=create
 * POST   /admin/products.php?action=update
 * POST   /admin/products.php?action=add_image&id=N   → upload extra image
 * DELETE /admin/products.php?action=del_image&img_id=N
 * POST   /admin/products.php?action=add_variation&id=N
 * DELETE /admin/products.php?action=del_variation&var_id=N
 * DELETE /admin/products.php?id=N        → delete product
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../utils/upload.php';
require_once __DIR__ . '/audit_helper.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

$adminPayload = requireAdmin();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// ── Ensure tables ─────────────────────────────────────────────────────────────
$db->exec("CREATE TABLE IF NOT EXISTS products (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(255)  NOT NULL,
    description  TEXT,
    price        DECIMAL(10,2) NOT NULL,
    currency     ENUM('NGN','CAD','USD') DEFAULT 'NGN',
    country      ENUM('NG','CA')         DEFAULT 'NG',
    category_id  INT,
    image_path   VARCHAR(500),
    stock_status ENUM('in_stock','out_of_stock') DEFAULT 'in_stock',
    featured     TINYINT(1)    DEFAULT 0,
    rating       DECIMAL(3,2)  DEFAULT 0.00,
    reviews      INT           DEFAULT 0,
    tags         TEXT,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$db->exec("CREATE TABLE IF NOT EXISTS `product_images` (
    `id`         INT          NOT NULL AUTO_INCREMENT,
    `product_id` INT          NOT NULL,
    `image_path` VARCHAR(500) NOT NULL,
    `sort_order` INT          NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_pid` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$db->exec("CREATE TABLE IF NOT EXISTS `product_variations` (
    `id`          INT           NOT NULL AUTO_INCREMENT,
    `product_id`  INT           NOT NULL,
    `type`        VARCHAR(100)  NOT NULL DEFAULT 'size',
    `label`       VARCHAR(100)  NOT NULL,
    `value`       VARCHAR(100)  NOT NULL,
    `price_delta` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `stock_qty`   INT           NOT NULL DEFAULT 0,
    `sku`         VARCHAR(100)  DEFAULT NULL,
    `sort_order`  INT           NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    INDEX `idx_pid` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// ── Helper: attach images & variations to a product row ───────────────────────
function attachExtras(PDO $db, array $product): array {
    $imgs = $db->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id");
    $imgs->execute([$product['id']]);
    $product['images'] = $imgs->fetchAll();

    $vars = $db->prepare("SELECT * FROM product_variations WHERE product_id = ? ORDER BY type, sort_order, id");
    $vars->execute([$product['id']]);
    $product['variations'] = $vars->fetchAll();

    return $product;
}

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $s = $db->prepare("SELECT p.*, c.name AS category_name, c.slug AS category_slug
                           FROM products p LEFT JOIN categories c ON c.id = p.category_id
                           WHERE p.id = ? LIMIT 1");
        $s->execute([$id]);
        $p = $s->fetch();
        if (!$p) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
        echo json_encode(['success' => true, 'data' => attachExtras($db, $p)]); exit;
    }

    $country = strtoupper(trim($_GET['country'] ?? ''));
    $search  = trim($_GET['search'] ?? '');
    $w = []; $p = [];
    if ($country && in_array($country, ['NG','CA'])) { $w[] = 'p.country = ?'; $p[] = $country; }
    if ($search) { $w[] = '(p.name LIKE ? OR p.description LIKE ?)'; $p[] = "%$search%"; $p[] = "%$search%"; }
    $wSQL = $w ? 'WHERE ' . implode(' AND ', $w) : '';

    $stmt = $db->prepare("SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
                          FROM products p LEFT JOIN categories c ON c.id = p.category_id
                          $wSQL ORDER BY p.created_at DESC");
    $stmt->execute($p);
    $rows = $stmt->fetchAll();
    $rows = array_map(fn($row) => attachExtras($db, $row), $rows);
    echo json_encode(['success' => true, 'data' => $rows]); exit;
}

// ── POST: create ──────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'create') {
    $name        = htmlspecialchars(trim($_POST['name']        ?? ''));
    $description = htmlspecialchars(trim($_POST['description'] ?? ''));
    $price       = (float)($_POST['price'] ?? 0);
    $categoryId  = !empty($_POST['category_id']) ? (int)$_POST['category_id'] : null;
    $country     = in_array($_POST['country'] ?? '', ['NG','CA']) ? $_POST['country'] : 'NG';
    $currency    = in_array($_POST['currency'] ?? '', ['NGN','CAD','USD']) ? $_POST['currency'] : ($country === 'CA' ? 'CAD' : 'NGN');
    $stock       = in_array($_POST['stock_status'] ?? '', ['in_stock','out_of_stock']) ? $_POST['stock_status'] : 'in_stock';
    $featured    = (int)(bool)($_POST['featured'] ?? 0);
    $tags        = htmlspecialchars(trim($_POST['tags'] ?? ''));

    if (!$name || $price <= 0) { http_response_code(400); echo json_encode(['error' => 'Name and valid price required']); exit; }

    $imgPath = null;
    if (!empty($_FILES['image']['name'])) {
        try { $imgPath = uploadImage($_FILES['image']); }
        catch (RuntimeException $e) { http_response_code(400); echo json_encode(['error' => $e->getMessage()]); exit; }
    } elseif (!empty($_POST['image_url'])) {
        $imgPath = trim($_POST['image_url']);
    } elseif (!empty($_POST['image_path'])) {
        $imgPath = trim($_POST['image_path']);
    }

    $db->prepare("INSERT INTO products (name,description,price,currency,country,category_id,image_path,stock_status,featured,tags)
                  VALUES (?,?,?,?,?,?,?,?,?,?)")
       ->execute([$name,$description,$price,$currency,$country,$categoryId,$imgPath,$stock,$featured,$tags]);
    $newId = (int)$db->lastInsertId();

    // Insert primary image into product_images too
    if ($imgPath) {
        $db->prepare("INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?,?,0)")->execute([$newId, $imgPath]);
    }

    // Handle extra images (multipart fields: images[])
    if (!empty($_FILES['images']['name'][0])) {
        $sort = 1;
        foreach ($_FILES['images']['tmp_name'] as $i => $tmp) {
            if (empty($tmp)) continue;
            $file = ['name' => $_FILES['images']['name'][$i], 'tmp_name' => $tmp, 'size' => $_FILES['images']['size'][$i], 'error' => $_FILES['images']['error'][$i], 'type' => $_FILES['images']['type'][$i]];
            try {
                $p = uploadImage($file);
                $db->prepare("INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?,?,?)")->execute([$newId,$p,$sort++]);
            } catch (Throwable $ignored) {}
        }
    }

    // Handle variations JSON (sent as POST field 'variations' = JSON string)
    if (!empty($_POST['variations'])) {
        $vars = json_decode($_POST['variations'], true) ?? [];
        $sort = 0;
        foreach ($vars as $v) {
            $db->prepare("INSERT INTO product_variations (product_id, type, label, value, price_delta, stock_qty, sku, sort_order) VALUES (?,?,?,?,?,?,?,?)")
               ->execute([$newId, $v['type'] ?? 'size', $v['label'] ?? '', $v['value'] ?? '', (float)($v['price_delta'] ?? 0), (int)($v['stock_qty'] ?? 0), $v['sku'] ?? null, $sort++]);
        }
    }

    logAudit($db, $adminPayload, 'CREATE', 'product', "Created product: $name (id=$newId)");

    http_response_code(201);
    echo json_encode(['success' => true, 'id' => $newId]);
    exit;
}

// ── POST: update ──────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'update') {
    $upId        = (int)($_POST['id'] ?? 0);
    if (!$upId) { http_response_code(400); echo json_encode(['error' => 'ID required']); exit; }

    $name        = htmlspecialchars(trim($_POST['name']        ?? ''));
    $description = htmlspecialchars(trim($_POST['description'] ?? ''));
    $price       = (float)($_POST['price'] ?? 0);
    $categoryId  = !empty($_POST['category_id']) ? (int)$_POST['category_id'] : null;
    $country     = in_array($_POST['country'] ?? '', ['NG','CA']) ? $_POST['country'] : 'NG';
    $currency    = in_array($_POST['currency'] ?? '', ['NGN','CAD','USD']) ? $_POST['currency'] : ($country === 'CA' ? 'CAD' : 'NGN');
    $stock       = in_array($_POST['stock_status'] ?? '', ['in_stock','out_of_stock']) ? $_POST['stock_status'] : 'in_stock';
    $featured    = (int)(bool)($_POST['featured'] ?? 0);
    $tags        = htmlspecialchars(trim($_POST['tags'] ?? ''));

    if (!$name || $price <= 0) { http_response_code(400); echo json_encode(['error' => 'Name and valid price required']); exit; }

    if (!empty($_FILES['image']['name'])) {
        $old = $db->prepare("SELECT image_path FROM products WHERE id = ?"); $old->execute([$upId]); $ex = $old->fetch();
        if ($ex) deleteImage($ex['image_path']);
        try { $imgPath = uploadImage($_FILES['image']); }
        catch (RuntimeException $e) { http_response_code(400); echo json_encode(['error' => $e->getMessage()]); exit; }
        $db->prepare("UPDATE products SET name=?,description=?,price=?,currency=?,country=?,category_id=?,image_path=?,stock_status=?,featured=?,tags=?,updated_at=NOW() WHERE id=?")
           ->execute([$name,$description,$price,$currency,$country,$categoryId,$imgPath,$stock,$featured,$tags,$upId]);
    } elseif (!empty($_POST['image_url']) || !empty($_POST['image_path'])) {
        $imgPath = trim($_POST['image_url'] ?? $_POST['image_path'] ?? '');
        $db->prepare("UPDATE products SET name=?,description=?,price=?,currency=?,country=?,category_id=?,image_path=?,stock_status=?,featured=?,tags=?,updated_at=NOW() WHERE id=?")
           ->execute([$name,$description,$price,$currency,$country,$categoryId,$imgPath,$stock,$featured,$tags,$upId]);
    } else {
        $db->prepare("UPDATE products SET name=?,description=?,price=?,currency=?,country=?,category_id=?,stock_status=?,featured=?,tags=?,updated_at=NOW() WHERE id=?")
           ->execute([$name,$description,$price,$currency,$country,$categoryId,$stock,$featured,$tags,$upId]);
    }

    // Replace variations if sent
    if (isset($_POST['variations'])) {
        $vars = json_decode($_POST['variations'], true) ?? [];
        $db->prepare("DELETE FROM product_variations WHERE product_id = ?")->execute([$upId]);
        $sort = 0;
        foreach ($vars as $v) {
            $db->prepare("INSERT INTO product_variations (product_id, type, label, value, price_delta, stock_qty, sku, sort_order) VALUES (?,?,?,?,?,?,?,?)")
               ->execute([$upId, $v['type'] ?? 'size', $v['label'] ?? '', $v['value'] ?? '', (float)($v['price_delta'] ?? 0), (int)($v['stock_qty'] ?? 0), $v['sku'] ?? null, $sort++]);
        }
    }

    logAudit($db, $adminPayload, 'UPDATE', 'product', "Updated product id=$upId: $name");
    echo json_encode(['success' => true]); exit;
}

// ── POST: add_image ───────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'add_image' && $id) {
    if (empty($_FILES['image']['name'])) { http_response_code(400); echo json_encode(['error' => 'Image file required']); exit; }
    try { $imgPath = uploadImage($_FILES['image']); }
    catch (RuntimeException $e) { http_response_code(400); echo json_encode(['error' => $e->getMessage()]); exit; }
    $sort = (int)$db->query("SELECT COALESCE(MAX(sort_order),0)+1 FROM product_images WHERE product_id = $id")->fetchColumn();
    $db->prepare("INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?,?,?)")->execute([$id, $imgPath, $sort]);
    $newImgId = (int)$db->lastInsertId();
    logAudit($db, $adminPayload, 'ADD_IMAGE', 'product', "Added image to product id=$id");
    echo json_encode(['success' => true, 'id' => $newImgId, 'image_path' => $imgPath]); exit;
}

// ── DELETE: del_image ─────────────────────────────────────────────────────────
if ($method === 'DELETE' && $action === 'del_image') {
    $imgId = (int)($_GET['img_id'] ?? 0);
    if (!$imgId) { http_response_code(400); echo json_encode(['error' => 'img_id required']); exit; }
    $row = $db->prepare("SELECT * FROM product_images WHERE id = ?");
    $row->execute([$imgId]); $img = $row->fetch();
    if ($img) {
        deleteImage($img['image_path']);
        $db->prepare("DELETE FROM product_images WHERE id = ?")->execute([$imgId]);
        logAudit($db, $adminPayload, 'DELETE_IMAGE', 'product', "Deleted image id=$imgId from product id={$img['product_id']}");
    }
    echo json_encode(['success' => true]); exit;
}

// ── POST: add_variation ───────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'add_variation' && $id) {
    $b = getBody();
    $type  = trim($b['type']  ?? 'size');
    $label = trim($b['label'] ?? '');
    $value = trim($b['value'] ?? '');
    if (!$label || !$value) { http_response_code(400); echo json_encode(['error' => 'label and value required']); exit; }
    $sort = (int)$db->query("SELECT COALESCE(MAX(sort_order),0)+1 FROM product_variations WHERE product_id = $id")->fetchColumn();
    $db->prepare("INSERT INTO product_variations (product_id, type, label, value, price_delta, stock_qty, sku, sort_order) VALUES (?,?,?,?,?,?,?,?)")
       ->execute([$id, $type, $label, $value, (float)($b['price_delta']??0), (int)($b['stock_qty']??0), $b['sku']??null, $sort]);
    $newVarId = (int)$db->lastInsertId();
    logAudit($db, $adminPayload, 'ADD_VARIATION', 'product', "Added variation ($type: $label=$value) to product id=$id");
    echo json_encode(['success' => true, 'id' => $newVarId]); exit;
}

// ── DELETE: del_variation ─────────────────────────────────────────────────────
if ($method === 'DELETE' && $action === 'del_variation') {
    $varId = (int)($_GET['var_id'] ?? 0);
    if (!$varId) { http_response_code(400); echo json_encode(['error' => 'var_id required']); exit; }
    $db->prepare("DELETE FROM product_variations WHERE id = ?")->execute([$varId]);
    logAudit($db, $adminPayload, 'DELETE_VARIATION', 'product', "Deleted variation id=$varId");
    echo json_encode(['success' => true]); exit;
}

// ── DELETE: product ───────────────────────────────────────────────────────────
if ($method === 'DELETE' && $id) {
    $s = $db->prepare("SELECT * FROM products WHERE id = ?"); $s->execute([$id]); $p = $s->fetch();
    if ($p) {
        deleteImage($p['image_path']);
        $imgs = $db->prepare("SELECT * FROM product_images WHERE product_id = ?"); $imgs->execute([$id]);
        foreach ($imgs->fetchAll() as $img) deleteImage($img['image_path']);
        $db->prepare("DELETE FROM product_images     WHERE product_id = ?")->execute([$id]);
        $db->prepare("DELETE FROM product_variations WHERE product_id = ?")->execute([$id]);
        $db->prepare("DELETE FROM products           WHERE id = ?")->execute([$id]);
        logAudit($db, $adminPayload, 'DELETE', 'product', "Deleted product: {$p['name']} (id=$id)");
    }
    echo json_encode(['success' => true]); exit;
}

http_response_code(405); echo json_encode(['error' => 'Method not allowed']);
