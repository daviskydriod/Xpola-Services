<?php
/**
 * FILE PATH: api/support.php
 * User-facing support tickets.
 * FIX: Returns both 'messages' and 'replies' keys so frontend chat works.
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/auth.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

$jwt    = requireAuth();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

$db->exec("CREATE TABLE IF NOT EXISTS `support_tickets` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `uid`        VARCHAR(64)  NOT NULL DEFAULT '',
    `email`      VARCHAR(200) NOT NULL DEFAULT '',
    `subject`    VARCHAR(255) NOT NULL DEFAULT '',
    `category`   VARCHAR(100) NOT NULL DEFAULT '',
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
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `category`  VARCHAR(100) NOT NULL DEFAULT ''",
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `reference` VARCHAR(40)  DEFAULT NULL",
] as $sql) { try { $db->exec($sql); } catch (Throwable $e) {} }

if ($method === 'GET') {
    $stmt = $db->prepare("SELECT * FROM `support_tickets` WHERE uid = ? ORDER BY created_at DESC");
    $stmt->execute([$jwt['uid']]);
    $tickets = $stmt->fetchAll();

    foreach ($tickets as &$t) {
        $msgs = $db->prepare("SELECT id, sender, body, created_at FROM `support_messages` WHERE ticket_id = ? ORDER BY created_at ASC");
        $msgs->execute([$t['id']]);
        $rawMsgs = $msgs->fetchAll();
        $t['messages']  = $rawMsgs;
        $t['replies']   = $rawMsgs;
        $t['createdAt'] = $t['created_at'];
        if (!$t['reference']) {
            $t['reference'] = 'TKT-' . str_pad($t['id'], 5, '0', STR_PAD_LEFT);
        }
    }
    unset($t);
    json($tickets);
    exit;
}

if ($method === 'POST') {
    $b    = getBody();
    $body = trim($b['body'] ?? $b['message'] ?? '');
    if (!$body) jsonError('Message body is required');

    if (!empty($_GET['id'])) {
        $ticketId = (int)$_GET['id'];
        $stmt = $db->prepare("SELECT id FROM `support_tickets` WHERE id = ? AND uid = ? LIMIT 1");
        $stmt->execute([$ticketId, $jwt['uid']]);
        if (!$stmt->fetch()) jsonError('Ticket not found', 404);
        $db->prepare("INSERT INTO `support_messages` (ticket_id, sender, body) VALUES (?, 'user', ?)")->execute([$ticketId, $body]);
        $db->prepare("UPDATE `support_tickets` SET status = 'open', updated_at = NOW() WHERE id = ? AND status IN ('resolved','closed')")->execute([$ticketId]);
        json(['success' => true]);
        exit;
    }

    $category = trim($b['category'] ?? '');
    $subject  = trim($b['subject']  ?? '');
    if (!$subject) jsonError('Subject required');

    $uStmt = $db->prepare("SELECT email FROM users WHERE uid = ? LIMIT 1");
    $uStmt->execute([$jwt['uid']]);
    $email = $uStmt->fetchColumn() ?: '';

    $db->prepare("INSERT INTO `support_tickets` (uid, email, category, subject) VALUES (?,?,?,?)")->execute([$jwt['uid'], $email, $category, $subject]);
    $ticketId  = (int)$db->lastInsertId();
    $reference = 'TKT-' . str_pad($ticketId, 5, '0', STR_PAD_LEFT);
    $db->prepare("UPDATE `support_tickets` SET reference = ? WHERE id = ?")->execute([$reference, $ticketId]);
    $db->prepare("INSERT INTO `support_messages` (ticket_id, sender, body) VALUES (?, 'user', ?)")->execute([$ticketId, $body]);

    json(['id' => (string)$ticketId, 'reference' => $reference, 'success' => true], 201);
    exit;
}

json(['error' => 'Method not allowed'], 405);
