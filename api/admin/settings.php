<?php
/**
 * FILE PATH: api/admin/settings.php
 * Admin site settings — GET / PUT
 *
 * FIX: site_settings schema normalised.
 *      Column is `key` (not `setting_key`) to match banner.php + migrate_database.php.
 *      Added `updated_at` column.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

requireAdmin();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── Canonical schema (matches migrate_database.php + banner.php) ──────────────
$db->exec("CREATE TABLE IF NOT EXISTS `site_settings` (
    `key`        VARCHAR(100) NOT NULL,
    `value`      TEXT         DEFAULT NULL,
    `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Seed defaults if empty
$db->exec("INSERT IGNORE INTO `site_settings` (`key`, `value`) VALUES
    ('maintenance_enabled',        '0'),
    ('maintenance_message',        'We are performing scheduled maintenance. Be right back!'),
    ('maintenance_estimated_back', ''),
    ('maintenance_scheduled_at',   ''),
    ('site_name',                  'Xpola Services'),
    ('support_email',              'support@xpolaservices.com'),
    ('support_phone',              ''),
    ('nigeria_tax_rate',           '0'),
    ('canada_tax_rate',            '0')
");

if ($method === 'GET') {
    $stmt = $db->query("SELECT `key`, `value` FROM `site_settings`");
    $raw  = $stmt->fetchAll();

    // Build defaults first, then overlay DB values
    $settings = [
        'siteName'        => 'Xpola Services',
        'supportEmail'    => 'support@xpolaservices.com',
        'supportPhone'    => '',
        'maintenanceMode' => false,
        'nigeriaTaxRate'  => 0,
        'canadaTaxRate'   => 0,
    ];

    foreach ($raw as $row) {
        $val = json_decode($row['value'], true);
        $settings[$row['key']] = ($val !== null) ? $val : $row['value'];
    }

    // Key remaps for frontend compatibility
    $settings['maintenanceMode'] = (bool)($settings['maintenance_enabled'] ?? $settings['maintenanceMode']);
    $settings['siteName']        = $settings['site_name']        ?? $settings['siteName'];
    $settings['supportEmail']    = $settings['support_email']    ?? $settings['supportEmail'];
    $settings['supportPhone']    = $settings['support_phone']    ?? $settings['supportPhone'];
    $settings['nigeriaTaxRate']  = (float)($settings['nigeria_tax_rate'] ?? $settings['nigeriaTaxRate']);
    $settings['canadaTaxRate']   = (float)($settings['canada_tax_rate']  ?? $settings['canadaTaxRate']);

    json($settings);
}

if ($method === 'PUT') {
    $body = getBody();

    foreach ($body as $key => $value) {
        $valStr = is_array($value) || is_bool($value) ? json_encode($value) : (string)$value;
        $db->prepare("INSERT INTO `site_settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?")
           ->execute([$key, $valStr, $valStr]);
    }

    json(['success' => true]);
}

json(['error' => 'Method not allowed'], 405);
