<?php
/**
 * FILE PATH: api/loyalty.php
 * Auth required. Matches api.ts loyaltyApi exactly.
 *
 * GET /loyalty.php?action=balance → { points, tier }
 * GET /loyalty.php?action=history → LoyaltyTransaction[]
 *
 * Tier thresholds:
 *   Bronze   → 0–499 pts
 *   Silver   → 500–1999 pts
 *   Gold     → 2000–4999 pts
 *   Platinum → 5000+ pts
 *
 * FIX: table renamed loyalty_points → loyalty_transactions to match
 *      migrate_database.php canonical schema.
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/auth.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

$jwt    = requireAuth();
$db     = getDB();
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json(['error' => 'Method not allowed'], 405);
}

// ── Canonical schema (matches migrate_database.php) ───────────────────────────
$db->exec("CREATE TABLE IF NOT EXISTS `loyalty_transactions` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `uid`         VARCHAR(64)   NOT NULL,
    `points`      INT           NOT NULL DEFAULT 0,
    `type`        ENUM('earn','redeem') NOT NULL DEFAULT 'earn',
    `description` VARCHAR(255)  NOT NULL DEFAULT '',
    `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

function getLoyaltyTier(int $points): string {
    return match(true) {
        $points >= 5000 => 'Platinum',
        $points >= 2000 => 'Gold',
        $points >= 500  => 'Silver',
        default         => 'Bronze',
    };
}

// ── Balance ───────────────────────────────────────────────────────────────────
if ($action === 'balance') {
    $stmt = $db->prepare("
        SELECT COALESCE(SUM(CASE WHEN type='earn' THEN points ELSE -points END), 0) AS balance
        FROM `loyalty_transactions`
        WHERE uid = ?
    ");
    $stmt->execute([$jwt['uid']]);
    $balance = (int)$stmt->fetchColumn();

    json(['points' => $balance, 'tier' => getLoyaltyTier($balance)]);
}

// ── History ───────────────────────────────────────────────────────────────────
if ($action === 'history') {
    $stmt = $db->prepare("
        SELECT id, points, type, description, created_at AS createdAt
        FROM `loyalty_transactions`
        WHERE uid = ?
        ORDER BY created_at DESC
        LIMIT 100
    ");
    $stmt->execute([$jwt['uid']]);
    $rows = $stmt->fetchAll();

    $transactions = array_map(fn($r) => [
        'id'          => (string)$r['id'],
        'points'      => (int)$r['points'],
        'type'        => $r['type'],
        'description' => $r['description'],
        'createdAt'   => $r['createdAt'],
    ], $rows);

    json($transactions);
}

json(['error' => 'Unknown action — use balance or history'], 400);
