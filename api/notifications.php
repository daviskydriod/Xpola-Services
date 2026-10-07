<?php
/**
 * FILE PATH: api/notifications.php
 * Auth required. Matches api.ts notificationsApi exactly.
 *
 * GET   /notifications.php                        → Notification[]
 * PATCH /notifications.php?id=X                  → mark one read
 * PATCH /notifications.php?action=mark_all_read  → mark all read
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
// id is INT AUTO_INCREMENT (not VARCHAR) — consistent with all other tables
$db->exec("CREATE TABLE IF NOT EXISTS `notifications` (
    `id`         INT          NOT NULL AUTO_INCREMENT,
    `uid`        VARCHAR(64)  NOT NULL,
    `title`      VARCHAR(255) NOT NULL DEFAULT '',
    `body`       TEXT         NOT NULL,
    `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_uid_read` (`uid`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// ── GET — list notifications ──────────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $db->prepare("
        SELECT id, title, body, is_read, created_at
        FROM `notifications`
        WHERE uid = ?
        ORDER BY created_at DESC
        LIMIT 100
    ");
    $stmt->execute([$jwt['uid']]);
    $rows = $stmt->fetchAll();

    $notifications = array_map(fn($r) => [
        'id'        => (string)$r['id'],
        'title'     => $r['title'],
        'message'   => $r['body'],
        'read'      => (bool)$r['is_read'],
        'createdAt' => $r['created_at'],
    ], $rows);

    json($notifications);
}

// ── PATCH — mark read ─────────────────────────────────────────────────────────
if ($method === 'PATCH') {
    $action = $_GET['action'] ?? '';

    // Mark all read
    if ($action === 'mark_all_read') {
        $db->prepare("UPDATE `notifications` SET is_read = 1 WHERE uid = ?")
           ->execute([$jwt['uid']]);
        json(['success' => true]);
    }

    // Mark single read
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('id required');

    $stmt = $db->prepare("UPDATE `notifications` SET is_read = 1 WHERE id = ? AND uid = ?");
    $stmt->execute([$id, $jwt['uid']]);

    if ($stmt->rowCount() === 0) jsonError('Notification not found', 404);
    json(['success' => true]);
}

json(['error' => 'Method not allowed'], 405);
