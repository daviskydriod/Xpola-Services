<?php
/**
 * FILE PATH: api/admin/coupons.php
 * Coupon management — GET / POST / PUT / DELETE
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

requireAdmin();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Ensure coupons table exists
$db->exec("CREATE TABLE IF NOT EXISTS `coupons` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `code`       VARCHAR(50)  NOT NULL UNIQUE,
    `type`       ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
    `value`      DECIMAL(10,2) NOT NULL DEFAULT 0,
    `min_order`  DECIMAL(10,2) DEFAULT NULL,
    `max_uses`   INT           DEFAULT NULL,
    `used_count` INT           NOT NULL DEFAULT 0,
    `expires_at` DATETIME      DEFAULT NULL,
    `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

function couponRow(array $r): array {
    return [
        'id'        => (int)$r['id'],
        'code'      => $r['code'],
        'type'      => $r['type'],
        'value'     => (float)$r['value'],
        'minOrder'  => isset($r['min_order'])  ? (float)$r['min_order']  : null,
        'maxUses'   => isset($r['max_uses'])   ? (int)$r['max_uses']     : null,
        'usedCount' => (int)$r['used_count'],
        'expiresAt' => $r['expires_at'] ?? null,
        'isActive'  => (bool)$r['is_active'],
    ];
}

// ── GET all ───────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $rows = $db->query("SELECT * FROM `coupons` ORDER BY created_at DESC")->fetchAll();
    json(array_map('couponRow', $rows));
}

// ── POST (create) ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $b = getBody();
    $code  = strtoupper(trim($b['code']  ?? ''));
    $type  = in_array($b['type'] ?? '', ['percentage','fixed']) ? $b['type'] : 'percentage';
    $value = (float)($b['value'] ?? 0);
    if (!$code || $value <= 0) jsonError('Code and positive value are required');

    $db->prepare("INSERT INTO `coupons` (code,type,value,min_order,max_uses,expires_at,is_active)
                  VALUES (?,?,?,?,?,?,?)")
       ->execute([
           $code, $type, $value,
           isset($b['minOrder'])  ? (float)$b['minOrder']  : null,
           isset($b['maxUses'])   ? (int)$b['maxUses']     : null,
           isset($b['expiresAt']) ? $b['expiresAt']        : null,
           isset($b['isActive'])  ? (int)(bool)$b['isActive'] : 1,
       ]);

    json(['id' => (int)$db->lastInsertId()], 201);
}

// ── PUT (update) ──────────────────────────────────────────────────────────────
if ($method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('ID required');
    $b = getBody();

    $fields = [];
    $params = [];
    if (isset($b['code']))      { $fields[] = 'code = ?';       $params[] = strtoupper(trim($b['code'])); }
    if (isset($b['type']))      { $fields[] = 'type = ?';       $params[] = $b['type']; }
    if (isset($b['value']))     { $fields[] = 'value = ?';      $params[] = (float)$b['value']; }
    if (array_key_exists('minOrder',  $b)) { $fields[] = 'min_order = ?';  $params[] = $b['minOrder']  !== null ? (float)$b['minOrder']  : null; }
    if (array_key_exists('maxUses',   $b)) { $fields[] = 'max_uses = ?';   $params[] = $b['maxUses']   !== null ? (int)$b['maxUses']     : null; }
    if (array_key_exists('expiresAt', $b)) { $fields[] = 'expires_at = ?'; $params[] = $b['expiresAt'] ?: null; }
    if (isset($b['isActive']))  { $fields[] = 'is_active = ?';  $params[] = (int)(bool)$b['isActive']; }

    if (!$fields) jsonError('Nothing to update');
    $params[] = $id;
    $db->prepare("UPDATE `coupons` SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    json(['success' => true]);
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('ID required');
    $db->prepare("DELETE FROM `coupons` WHERE id = ?")->execute([$id]);
    json(['success' => true]);
}

json(['error' => 'Method not allowed'], 405);
