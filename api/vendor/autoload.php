<?php
/**
 * Manual autoloader for PHPMailer (no Composer required).
 *
 * Upload your 3 PHPMailer files to:
 *   api/vendor/phpmailer/phpmailer/src/Exception.php
 *   api/vendor/phpmailer/phpmailer/src/PHPMailer.php
 *   api/vendor/phpmailer/phpmailer/src/SMTP.php
 */

$phpmailerSrc = __DIR__ . '/phpmailer/phpmailer/src';

foreach (['Exception', 'PHPMailer', 'SMTP'] as $class) {
    $file = $phpmailerSrc . '/' . $class . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
}
