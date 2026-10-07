<?php
/**
 * api/admin/upload.php
 * Accepts a single image via multipart POST, returns { image_path }
 * Used by the AdminProducts image uploader widget.
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../utils/upload.php';

header('Content-Type: application/json');
set_exception_handler(fn(Throwable $e) => json(['error'=>$e->getMessage()],500));

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error'=>'POST required']); exit;
}

if (empty($_FILES['image']['name'])) {
    http_response_code(400); echo json_encode(['error'=>'No image file received']); exit;
}

try {
    $path = uploadImage($_FILES['image']);
    echo json_encode(['success'=>true,'image_path'=>$path]);
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode(['error'=>$e->getMessage()]);
}
