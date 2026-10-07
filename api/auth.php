<?php
/**
 * FILE PATH: api/auth.php
 * FIXES vs previous version:
 *  - Referral status: 'failed' (not 'pending') — pending removed from workflow
 *  - Referral URL uses /login?mode=register (register page) not homepage
 *  - Notifications sent to BOTH referrer and new user on successful referral link
 *  - referred_by stored on new user's row
 *  - Receipt: processing → PAID display handled via payment_status column
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/auth.php';
require_once __DIR__ . '/admin/audit_helper.php';

function requireMail(): void {
    static $loaded = false;
    if (!$loaded) { require_once __DIR__ . '/config/mail.php'; $loaded = true; }
}

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

define('XPOLA_LOGO_URL', 'https://xpolaservices.com/assets/logo-black-BzW0SzNp.png');
define('XPOLA_APP_URL',  defined('APP_URL') ? APP_URL : 'https://xpolaservices.com');

$db->exec("CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  uid           VARCHAR(64)  NOT NULL UNIQUE,
  email         VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(80)  NOT NULL DEFAULT '',
  last_name     VARCHAR(80)  NOT NULL DEFAULT '',
  phone         VARCHAR(25)  NOT NULL DEFAULT '',
  country       VARCHAR(5)   NOT NULL DEFAULT 'NG',
  avatar        VARCHAR(500) DEFAULT NULL,
  addresses     JSON         NOT NULL DEFAULT ('[]'),
  reset_token   VARCHAR(128) DEFAULT NULL,
  reset_expires DATETIME     DEFAULT NULL,
  email_verified TINYINT(1)  NOT NULL DEFAULT 0,
  verify_token  VARCHAR(128) DEFAULT NULL,
  referral_code VARCHAR(20)  UNIQUE DEFAULT NULL,
  referred_by   VARCHAR(20)  DEFAULT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'active',
  tags          JSON         NOT NULL DEFAULT ('[]'),
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Add any missing columns safely
foreach ([
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS status      VARCHAR(20) NOT NULL DEFAULT 'active'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS tags        JSON        NOT NULL DEFAULT ('[]')",
] as $sql) { try { $db->exec($sql); } catch (Throwable $e) {} }

// Notifications table
$db->exec("CREATE TABLE IF NOT EXISTS notifications (
    id         INT          NOT NULL AUTO_INCREMENT,
    uid        VARCHAR(64)  NOT NULL,
    type       VARCHAR(80)  NOT NULL DEFAULT 'info',
    title      VARCHAR(255) NOT NULL DEFAULT '',
    message    TEXT         NOT NULL,
    `read`     TINYINT(1)   NOT NULL DEFAULT 0,
    data       JSON         DEFAULT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_uid (uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Referrals table (no 'pending' — only 'failed' or 'completed')
$db->exec("CREATE TABLE IF NOT EXISTS referrals (
    id             INT           NOT NULL AUTO_INCREMENT,
    referrer_uid   VARCHAR(64)   NOT NULL,
    referred_email VARCHAR(200)  NOT NULL DEFAULT '',
    referred_uid   VARCHAR(64)   DEFAULT NULL,
    status         ENUM('completed','failed') NOT NULL DEFAULT 'failed',
    bonus_earned   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_referrer (referrer_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
foreach ([
    "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_uid VARCHAR(64) DEFAULT NULL",
] as $sql) { try { $db->exec($sql); } catch (Throwable $e) {} }

// ── Email template ─────────────────────────────────────────────────────────────
function xpolaEmailTemplate(string $title, string $bodyHtml): string {
    $logo   = XPOLA_LOGO_URL;
    $appUrl = XPOLA_APP_URL;
    return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>{$title}</title></head>
<body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f5f5;padding:32px 16px;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
        <tr><td style='background:#ffffff;padding:28px 40px 20px;border-bottom:3px solid #E02020;text-align:center;'>
          <a href='{$appUrl}'><img src='{$logo}' alt='Xpola Services' width='160' style='display:block;margin:0 auto;max-height:52px;object-fit:contain;' /></a>
        </td></tr>
        <tr><td style='padding:36px 40px 28px;color:#222222;font-size:15px;line-height:1.7;'>
          <h2 style='margin:0 0 20px;font-size:22px;font-weight:700;color:#1a1a2e;'>{$title}</h2>
          {$bodyHtml}
        </td></tr>
        <tr><td style='background:#f9f9f9;padding:20px 40px;border-top:1px solid #eeeeee;text-align:center;'>
          <p style='margin:0 0 6px;font-size:12px;color:#999999;'>© " . date('Y') . " Xpola Services · <a href='{$appUrl}' style='color:#E02020;text-decoration:none;'>xpolaservices.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>";
}

function ctaButton(string $url, string $label, string $color = '#E02020'): string {
    return "<p style='text-align:center;margin:32px 0;'>
      <a href='{$url}' style='background:{$color};color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;display:inline-block;'>{$label}</a>
    </p><p style='text-align:center;color:#888888;font-size:12px;margin-top:-16px;'>
      Or copy: <a href='{$url}' style='color:#E02020;word-break:break-all;'>{$url}</a>
    </p>";
}

function addNotification(PDO $db, string $uid, string $type, string $title, string $message, ?array $data = null): void {
    try {
        $db->prepare("INSERT INTO notifications (uid, type, title, message, data) VALUES (?,?,?,?,?)")
           ->execute([$uid, $type, $title, $message, $data ? json_encode($data) : null]);
    } catch (Throwable $e) {}
}

function profile(array $u): array {
    return [
        'id'            => $u['uid'],
        'uid'           => $u['uid'],
        'email'         => $u['email'],
        'firstName'     => $u['first_name'],
        'lastName'      => $u['last_name'],
        'phone'         => $u['phone'],
        'country'       => $u['country'],
        'avatar'        => $u['avatar'] ?? null,
        'addresses'     => is_string($u['addresses'] ?? null)
                            ? (json_decode($u['addresses'], true) ?: [])
                            : ($u['addresses'] ?? []),
        'emailVerified' => (bool)($u['email_verified'] ?? false),
        'referralCode'  => $u['referral_code'] ?? null,
        'referredBy'    => $u['referred_by'] ?? null,
    ];
}

// ── REGISTER ──────────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'register') {
    $b         = getBody();
    $email     = strtolower(trim($b['email']     ?? ''));
    $password  = trim($b['password']  ?? '');
    $firstName = trim($b['firstName'] ?? '');
    $lastName  = trim($b['lastName']  ?? '');
    $phone     = trim($b['phone']     ?? '');
    $country   = in_array($b['country'] ?? '', ['NG','CA']) ? $b['country'] : 'NG';
    // Referral code can come from POST body or query string
    $refCode   = strtoupper(trim($b['referralCode'] ?? $b['ref'] ?? $_GET['ref'] ?? ''));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Valid email required');
    if (strlen($password) < 8) jsonError('Password must be at least 8 characters');
    if (!$firstName) jsonError('First name required');

    $chk = $db->prepare("SELECT id FROM users WHERE email = ?");
    $chk->execute([$email]);
    if ($chk->fetch()) jsonError('Email already registered', 409);

    $uid  = bin2hex(random_bytes(16));
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // Generate unique referral code
    $myRef = strtoupper(substr($uid, 0, 8));
    for ($tries = 0; $tries < 5; $tries++) {
        $col = $db->prepare("SELECT uid FROM users WHERE referral_code = ? LIMIT 1");
        $col->execute([$myRef]);
        if (!$col->fetchColumn()) break;
        $myRef = strtoupper(bin2hex(random_bytes(4)));
    }

    $verifyTok = bin2hex(random_bytes(32));

    $db->prepare("INSERT INTO users (uid,email,password_hash,first_name,last_name,phone,country,referral_code,referred_by,verify_token,email_verified)
                  VALUES (?,?,?,?,?,?,?,?,?,?,0)")
       ->execute([$uid, $email, $hash, $firstName, $lastName, $phone, $country, $myRef, $refCode ?: null, $verifyTok]);
    logActivity($db, 'user', $uid, trim($firstName . ' ' . $lastName), $email, 'REGISTER', 'account', 'Customer account created');

    // ── Referral tracking ─────────────────────────────────────────────────────
    if ($refCode) {
        try {
            $refUser = $db->prepare("SELECT uid, first_name FROM users WHERE referral_code = ? LIMIT 1");
            $refUser->execute([$refCode]);
            $referrer = $refUser->fetch();
            if ($referrer) {
                $referrerId = $referrer['uid'];
                // Insert referral row with status 'failed' — upgrade to 'completed' on first paid order
                $db->prepare("INSERT IGNORE INTO referrals (referrer_uid, referred_email, referred_uid, status) VALUES (?,?,?,'failed')")
                   ->execute([$referrerId, $email, $uid]);

                // Notification to the referrer
                addNotification($db, $referrerId, 'referral',
                    '🎉 Someone joined via your link!',
                    "$firstName $lastName signed up using your referral link. You'll earn bonus points when they complete their first order.",
                    ['referred_uid' => $uid, 'referred_name' => "$firstName $lastName"]
                );
                // Notification to the new user
                addNotification($db, $uid, 'referral',
                    "👋 You were referred by {$referrer['first_name']}!",
                    "You signed up via {$referrer['first_name']}'s referral link. Complete your first order to activate the referral bonus.",
                    ['referrer_uid' => $referrerId, 'referrer_code' => $refCode]
                );
            }
        } catch (Throwable $e) {
            error_log('[Xpola] Referral insert failed: ' . $e->getMessage());
        }
    }

    // ── Verification email ────────────────────────────────────────────────────
    try {
        requireMail();
        $verifyLink = XPOLA_APP_URL . '/verify-email?token=' . $verifyTok;
        $body = xpolaEmailTemplate('Verify Your Email Address',
            "<p>Hi <strong>{$firstName}</strong>,</p>
             <p>Welcome to Xpola Services! Please verify your email to complete setup.</p>"
            . ctaButton($verifyLink, 'Verify Email Address')
            . "<p style='color:#999999;font-size:12px;'>If you didn't create this account, ignore this email.</p>"
        );
        sendMail($email, 'Verify your Xpola Services account', $body, $firstName);
    } catch (Throwable $e) {
        error_log('[Xpola Auth] Verification email failed: ' . $e->getMessage());
    }

    $token = generateToken(['uid' => $uid, 'email' => $email]);
    json(['token' => $token, 'user' => profile([
        'uid' => $uid, 'email' => $email, 'first_name' => $firstName, 'last_name' => $lastName,
        'phone' => $phone, 'country' => $country, 'avatar' => null, 'addresses' => '[]',
        'email_verified' => 0, 'referral_code' => $myRef, 'referred_by' => $refCode ?: null,
    ])], 201);
}

// ── LOGIN ──────────────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'login') {
    $b = getBody();
    $email    = strtolower(trim($b['email']    ?? ''));
    $password = trim($b['password'] ?? '');
    if (!$email || !$password) jsonError('Email and password required');
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $u = $stmt->fetch();
    if (!$u || !password_verify($password, $u['password_hash'])) jsonError('Invalid email or password', 401);
    logActivity($db, 'user', $u['uid'], trim($u['first_name'] . ' ' . $u['last_name']), $u['email'], 'LOGIN', 'account', 'Customer signed in');
    json(['token' => generateToken(['uid' => $u['uid'], 'email' => $u['email']]), 'user' => profile($u)]);
}

// ── VERIFY EMAIL ───────────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'verify_email') {
    $token = trim($_GET['token'] ?? '');
    if (!$token) jsonError('Token required');
    $stmt = $db->prepare("SELECT id FROM users WHERE verify_token = ? LIMIT 1");
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    if (!$user) jsonError('Invalid or expired token', 400);
    $db->prepare("UPDATE users SET email_verified = 1, verify_token = NULL WHERE verify_token = ?")->execute([$token]);
    json(['success' => true, 'message' => 'Email verified successfully']);
}

// ── GET PROFILE ────────────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'profile') {
    $jwt = requireAuth();
    $stmt = $db->prepare("SELECT * FROM users WHERE uid = ? LIMIT 1");
    $stmt->execute([$jwt['uid']]);
    $u = $stmt->fetch();
    if (!$u) jsonError('User not found', 404);
    json(profile($u));
}

// ── UPDATE PROFILE ─────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'update_profile') {
    $jwt = requireAuth();
    $b   = getBody();
    $fields = []; $params = [];
    if (!empty($b['firstName'])) { $fields[] = 'first_name = ?'; $params[] = htmlspecialchars(trim($b['firstName'])); }
    if (!empty($b['lastName']))  { $fields[] = 'last_name = ?';  $params[] = htmlspecialchars(trim($b['lastName'])); }
    if (!empty($b['phone']))     { $fields[] = 'phone = ?';      $params[] = trim($b['phone']); }
    if (!$fields) jsonError('Nothing to update');
    $params[] = $jwt['uid'];
    $db->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE uid = ?")->execute($params);
    json(['success' => true]);
}

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'change_password') {
    $jwt  = requireAuth();
    $b    = getBody();
    $cur  = trim($b['current'] ?? '');
    $next = trim($b['new']     ?? '');
    if (!$cur || !$next) jsonError('current and new password required');
    if (strlen($next) < 8) jsonError('New password must be at least 8 characters');
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE uid = ? LIMIT 1");
    $stmt->execute([$jwt['uid']]);
    $u = $stmt->fetch();
    if (!$u || !password_verify($cur, $u['password_hash'])) jsonError('Current password is incorrect', 401);
    $db->prepare("UPDATE users SET password_hash = ? WHERE uid = ?")->execute([password_hash($next, PASSWORD_BCRYPT), $jwt['uid']]);
    json(['success' => true]);
}

// ── RESET PASSWORD REQUEST ─────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'reset_password') {
    $b = getBody();
    $email = strtolower(trim($b['email'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Valid email required');
    $stmt = $db->prepare("SELECT uid, first_name FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $u = $stmt->fetch();
    if ($u) {
        $tok = bin2hex(random_bytes(32));
        $exp = date('Y-m-d H:i:s', time() + 3600);
        $db->prepare("UPDATE users SET reset_token = ?, reset_expires = ? WHERE uid = ?")->execute([$tok, $exp, $u['uid']]);
        try {
            requireMail();
            $link = XPOLA_APP_URL . '/login?action=reset&token=' . $tok;
            $body = xpolaEmailTemplate('Reset Your Password',
                "<p>Hi <strong>{$u['first_name']}</strong>,</p><p>Click below to reset your Xpola Services password. This link expires in 1 hour.</p>"
                . ctaButton($link, 'Reset Password')
                . "<p style='color:#999;font-size:12px;'>If you didn't request this, ignore this email.</p>"
            );
            sendMail($email, 'Reset your Xpola Services password', $body, $u['first_name']);
        } catch (Throwable $e) {}
    }
    json(['success' => true, 'message' => 'If this email exists, a reset link was sent.']);
}

// ── CONFIRM PASSWORD RESET ─────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'confirm_reset') {
    $b     = getBody();
    $tok   = trim($b['token']    ?? '');
    $pass  = trim($b['password'] ?? '');
    if (!$tok || !$pass) jsonError('Token and password required');
    if (strlen($pass) < 8) jsonError('Password must be at least 8 characters');
    $stmt = $db->prepare("SELECT uid FROM users WHERE reset_token = ? AND reset_expires > NOW() LIMIT 1");
    $stmt->execute([$tok]);
    $u = $stmt->fetch();
    if (!$u) jsonError('Invalid or expired reset token', 400);
    $db->prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE uid = ?")
       ->execute([password_hash($pass, PASSWORD_BCRYPT), $u['uid']]);
    json(['success' => true]);
}

// ── ADDRESS CRUD ───────────────────────────────────────────────────────────────
if (in_array($method, ['POST','PUT','DELETE']) && str_starts_with($action, 'address')) {
    $jwt = requireAuth();
    $stmt = $db->prepare("SELECT addresses FROM users WHERE uid = ? LIMIT 1");
    $stmt->execute([$jwt['uid']]);
    $u = $stmt->fetch();
    $addrs = json_decode($u['addresses'] ?? '[]', true) ?: [];

    if ($action === 'add_address') {
        $b  = getBody();
        $id = bin2hex(random_bytes(8));
        if (!empty($b['isDefault'])) foreach ($addrs as &$a) $a['isDefault'] = false;
        $addrs[] = array_merge($b, ['id' => $id]);
        $db->prepare("UPDATE users SET addresses = ? WHERE uid = ?")->execute([json_encode($addrs), $jwt['uid']]);
        json(['id' => $id], 201);
    }
    if ($action === 'update_address') {
        $id  = $_GET['id'] ?? '';
        $b   = getBody();
        if (!empty($b['isDefault'])) foreach ($addrs as &$a) $a['isDefault'] = false;
        foreach ($addrs as &$a) if ($a['id'] === $id) { $a = array_merge($a, $b); break; }
        unset($a);
        $db->prepare("UPDATE users SET addresses = ? WHERE uid = ?")->execute([json_encode($addrs), $jwt['uid']]);
        json(['success' => true]);
    }
    if ($action === 'delete_address') {
        $id    = $_GET['id'] ?? '';
        $addrs = array_values(array_filter($addrs, fn($a) => $a['id'] !== $id));
        $db->prepare("UPDATE users SET addresses = ? WHERE uid = ?")->execute([json_encode($addrs), $jwt['uid']]);
        json(['success' => true]);
    }
    if ($action === 'set_default_address') {
        $id = $_GET['id'] ?? '';
        foreach ($addrs as &$a) $a['isDefault'] = ($a['id'] === $id);
        unset($a);
        $db->prepare("UPDATE users SET addresses = ? WHERE uid = ?")->execute([json_encode($addrs), $jwt['uid']]);
        json(['success' => true]);
    }
}

// ── UPLOAD AVATAR ──────────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'upload_avatar') {
    $jwt = requireAuth();
    require_once __DIR__ . '/utils/upload.php';
    if (empty($_FILES['avatar']['name'])) jsonError('No file uploaded');
    try { $path = uploadImage($_FILES['avatar']); }
    catch (RuntimeException $e) { jsonError($e->getMessage(), 400); }
    $db->prepare("UPDATE users SET avatar = ? WHERE uid = ?")->execute([$path, $jwt['uid']]);
    json(['url' => $path]);
}

// ── DELETE ACCOUNT ─────────────────────────────────────────────────────────────
if ($method === 'DELETE' && $action === 'delete_account') {
    $jwt  = requireAuth();
    $b    = getBody();
    $pass = trim($b['password'] ?? '');
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE uid = ? LIMIT 1");
    $stmt->execute([$jwt['uid']]);
    $u = $stmt->fetch();
    if (!$u || !password_verify($pass, $u['password_hash'])) jsonError('Incorrect password', 401);
    $db->prepare("DELETE FROM users WHERE uid = ?")->execute([$jwt['uid']]);
    json(['success' => true]);
}

jsonError('Not found', 404);
