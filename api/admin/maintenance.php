<?php
/**
 * FILE PATH: api/admin/maintenance.php
 * Maintenance mode — GET status / POST update
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
header('Content-Type: application/json');
// ── Ensure admin token is valid ───────────────────────────────────────────────
requireAdmin();

$db = getDB();

// ── Ensure settings table exists (safe to call every request) ─────────────────
$db->exec("
    CREATE TABLE IF NOT EXISTS `site_settings` (
      `key`        VARCHAR(100) NOT NULL,
      `value`      TEXT         DEFAULT NULL,
      `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`key`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

// ── Helper: read a setting ────────────────────────────────────────────────────
function getSetting(PDO $db, string $key, string $default = ''): string {
    $st = $db->prepare("SELECT `value` FROM `site_settings` WHERE `key` = ?");
    $st->execute([$key]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    return $row ? (string)$row['value'] : $default;
}

// ── Helper: write a setting ───────────────────────────────────────────────────
function setSetting(PDO $db, string $key, string $value): void {
    $st = $db->prepare("
        INSERT INTO `site_settings` (`key`, `value`)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)
    ");
    $st->execute([$key, $value]);
}

// ════════════════════════════════════════════════════════════════════════════
//  GET  — return current maintenance status
// ════════════════════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $enabled       = getSetting($db, 'maintenance_enabled', '0') === '1';
    $message       = getSetting($db, 'maintenance_message',  'We are performing scheduled maintenance. Be right back!');
    $estimatedBack = getSetting($db, 'maintenance_estimated_back', '');
    $scheduledAt   = getSetting($db, 'maintenance_scheduled_at',   '');

    echo json_encode([
        // Both aliases so the frontend works regardless of which field it reads
        'enabled'        => $enabled,
        'maintenance'    => $enabled,
        'message'        => $message,
        'estimatedBack'  => $estimatedBack  ?: null,
        'estimated_back' => $estimatedBack  ?: null,
        'scheduledAt'    => $scheduledAt    ?: null,
    ]);
    exit;
}

// ════════════════════════════════════════════════════════════════════════════
//  POST — update maintenance status
// ════════════════════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON body']);
        exit;
    }

    $enabled       = isset($body['enabled'])       ? (bool)$body['enabled']          : false;
    $message       = isset($body['message'])       ? trim((string)$body['message'])   : '';
    $estimatedBack = isset($body['estimatedBack']) ? trim((string)$body['estimatedBack']) : '';
    $scheduledAt   = isset($body['scheduledAt'])   ? trim((string)$body['scheduledAt'])   : '';

    if ($message === '') {
        $message = 'We are performing scheduled maintenance. Be right back!';
    }

    setSetting($db, 'maintenance_enabled',        $enabled ? '1' : '0');
    setSetting($db, 'maintenance_message',         $message);
    setSetting($db, 'maintenance_estimated_back',  $estimatedBack);
    setSetting($db, 'maintenance_scheduled_at',    $scheduledAt);

    echo json_encode(['success' => true]);
    exit;
}

// ── Method not allowed ────────────────────────────────────────────────────────
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);