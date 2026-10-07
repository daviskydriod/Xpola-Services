<?php
/**
 * FILE PATH: api/contact.php
 * Public contact form endpoint — no auth required.
 * Writes into the same support_tickets / support_messages tables
 * used by the authenticated support system, so submissions show up
 * in the admin Comms > Support Tickets panel automatically.
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error' => $e->getMessage()], 500));

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    json(['error' => 'Method not allowed'], 405);
    exit;
}

// Ensure tables exist (same shape as support.php)
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

// Extra columns specific to public contact submissions (name/phone aren't
// captured by the authed support flow since it already knows the user).
foreach ([
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `category`     VARCHAR(100) NOT NULL DEFAULT ''",
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `reference`    VARCHAR(40)  DEFAULT NULL",
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `customer_name` VARCHAR(200) DEFAULT NULL",
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `phone`        VARCHAR(40)  DEFAULT NULL",
    "ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `source`       VARCHAR(40)  DEFAULT 'support'",
] as $sql) { try { $db->exec($sql); } catch (Throwable $e) {} }

$b = getBody();

$firstName = trim($b['firstName'] ?? '');
$lastName  = trim($b['lastName']  ?? '');
$email     = trim($b['email']     ?? '');
$phone     = trim($b['phone']     ?? '');
$service   = trim($b['service']   ?? '');
$message   = trim($b['message']   ?? '');

if (!$firstName || !$lastName) jsonError('Name is required');
if (!$email)                   jsonError('Email is required');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Invalid email address');
if (!$message)                 jsonError('Message is required');

// Basic spam/rate guard: cap submissions per email to 5/hour
$rate = $db->prepare("SELECT COUNT(*) FROM `support_tickets` WHERE email = ? AND source = 'contact_form' AND created_at > (NOW() - INTERVAL 1 HOUR)");
$rate->execute([$email]);
if ((int)$rate->fetchColumn() >= 5) {
    jsonError('Too many submissions. Please try again later.', 429);
}

$customerName = trim("$firstName $lastName");
$subject      = $service ? "Contact Form: $service" : "Contact Form: General Inquiry";

$db->prepare("
    INSERT INTO `support_tickets` (uid, email, category, subject, customer_name, phone, source)
    VALUES ('', ?, 'Contact Form', ?, ?, ?, 'contact_form')
")->execute([$email, $subject, $customerName, $phone]);

$ticketId  = (int)$db->lastInsertId();
$reference = 'TKT-' . str_pad($ticketId, 5, '0', STR_PAD_LEFT);

$db->prepare("UPDATE `support_tickets` SET reference = ? WHERE id = ?")->execute([$reference, $ticketId]);

$db->prepare("
    INSERT INTO `support_messages` (ticket_id, sender, body) VALUES (?, 'user', ?)
")->execute([$ticketId, $message]);

json(['success' => true, 'reference' => $reference], 201);