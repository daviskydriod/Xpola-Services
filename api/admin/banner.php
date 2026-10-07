<?php
/**
 * FILE PATH: api/admin/banner.php
 * Announcement banner — GET / POST / DELETE
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

requireAdmin();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Ensure site_settings table exists
$db->exec("CREATE TABLE IF NOT EXISTS `site_settings` (
    `key`        VARCHAR(100) NOT NULL,
    `value`      TEXT         DEFAULT NULL,
    `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

function getBannerRow(PDO $db): ?array {
    $st = $db->prepare("SELECT `value` FROM `site_settings` WHERE `key` = 'announcement_banner'");
    $st->execute();
    $row = $st->fetch();
    if (!$row || !$row['value']) return null;
    return json_decode($row['value'], true) ?: null;
}

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $banner = getBannerRow($db);
    json($banner ?? []);
}

// ── POST (create / update) ────────────────────────────────────────────────────
if ($method === 'POST') {
    $b = getBody();
    if (empty($b['text'])) jsonError('Banner text is required');

    $banner = [
        'text'      => trim($b['text']),
        'link'      => trim($b['link']      ?? ''),
        'bgColor'   => trim($b['bgColor']   ?? '#1d4ed8'),
        'isActive'  => (bool)($b['isActive'] ?? true),
        'expiresAt' => trim($b['expiresAt'] ?? '') ?: null,
    ];

    $db->prepare("INSERT INTO `site_settings` (`key`, `value`) VALUES ('announcement_banner', ?)
                  ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)")
       ->execute([json_encode($banner)]);

    json(['success' => true]);
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $db->prepare("DELETE FROM `site_settings` WHERE `key` = 'announcement_banner'")->execute();
    json(['success' => true]);
}

json(['error' => 'Method not allowed'], 405);
