<?php
/**
 * utils/upload.php
 *
 * FIX: UPLOAD_DIR now correctly resolves to public_html/uploads/products/
 *      (was api/uploads/products/ — unreachable from web)
 *
 * Structure assumed:
 *   public_html/
 *     api/
 *       utils/upload.php   ← this file
 *     uploads/
 *       products/          ← images stored here
 *
 * Accessible at: https://yourdomain.com/uploads/products/filename.jpg
 */

// __DIR__             = public_html/api/utils
// dirname(__DIR__)    = public_html/api
// dirname(dirname(__DIR__)) = public_html   ← correct web root
define('UPLOAD_DIR',     dirname(dirname(__DIR__)) . '/uploads/products/');
define('UPLOAD_URL',     '/uploads/products/');
define('MAX_FILE_BYTES', 5 * 1024 * 1024); // 5 MB
define('ALLOWED_MIME',   ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
define('ALLOWED_EXT',    ['jpg', 'jpeg', 'png', 'webp', 'gif']);

function uploadImage(array $file): string {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $codes = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit.',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds form size limit.',
            UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
            UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Server tmp directory missing.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        ];
        throw new RuntimeException($codes[$file['error']] ?? 'Upload error #' . $file['error']);
    }

    if ($file['size'] > MAX_FILE_BYTES) {
        throw new RuntimeException('File exceeds 5 MB limit.');
    }

    $mime = mime_content_type($file['tmp_name']);
    if (!in_array($mime, ALLOWED_MIME, true)) {
        throw new RuntimeException('Only JPEG, PNG, WebP and GIF images are allowed.');
    }

    $origExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($origExt, ALLOWED_EXT, true)) {
        throw new RuntimeException('Invalid file extension.');
    }

    if (!is_dir(UPLOAD_DIR) && !mkdir(UPLOAD_DIR, 0755, true)) {
        throw new RuntimeException('Could not create upload directory at: ' . UPLOAD_DIR);
    }

    $filename = bin2hex(random_bytes(12)) . '.' . $origExt;
    $dest     = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        throw new RuntimeException('Failed to save uploaded file to: ' . $dest);
    }

    return UPLOAD_URL . $filename;
}

function deleteImage(?string $path): void {
    if (!$path || !str_starts_with($path, '/uploads/')) return;
    // path is relative to web root, so go up from api/
    $full = dirname(dirname(__DIR__)) . $path;
    if (file_exists($full) && is_file($full)) @unlink($full);
}

function imageUrl(?string $path, string $fallback = ''): string {
    if (!$path) return $fallback;
    if (str_starts_with($path, 'http')) return $path;
    $base = rtrim(getenv('APP_URL') ?: '', '/');
    return $base . $path;
}
