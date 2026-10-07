<?php
/**
 * FILE PATH: api/admin/login.php
 * Admin login with optional OTP (TOTP via 6-digit code emailed).
 *
 * POST /admin/login.php
 *   { username, password }
 *   → If otp_enabled=0: returns { success, token, username, isSuperAdmin }
 *   → If otp_enabled=1: returns { success: false, otpRequired: true, tempToken }
 *
 * POST /admin/login.php?action=verify_otp
 *   { tempToken, otp }
 *   → Returns { success, token, username, isSuperAdmin }
 *
 * POST /admin/login.php?action=change_password
 *   { currentPassword, newPassword }   (requires Bearer admin token)
 *   → Returns { success }
 *
 * POST /admin/login.php?action=toggle_otp
 *   { enabled }   (requires Bearer admin token)
 *   → Returns { success }
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/audit_helper.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

$db     = getDB();
$action = $_GET['action'] ?? '';
$b      = getBody();

// ── Ensure admins table has all required columns ──────────────────────────────
$db->exec("CREATE TABLE IF NOT EXISTS `admins` (
    `id`              INT          NOT NULL AUTO_INCREMENT,
    `username`        VARCHAR(80)  NOT NULL UNIQUE,
    `password_hash`   VARCHAR(255) NOT NULL,
    `email`           VARCHAR(200) DEFAULT NULL,
    `is_super_admin`  TINYINT(1)   NOT NULL DEFAULT 0,
    `otp_code`        VARCHAR(10)  DEFAULT NULL,
    `otp_expires`     DATETIME     DEFAULT NULL,
    `otp_enabled`     TINYINT(1)   NOT NULL DEFAULT 0,
    `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

foreach ([
    "ALTER TABLE `admins` ADD COLUMN IF NOT EXISTS `is_super_admin` TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE `admins` ADD COLUMN IF NOT EXISTS `otp_code`       VARCHAR(10) DEFAULT NULL",
    "ALTER TABLE `admins` ADD COLUMN IF NOT EXISTS `otp_expires`    DATETIME    DEFAULT NULL",
    "ALTER TABLE `admins` ADD COLUMN IF NOT EXISTS `otp_enabled`    TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE `admins` ADD COLUMN IF NOT EXISTS `email`          VARCHAR(200) DEFAULT NULL",
] as $sql) {
    try { $db->exec($sql); } catch (Throwable $ignored) {}
}

// ── Helper: issue a full admin JWT ────────────────────────────────────────────
function issueAdminToken(array $admin): string {
    return generateToken([
        'admin_id'      => $admin['id'],
        'username'      => $admin['username'],
        'is_super_admin'=> (bool)$admin['is_super_admin'],
    ]);
}

// ── Helper: send OTP email ────────────────────────────────────────────────────
function sendAdminOtp(PDO $db, array $admin, string $otp): void {
    if (empty($admin['email'])) return;
    require_once __DIR__ . '/../config/mail.php';
    $html = "<p>Hi <strong>{$admin['username']}</strong>,</p>
             <p>Your Xpola admin login OTP is:</p>
             <h2 style='letter-spacing:8px;color:#E02020;'>{$otp}</h2>
             <p>This code expires in 10 minutes. Do not share it.</p>";
    sendMail($admin['email'], 'Admin OTP — Xpola Services', $html);
}

// ── action=verify_otp ─────────────────────────────────────────────────────────
if ($action === 'verify_otp') {
    $tempToken = trim($b['tempToken'] ?? '');
    $otp       = trim($b['otp']       ?? '');
    if (!$tempToken || !$otp) { http_response_code(400); echo json_encode(['error' => 'tempToken and otp required']); exit; }

    $payload = verifyToken($tempToken);
    if (!$payload || empty($payload['otp_pending_admin_id'])) {
        http_response_code(401); echo json_encode(['error' => 'Invalid or expired temp token']); exit;
    }

    $stmt = $db->prepare("SELECT * FROM admins WHERE id = ? LIMIT 1");
    $stmt->execute([$payload['otp_pending_admin_id']]);
    $admin = $stmt->fetch();
    if (!$admin) { http_response_code(401); echo json_encode(['error' => 'Admin not found']); exit; }

    if ($admin['otp_code'] !== $otp || strtotime($admin['otp_expires']) < time()) {
        http_response_code(401); echo json_encode(['error' => 'Invalid or expired OTP']); exit;
    }

    // Clear OTP
    $db->prepare("UPDATE admins SET otp_code = NULL, otp_expires = NULL WHERE id = ?")->execute([$admin['id']]);

    logAudit($db, ['admin_id' => $admin['id']], 'LOGIN_OTP', 'admin', 'Admin completed OTP verification');
    echo json_encode([
        'success'      => true,
        'token'        => issueAdminToken($admin),
        'username'     => $admin['username'],
        'isSuperAdmin' => (bool)$admin['is_super_admin'],
    ]);
    exit;
}

// ── action=change_password ────────────────────────────────────────────────────
if ($action === 'change_password') {
    $adminPayload = requireAdmin();
    $current  = trim($b['currentPassword'] ?? '');
    $newPass  = trim($b['newPassword']     ?? '');
    if (!$current || !$newPass) { http_response_code(400); echo json_encode(['error' => 'currentPassword and newPassword required']); exit; }
    if (strlen($newPass) < 6) { http_response_code(400); echo json_encode(['error' => 'Password must be at least 6 characters']); exit; }

    $stmt = $db->prepare("SELECT * FROM admins WHERE id = ? LIMIT 1");
    $stmt->execute([$adminPayload['admin_id']]);
    $admin = $stmt->fetch();
    if (!$admin || !password_verify($current, $admin['password_hash'])) {
        http_response_code(401); echo json_encode(['error' => 'Current password is incorrect']); exit;
    }

    $db->prepare("UPDATE admins SET password_hash = ? WHERE id = ?")
       ->execute([password_hash($newPass, PASSWORD_BCRYPT), $admin['id']]);

    echo json_encode(['success' => true]);
    exit;
}

// ── action=toggle_otp ─────────────────────────────────────────────────────────
if ($action === 'toggle_otp') {
    $adminPayload = requireAdmin();
    $enabled = isset($b['enabled']) ? (int)(bool)$b['enabled'] : 0;
    $db->prepare("UPDATE admins SET otp_enabled = ? WHERE id = ?")->execute([$enabled, $adminPayload['admin_id']]);
    echo json_encode(['success' => true, 'otp_enabled' => (bool)$enabled]);
    exit;
}

// ── Primary login ─────────────────────────────────────────────────────────────
$username = trim($b['username'] ?? '');
$password = trim($b['password'] ?? '');
if (!$username || !$password) { http_response_code(400); echo json_encode(['error' => 'Username and password required']); exit; }

$stmt = $db->prepare("SELECT * FROM admins WHERE username = ? LIMIT 1");
$stmt->execute([$username]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, $admin['password_hash'])) {
    http_response_code(401); echo json_encode(['error' => 'Invalid credentials']); exit;
}

logAudit($db, ['admin_id' => $admin['id']], 'LOGIN', 'admin', 'Admin signed in');

// If OTP is enabled, issue a short-lived temp token and send code
if (!empty($admin['otp_enabled'])) {
    $otp     = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expires = date('Y-m-d H:i:s', time() + 600); // 10 min

    $db->prepare("UPDATE admins SET otp_code = ?, otp_expires = ? WHERE id = ?")
       ->execute([$otp, $expires, $admin['id']]);

    try { sendAdminOtp($db, $admin, $otp); } catch (Throwable $ignored) {}

    $tempToken = generateToken([
        'otp_pending_admin_id' => $admin['id'],
        'exp' => time() + 600,
    ]);

    echo json_encode(['success' => false, 'otpRequired' => true, 'tempToken' => $tempToken]);
    exit;
}

echo json_encode([
    'success'      => true,
    'token'        => issueAdminToken($admin),
    'username'     => $admin['username'],
    'isSuperAdmin' => (bool)$admin['is_super_admin'],
]);
