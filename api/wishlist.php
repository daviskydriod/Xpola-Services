<?php
/**
 * FILE PATH: api/wishlist.php
 * Auth required. Matches api.ts wishlistApi exactly.
 *
 * GET    /wishlist.php        → list wishlist items with product details
 * POST   /wishlist.php        → add product { productId }
 * DELETE /wishlist.php?id=X   → remove item
 * PATCH  /wishlist.php?id=X   → toggle restock notify { notifyOnRestock: bool }
 *
 * FIX: table renamed wishlist → wishlists to match migrate_database.php canonical schema.
 *      id changed to INT AUTO_INCREMENT for consistency.
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/auth.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

$jwt    = requireAuth();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── Canonical schema (matches migrate_database.php) ───────────────────────────
$db->exec("CREATE TABLE IF NOT EXISTS `wishlists` (
    `id`               INT         NOT NULL AUTO_INCREMENT,
    `uid`              VARCHAR(64) NOT NULL,
    `product_id`       INT         NOT NULL,
    `notify_on_restock` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at`       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_uid_product` (`uid`, `product_id`),
    INDEX `idx_uid`        (`uid`),
    INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// ── GET — list items ──────────────────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $db->prepare("
        SELECT
            w.id, w.product_id, w.notify_on_restock, w.created_at AS added_at,
            p.id        AS p_id,
            p.name, p.description, p.price, p.currency, p.country,
            p.image_path, p.stock_status, p.featured, p.rating, p.reviews,
            p.created_at AS p_created_at, p.tags,
            c.id   AS category_id,
            c.name AS category_name,
            c.slug AS category_slug
        FROM `wishlists` w
        JOIN products p    ON p.id = w.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE w.uid = ?
        ORDER BY w.created_at DESC
    ");
    $stmt->execute([$jwt['uid']]);
    $rows = $stmt->fetchAll();

    $items = array_map(function ($r) {
        return [
            'id'              => (string)$r['id'],
            'productId'       => (string)$r['product_id'],
            'addedAt'         => $r['added_at'],
            'notifyOnRestock' => (bool)$r['notify_on_restock'],
            'product'         => [
                'id'            => (int)$r['p_id'],
                'name'          => $r['name'],
                'description'   => $r['description'],
                'price'         => (float)$r['price'],
                'currency'      => $r['currency'],
                'country'       => $r['country'],
                'image_path'    => $r['image_path'],
                'stock_status'  => $r['stock_status'],
                'featured'      => (int)$r['featured'],
                'rating'        => (float)$r['rating'],
                'reviews'       => (int)$r['reviews'],
                'created_at'    => $r['p_created_at'],
                'tags'          => $r['tags'],
                'category_id'   => $r['category_id'] ? (int)$r['category_id'] : null,
                'category_name' => $r['category_name'],
                'category_slug' => $r['category_slug'],
            ],
        ];
    }, $rows);

    json($items);
}

// ── POST — add item ───────────────────────────────────────────────────────────
if ($method === 'POST') {
    $b         = getBody();
    $productId = (int)($b['productId'] ?? 0);
    if (!$productId) jsonError('productId required');

    // Check product exists
    $p = $db->prepare("SELECT id FROM products WHERE id = ? LIMIT 1");
    $p->execute([$productId]);
    if (!$p->fetch()) jsonError('Product not found', 404);

    try {
        $db->prepare("INSERT INTO `wishlists` (uid, product_id) VALUES (?,?)")
           ->execute([$jwt['uid'], $productId]);
        $id = $db->lastInsertId();
    } catch (\PDOException $e) {
        // Unique constraint — already in wishlist, return existing id
        $ex = $db->prepare("SELECT id FROM `wishlists` WHERE uid = ? AND product_id = ? LIMIT 1");
        $ex->execute([$jwt['uid'], $productId]);
        $id = $ex->fetchColumn();
    }

    json(['id' => (string)$id], 201);
}

// ── DELETE — remove item ──────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('id required');

    $stmt = $db->prepare("DELETE FROM `wishlists` WHERE id = ? AND uid = ?");
    $stmt->execute([$id, $jwt['uid']]);

    if ($stmt->rowCount() === 0) jsonError('Item not found', 404);
    json(['success' => true]);
}

// ── PATCH — toggle restock notify ────────────────────────────────────────────
if ($method === 'PATCH') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('id required');

    $b      = getBody();
    $notify = isset($b['notifyOnRestock']) ? (int)(bool)$b['notifyOnRestock'] : null;
    if ($notify === null) jsonError('notifyOnRestock required');

    $stmt = $db->prepare("UPDATE `wishlists` SET notify_on_restock = ? WHERE id = ? AND uid = ?");
    $stmt->execute([$notify, $id, $jwt['uid']]);

    if ($stmt->rowCount() === 0) jsonError('Item not found', 404);
    json(['success' => true]);
}

json(['error' => 'Method not allowed'], 405);
