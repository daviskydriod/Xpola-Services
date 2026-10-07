<?php
/**
 * FILE PATH: api/referral.php
 * Auth required. Matches api.ts referralApi exactly.
 *
 * GET /referral.php → { code, stats: { referred, completed, bonusEarned }, referrals: Referral[] }
 *
 * Referral code is deterministic: first 8 chars of uid uppercased.
 * A row is inserted into referrals when a new user signs up with ?ref=CODE.
 * That logic lives in auth.php register.
 *
 * FIX: Consolidated from two tables (referral_codes + referral_uses) to canonical
 *      single `referrals` table matching migrate_database.php.
 *      referral_code is stored on the users table (added by migrate_database.php).
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/auth.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

$jwt    = requireAuth();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    json(['error' => 'Method not allowed'], 405);
}

// ── Canonical schema (matches migrate_database.php) ───────────────────────────
$db->exec("CREATE TABLE IF NOT EXISTS `referrals` (
    `id`             INT           NOT NULL AUTO_INCREMENT,
    `referrer_uid`   VARCHAR(64)   NOT NULL,
    `referred_email` VARCHAR(200)  NOT NULL DEFAULT '',
    `status`         ENUM('pending','completed') NOT NULL DEFAULT 'pending',
    `bonus_earned`   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `created_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_referrer` (`referrer_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$uid = $jwt['uid'];

// ── Ensure this user has a referral code (stored on users.referral_code) ──────
$cStmt = $db->prepare("SELECT referral_code FROM users WHERE uid = ? LIMIT 1");
$cStmt->execute([$uid]);
$code = $cStmt->fetchColumn();

if (!$code) {
    // Generate: first 8 chars of uid uppercased, ensure uniqueness
    $base = strtoupper(substr($uid, 0, 8));
    $candidate = $base;
    $tries = 0;
    while ($tries < 5) {
        $col = $db->prepare("SELECT uid FROM users WHERE referral_code = ? LIMIT 1");
        $col->execute([$candidate]);
        if (!$col->fetchColumn()) break;
        $candidate = strtoupper(bin2hex(random_bytes(4)));
        $tries++;
    }
    $db->prepare("UPDATE users SET referral_code = ? WHERE uid = ?")
       ->execute([$candidate, $uid]);
    $code = $candidate;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
$statsStmt = $db->prepare("
    SELECT
        COUNT(*)                                        AS referred,
        SUM(status = 'completed')                       AS completed,
        COALESCE(SUM(bonus_earned), 0)                 AS bonusEarned
    FROM `referrals`
    WHERE referrer_uid = ?
");
$statsStmt->execute([$uid]);
$stats = $statsStmt->fetch();

// ── Referral list ─────────────────────────────────────────────────────────────
$refStmt = $db->prepare("
    SELECT id, referred_email, status, bonus_earned, created_at
    FROM `referrals`
    WHERE referrer_uid = ?
    ORDER BY created_at DESC
    LIMIT 100
");
$refStmt->execute([$uid]);
$referrals = array_map(fn($r) => [
    'id'            => (string)$r['id'],
    'referredEmail' => $r['referred_email'],
    'status'        => $r['status'],
    'bonusEarned'   => (float)$r['bonus_earned'],
    'createdAt'     => $r['created_at'],
], $refStmt->fetchAll());

json([
    'code' => $code,
    'stats' => [
        'referred'    => (int)$stats['referred'],
        'completed'   => (int)$stats['completed'],
        'bonusEarned' => (float)$stats['bonusEarned'],
    ],
    'referrals' => $referrals,
]);
