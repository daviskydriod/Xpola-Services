<?php
/**
 * FILE PATH: api/admin/support.php
 * Support ticket management — GET all / POST reply
 * FIX: returns 'messages' key (not 'replies') to match frontend
 * UPDATE: surfaces customer_name/phone/source so Contact Form
 *         submissions (which have no uid) still display properly.
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

$db->exec("CREATE TABLE IF NOT EXISTS `support_tickets` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `uid`        VARCHAR(64)  NOT NULL DEFAULT '',
    `email`      VARCHAR(200) NOT NULL DEFAULT '',
    `category`   VARCHAR(100) NOT NULL DEFAULT '',
    `subject`    VARCHAR(255) NOT NULL DEFAULT '',
    `reference`  VARCHAR(40)  DEFAULT NULL,
    `status`     ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_uid`    (`uid`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$db->exec("CREATE TABLE IF NOT EXISTS `support_messages` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id`  INT NOT NULL,
    `sender`     ENUM('user','admin') NOT NULL DEFAULT 'user',
    `body`       TEXT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

foreach ([
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `category`      VARCHAR(100) NOT NULL DEFAULT ''",
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `reference`     VARCHAR(40)  DEFAULT NULL",
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `customer_name` VARCHAR(200) DEFAULT NULL",
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `phone`         VARCHAR(40)  DEFAULT NULL",
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `source`        VARCHAR(40)  DEFAULT 'support'",
] as $sql) { try { $db->exec($sql); } catch (Throwable $e) {} }

// ── GET all tickets ───────────────────────────────────────────────────────────
if ($method === 'GET') {
    $status = trim($_GET['status'] ?? '');
    $w = $status && in_array($status, ['open','in_progress','resolved','closed']) ? "WHERE t.status = '$status'" : '';
    $tickets = $db->query("SELECT t.*, u.first_name, u.last_name FROM `support_tickets` t
                           LEFT JOIN users u ON u.uid = t.uid
                           $w ORDER BY t.created_at DESC")->fetchAll();

    foreach ($tickets as &$t) {
        $msgs = $db->prepare("SELECT id, sender, body, created_at FROM `support_messages` WHERE ticket_id = ? ORDER BY created_at ASC");
        $msgs->execute([$t['id']]);
        $t['messages'] = $msgs->fetchAll(); // ← was 'replies' in old code — fixed to 'messages'
        // Keep 'replies' alias for backward compat
        $t['replies']  = $t['messages'];

        // Prefer the registered-user name; fall back to customer_name
        // captured directly on the ticket (used by the public Contact Form,
        // which has no uid/user row to join against).
        $joinedName = trim(($t['first_name'] ?? '') . ' ' . ($t['last_name'] ?? ''));
        $t['customerName'] = $joinedName !== '' ? $joinedName : ($t['customer_name'] ?? '');
        $t['phone']  = $t['phone']  ?? null;
        $t['source'] = $t['source'] ?? 'support';
    }
    unset($t);

    echo json_encode(['success' => true, 'tickets' => $tickets]);
    exit;
}

// ── POST reply ────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $ticketId = (int)($_GET['id'] ?? 0);
    if (!$ticketId) jsonError('Ticket ID required');

    $b      = getBody();
    $reply  = trim($b['reply']  ?? '');
    $status = trim($b['status'] ?? '');
    if (!$reply) jsonError('Reply body required');

    $db->prepare("INSERT INTO `support_messages` (ticket_id, sender, body) VALUES (?, 'admin', ?)")->execute([$ticketId, $reply]);

    if ($status && in_array($status, ['open','in_progress','resolved','closed'])) {
        $db->prepare("UPDATE `support_tickets` SET status = ?, updated_at = NOW() WHERE id = ?")->execute([$status, $ticketId]);
    } else {
        $db->prepare("UPDATE `support_tickets` SET updated_at = NOW() WHERE id = ?")->execute([$ticketId]);
    }

    logAudit($db, $adminPayload, 'SUPPORT_REPLY', 'ticket', "Replied to ticket id=$ticketId (status=$status)");
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['error' => 'Method not allowed']); http_response_code(405);