<?php
/**
 * FILE PATH: api/admin/customers.php
 * Customer management.
 * GET  /admin/customers.php           → user list
 * GET  /admin/customers.php?type=admins  → admin list (super admin only)
 * PATCH /admin/customers.php?id=UID  → update tags / status
 * DELETE /admin/customers.php?id=UID → remove user
 * POST /admin/customers.php?action=create_admin → super admin only
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/audit_helper.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

$adminPayload = requireAdmin();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$isSuperAdmin = !empty($adminPayload['is_super_admin']);

// Ensure columns exist
try {
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS tags   JSON        NOT NULL DEFAULT ('[]')");
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'");
} catch (Throwable $e) {}

// ── GET admins list — super admin only ────────────────────────────────────────
if ($method === 'GET' && ($_GET['type'] ?? '') === 'admins') {
    if (!$isSuperAdmin) { http_response_code(403); echo json_encode(['error' => 'Super admin only']); exit; }
    $admins = $db->query("SELECT id, username, email, is_super_admin, otp_enabled, created_at FROM admins ORDER BY created_at ASC")->fetchAll();
    foreach ($admins as &$a) { $a['is_super_admin'] = (bool)$a['is_super_admin']; $a['otp_enabled'] = (bool)$a['otp_enabled']; }
    echo json_encode(['success' => true, 'data' => $admins]); exit;
}

// ── POST: create_admin — super admin only ─────────────────────────────────────
if ($method === 'POST' && $action === 'create_admin') {
    if (!$isSuperAdmin) { http_response_code(403); echo json_encode(['error' => 'Super admin only']); exit; }
    $b        = getBody();
    $username = trim($b['username'] ?? '');
    $password = trim($b['password'] ?? '');
    $email    = trim($b['email']    ?? '');
    if (!$username || !$password) { http_response_code(400); echo json_encode(['error' => 'Username and password required']); exit; }
    if (strlen($password) < 6) { http_response_code(400); echo json_encode(['error' => 'Password min 6 chars']); exit; }
    try {
        $db->prepare("INSERT INTO admins (username, password_hash, email, is_super_admin) VALUES (?,?,?,0)")
           ->execute([$username, password_hash($password, PASSWORD_BCRYPT), $email]);
        $newId = (int)$db->lastInsertId();
        logAudit($db, $adminPayload, 'CREATE_ADMIN', 'admin', "Created admin: $username (id=$newId)");
        echo json_encode(['success' => true, 'id' => $newId]);
    } catch (Throwable $e) {
        http_response_code(409); echo json_encode(['error' => 'Username already exists']);
    }
    exit;
}

// ── DELETE: remove_admin — super admin only ───────────────────────────────────
if ($method === 'DELETE' && ($_GET['type'] ?? '') === 'admin') {
    if (!$isSuperAdmin) { http_response_code(403); echo json_encode(['error' => 'Super admin only']); exit; }
    $adminId = (int)($_GET['id'] ?? 0);
    if (!$adminId) { http_response_code(400); echo json_encode(['error' => 'Admin id required']); exit; }
    // Prevent deleting yourself
    if ($adminId === (int)$adminPayload['admin_id']) { http_response_code(400); echo json_encode(['error' => 'Cannot delete your own account']); exit; }
    $row = $db->prepare("SELECT username FROM admins WHERE id = ?"); $row->execute([$adminId]); $a = $row->fetch();
    if ($a) {
        $db->prepare("DELETE FROM admins WHERE id = ? AND is_super_admin = 0")->execute([$adminId]);
        logAudit($db, $adminPayload, 'DELETE_ADMIN', 'admin', "Deleted admin: {$a['username']} (id=$adminId)");
    }
    echo json_encode(['success' => true]); exit;
}

// ── GET: user list ────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $db->query("
        SELECT
            u.uid                                   AS id,
            u.email                                 AS email,
            u.first_name                            AS firstName,
            u.last_name                             AS lastName,
            u.phone                                 AS phone,
            u.country                               AS country,
            u.avatar                                AS avatar,
            u.email_verified                        AS emailVerified,
            u.referral_code                         AS referralCode,
            u.referred_by                           AS referredBy,
            u.tags                                  AS tags,
            u.status                                AS status,
            u.created_at                            AS createdAt,
            COUNT(o.id)                             AS totalOrders,
            COALESCE(SUM(o.total_amount), 0)        AS totalSpent
        FROM users u
        -- Only successfully paid orders count toward customer activity and spend.
        -- payment_status is authoritative; cancelled, failed, pending, and unpaid
        -- orders must not inflate customer totals.
        LEFT JOIN orders o
          ON o.customer_email = u.email
         AND o.payment_status = 'paid'
        GROUP BY u.uid
        ORDER BY u.created_at DESC
    ");
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($customers as &$c) {
        $c['tags']          = json_decode($c['tags'] ?? '[]', true) ?: [];
        $c['status']        = $c['status'] ?? 'active';
        $c['totalOrders']   = (int)$c['totalOrders'];
        $c['totalSpent']    = (float)$c['totalSpent'];
        $c['emailVerified'] = (bool)$c['emailVerified'];
    }
    unset($c);
    echo json_encode(['success' => true, 'data' => $customers]); exit;
}

// ── PATCH: update tags / status ───────────────────────────────────────────────
if ($method === 'PATCH') {
    $uid  = trim($_GET['id'] ?? '');
    $body = getBody();
    if (!$uid) { http_response_code(400); echo json_encode(['error' => 'User id required']); exit; }

    $check = $db->prepare("SELECT uid FROM users WHERE uid = ? LIMIT 1");
    $check->execute([$uid]);
    if (!$check->fetch()) { http_response_code(404); echo json_encode(['error' => 'User not found']); exit; }

    $updates = []; $params = [];
    if (isset($body['tags']) && is_array($body['tags'])) {
        $updates[] = 'tags = ?'; $params[] = json_encode(array_values($body['tags']));
    }
    if (isset($body['status']) && in_array($body['status'], ['active','suspended','blocked'], true)) {
        $updates[] = 'status = ?'; $params[] = $body['status'];
    }
    if (empty($updates)) { http_response_code(400); echo json_encode(['error' => 'Nothing to update']); exit; }

    $params[] = $uid;
    $db->prepare("UPDATE users SET " . implode(', ', $updates) . " WHERE uid = ?")->execute($params);
    logAudit($db, $adminPayload, 'UPDATE_CUSTOMER', 'user', "Updated user uid=$uid: " . implode(', ', array_keys($body)));
    echo json_encode(['success' => true]); exit;
}

// ── DELETE: remove user ───────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $uid = trim($_GET['id'] ?? '');
    if (!$uid) { http_response_code(400); echo json_encode(['error' => 'User id required']); exit; }

    $check = $db->prepare("SELECT uid, email FROM users WHERE uid = ? LIMIT 1");
    $check->execute([$uid]); $user = $check->fetch();
    if (!$user) { http_response_code(404); echo json_encode(['error' => 'User not found']); exit; }

    $db->prepare("UPDATE orders SET customer_email = '[deleted]', customer_name = 'Deleted User', customer_phone = '' WHERE customer_email = ?")
       ->execute([$user['email']]);
    $db->prepare("DELETE FROM users WHERE uid = ?")->execute([$uid]);

    logAudit($db, $adminPayload, 'DELETE_CUSTOMER', 'user', "Deleted user uid=$uid email={$user['email']}");
    echo json_encode(['success' => true]); exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
