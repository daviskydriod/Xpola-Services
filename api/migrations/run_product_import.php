<?php
declare(strict_types=1);

/**
 * Xpola Services one-time browser product importer.
 *
 * Upload to api/migrations/run_product_import.php, open its HTTPS URL, upload
 * a JSON file and run a preview first. Remove this file from production after
 * the approved import has completed.
 */
require_once __DIR__ . '/../config/db.php';

const CONFIRMATION_PHRASE = 'IMPORT-XPOLA-PRODUCTS-20261022';
const MAX_UPLOAD_BYTES = 2097152; // 2 MiB
const MAX_PRODUCTS = 500;

ini_set('session.use_strict_mode', '1');
session_set_cookie_params([
    'httponly' => true,
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    'samesite' => 'Strict',
]);
session_start();

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Robots-Tag: noindex, nofollow, noarchive');

if (empty($_SESSION['product_import_csrf'])) {
    $_SESSION['product_import_csrf'] = bin2hex(random_bytes(32));
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function renderPage(string $title, string $message, string $extra = ''): never
{
    $safeTitle = h($title);
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">';
    echo '<meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<meta name="robots" content="noindex,nofollow,noarchive">';
    echo '<title>' . $safeTitle . '</title>';
    echo '<style>
      *{box-sizing:border-box}body{margin:0;padding:28px 16px;background:#f4f5f7;color:#172033;font-family:Arial,sans-serif;line-height:1.55}
      main{max-width:820px;margin:0 auto;padding:28px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 8px 28px #11182712}
      h1{margin:0 0 16px;font-size:clamp(24px,4vw,32px)}h2{margin:24px 0 8px;font-size:18px}
      .notice{padding:14px 16px;margin:16px 0;border-radius:8px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a}
      .warn{background:#fff7ed;border-color:#fed7aa;color:#9a3412}.success{background:#f0fdf4;border-color:#bbf7d0;color:#166534}.error{background:#fef2f2;border-color:#fecaca;color:#991b1b}
      label{display:block;margin:18px 0 7px;font-weight:700}input[type=text],input[type=password],input[type=file]{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:7px;font-size:16px;background:#fff}
      .check{display:flex;gap:10px;align-items:flex-start;font-weight:400}.check input{margin-top:5px}button{margin-top:20px;padding:13px 18px;border:0;border-radius:7px;background:#dc2626;color:#fff;font-size:15px;font-weight:700;cursor:pointer}button:hover{background:#b91c1c}
      code{padding:2px 5px;border-radius:4px;background:#f1f5f9;overflow-wrap:anywhere}li{margin:6px 0}.small{font-size:13px;color:#475569}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{text-align:left;padding:8px;border-bottom:1px solid #e5e7eb}
    </style></head><body><main><h1>' . $safeTitle . '</h1><section>' . $message . '</section>' . $extra . '</main></body></html>';
    exit;
}

function failPage(string $title, string $message): never
{
    renderPage($title, '<div class="notice error">' . $message . '</div>');
}

function slugify(string $value): string
{
    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    return trim($slug, '-');
}

function textValue(mixed $value): string
{
    if (!is_scalar($value) && $value !== null) {
        throw new RuntimeException('Product fields must be text or simple values.');
    }
    return trim((string)($value ?? ''));
}

function tableExists(PDO $db, string $table): bool
{
    $statement = $db->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?');
    $statement->execute([$table]);
    return (int)$statement->fetchColumn() === 1;
}

function productColumns(PDO $db): array
{
    return $db->query('SHOW COLUMNS FROM products')->fetchAll(PDO::FETCH_COLUMN);
}

$runnerToken = (string)(getenv('PRODUCT_IMPORT_TOKEN') ?: '');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if (strlen($runnerToken) < 32) {
        failPage(
            'Product import runner is not configured',
            'Set a private <code>PRODUCT_IMPORT_TOKEN</code> with at least 32 characters in <code>api/.env</code> before using this page. Do not add the token to the repository or share it in a URL.'
        );
    }
    $csrf = h((string)$_SESSION['product_import_csrf']);
    $phrase = h(CONFIRMATION_PHRASE);
    $form = '<form method="post" enctype="multipart/form-data">'
        . '<input type="hidden" name="csrf" value="' . $csrf . '">'
        . '<label for="products">Products JSON file</label><input id="products" name="products" type="file" accept="application/json,.json" required>'
        . '<p class="small">Maximum file size: 2 MiB. Expected format: a JSON object with a top-level <code>products</code> array.</p>'
        . '<label for="runner_token">Private import token</label><input id="runner_token" name="runner_token" type="password" autocomplete="off" required>'
        . '<label for="confirmation">Confirmation phrase</label><input id="confirmation" name="confirmation" type="text" autocomplete="off" required>'
        . '<p class="small">Type this exact phrase: <code>' . $phrase . '</code></p>'
        . '<label class="check"><input type="checkbox" name="dry_run" value="1" checked><span>Preview only (recommended first). The database transaction will be rolled back.</span></label>'
        . '<label class="check"><input type="checkbox" name="create_categories" value="1"><span>Create categories that do not exist yet. Leave unchecked to require existing categories.</span></label>'
        . '<div class="notice warn"><strong>Production caution:</strong> back up the database first. The import matches products by name and country; matching products will be updated. Do not submit sample/template products unless you intend to add them.</div>'
        . '<button type="submit">Validate and run import</button></form>';
    renderPage('Xpola product import', '<div class="notice">Upload an approved catalogue file. Run a preview first, inspect the results, then run again with preview unchecked to commit.</div>', $form);
}

if (strlen($runnerToken) < 32) {
    failPage('Import runner is not configured', 'The private <code>PRODUCT_IMPORT_TOKEN</code> is missing or too short. No database changes were made.');
}
if (!hash_equals((string)($_SESSION['product_import_csrf'] ?? ''), (string)($_POST['csrf'] ?? ''))) {
    failPage('Request expired', 'The form token is invalid or expired. Reload the page and try again. No database changes were made.');
}
if (!hash_equals($runnerToken, (string)($_POST['runner_token'] ?? ''))) {
    failPage('Import not run', 'The private token did not match. No database changes were made.');
}
if (!hash_equals(CONFIRMATION_PHRASE, (string)($_POST['confirmation'] ?? ''))) {
    failPage('Import not run', 'The confirmation phrase did not match. No database changes were made.');
}
if (!isset($_FILES['products']) || !is_array($_FILES['products'])) {
    failPage('Import not run', 'Choose a JSON file to upload. No database changes were made.');
}
$file = $_FILES['products'];
if ((int)($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    failPage('Upload failed', 'The file upload did not complete successfully. Check the file size and try again. No database changes were made.');
}
if ((int)($file['size'] ?? 0) < 1 || (int)$file['size'] > MAX_UPLOAD_BYTES || !is_uploaded_file((string)$file['tmp_name'])) {
    failPage('Invalid upload', 'The upload must be a non-empty JSON file no larger than 2 MiB. No database changes were made.');
}

try {
    $rawJson = file_get_contents((string)$file['tmp_name']);
    if ($rawJson === false) {
        throw new RuntimeException('The uploaded file could not be read.');
    }
    $payload = json_decode($rawJson, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($payload) || !isset($payload['products']) || !is_array($payload['products']) || count($payload['products']) < 1) {
        throw new RuntimeException('The JSON must contain a non-empty top-level products array.');
    }
    if (count($payload['products']) > MAX_PRODUCTS) {
        throw new RuntimeException('The file exceeds the maximum of 500 products per import.');
    }
    foreach ($payload['products'] as $index => $item) {
        if (!is_array($item)) {
            throw new RuntimeException('Product #' . ($index + 1) . ' must be a JSON object.');
        }
        $name = textValue($item['name'] ?? '');
        $country = strtoupper(textValue($item['country'] ?? 'NG'));
        $priceRaw = $item['price'] ?? null;
        if ($name === '' || !is_numeric($priceRaw) || (float)$priceRaw <= 0) {
            throw new RuntimeException('Product #' . ($index + 1) . ' needs a name and a price greater than zero.');
        }
        if (!in_array($country, ['NG', 'CA'], true)) {
            throw new RuntimeException('Product ' . h($name) . ' has an unsupported country code.');
        }
        $currency = strtoupper(textValue($item['currency'] ?? ($country === 'CA' ? 'CAD' : 'NGN')));
        if (!in_array($currency, ['NGN', 'CAD', 'USD'], true)) {
            throw new RuntimeException('Product ' . h($name) . ' has an unsupported currency code.');
        }
        if (isset($item['images']) && !is_array($item['images'])) {
            throw new RuntimeException('The images field for ' . h($name) . ' must be an array.');
        }
    }

    $db = getDB();
    if (!tableExists($db, 'products') || !tableExists($db, 'categories')) {
        throw new RuntimeException('The required products or categories table is missing.');
    }
    $requiredColumns = ['name', 'summary', 'description', 'specifications', 'brand', 'warranty', 'price', 'currency', 'country', 'category_id', 'image_path', 'stock_status', 'stock_qty', 'featured', 'tags'];
    $availableColumns = productColumns($db);
    foreach ($requiredColumns as $column) {
        if (!in_array($column, $availableColumns, true)) {
            throw new RuntimeException('The products table is missing a required catalogue field. No schema changes were made.');
        }
    }
    $hasProductImages = tableExists($db, 'product_images');
    if ($hasProductImages) {
        $imageColumns = $db->query('SHOW COLUMNS FROM product_images')->fetchAll(PDO::FETCH_COLUMN);
        $hasProductImages = in_array('product_id', $imageColumns, true) && in_array('image_path', $imageColumns, true) && in_array('sort_order', $imageColumns, true);
    }

    $dryRun = isset($_POST['dry_run']);
    $createCategories = isset($_POST['create_categories']);
    $db->beginTransaction();
    $findCategory = $db->prepare('SELECT id FROM categories WHERE country = ? AND (slug = ? OR name = ?) LIMIT 1');
    $insertCategory = $db->prepare('INSERT INTO categories (name, slug, country, sort_order, description) VALUES (?, ?, ?, ?, ?)');
    $findProduct = $db->prepare('SELECT id, image_path FROM products WHERE country = ? AND name = ? LIMIT 1');
    $insertProduct = $db->prepare('INSERT INTO products (name, summary, description, specifications, brand, warranty, price, currency, country, category_id, image_path, stock_status, stock_qty, featured, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $updateProduct = $db->prepare('UPDATE products SET summary=?, description=?, specifications=?, brand=?, warranty=?, price=?, currency=?, category_id=?, image_path=?, stock_status=?, stock_qty=?, featured=?, tags=?, updated_at=NOW() WHERE id=?');
    $insertImage = $hasProductImages ? $db->prepare('INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)') : null;
    $deleteImages = $hasProductImages ? $db->prepare('DELETE FROM product_images WHERE product_id = ?') : null;

    $created = 0;
    $updated = 0;
    $categoryCount = 0;
    $results = [];
    foreach ($payload['products'] as $index => $item) {
        $name = textValue($item['name'] ?? '');
        $country = strtoupper(textValue($item['country'] ?? 'NG'));
        $price = (float)$item['price'];
        $stockQty = max(0, (int)($item['stock_qty'] ?? 0));
        $currency = strtoupper(textValue($item['currency'] ?? ($country === 'CA' ? 'CAD' : 'NGN')));
        $categoryId = null;
        $category = textValue($item['category'] ?? '');
        if ($category !== '') {
            $findCategory->execute([$country, $category, $category]);
            $categoryRow = $findCategory->fetch(PDO::FETCH_ASSOC);
            if ($categoryRow) {
                $categoryId = (int)$categoryRow['id'];
            } elseif ($createCategories) {
                $categoryName = textValue($item['category_name'] ?? ucwords(str_replace('-', ' ', $category)));
                $insertCategory->execute([$categoryName, slugify($category), $country, 0, null]);
                $categoryId = (int)$db->lastInsertId();
                $categoryCount++;
            } else {
                throw new RuntimeException('Category ' . h($category) . ' for ' . h($name) . ' does not exist. Select category creation or add it in the admin dashboard first.');
            }
        }
        $imagePath = textValue($item['image_path'] ?? ($item['image_url'] ?? ''));
        $imagePath = $imagePath !== '' ? $imagePath : null;
        $findProduct->execute([$country, $name]);
        $existingRow = $findProduct->fetch(PDO::FETCH_ASSOC);
        $existingId = $existingRow['id'] ?? false;
        if ($existingId && !array_key_exists('image_path', $item) && !array_key_exists('image_url', $item)) {
            $imagePath = $existingRow['image_path'] !== null ? (string)$existingRow['image_path'] : null;
        }
        $stockStatus = $stockQty > 0 ? 'in_stock' : 'out_of_stock';
        $values = [
            $name,
            textValue($item['summary'] ?? ''),
            textValue($item['description'] ?? ''),
            textValue($item['specifications'] ?? ''),
            textValue($item['brand'] ?? ''),
            textValue($item['warranty'] ?? ''),
            $price,
            $currency,
            $country,
            $categoryId,
            $imagePath,
            $stockStatus,
            $stockQty,
            !empty($item['featured']) ? 1 : 0,
            textValue($item['tags'] ?? ''),
        ];
        if ($existingId) {
            $updateProduct->execute([...array_slice($values, 1, 7), ...array_slice($values, 9), (int)$existingId]);
            $productId = (int)$existingId;
            $updated++;
            $action = 'UPDATE';
        } else {
            $insertProduct->execute($values);
            $productId = (int)$db->lastInsertId();
            $created++;
            $action = 'CREATE';
        }

        $images = [];
        if ($imagePath !== null) $images[] = $imagePath;
        foreach (($item['images'] ?? []) as $extraImage) {
            $extraImage = textValue($extraImage);
            if ($extraImage !== '' && !in_array($extraImage, $images, true)) $images[] = $extraImage;
        }
        if ($hasProductImages && $images !== []) {
            $deleteImages->execute([$productId]);
            foreach ($images as $sort => $path) $insertImage->execute([$productId, $path, $sort]);
        }
        $results[] = ['action' => $action, 'country' => $country, 'name' => $name];
    }

    if ($dryRun) {
        $db->rollBack();
    } else {
        $db->commit();
    }

    $rows = '';
    foreach ($results as $result) {
        $rows .= '<tr><td>' . h($result['action']) . '</td><td>' . h($result['country']) . '</td><td>' . h($result['name']) . '</td></tr>';
    }
    $mode = $dryRun ? 'Preview complete — no database changes were committed.' : 'Import committed successfully.';
    $noticeClass = $dryRun ? 'notice' : 'notice success';
    $summary = '<div class="' . $noticeClass . '"><strong>' . h($mode) . '</strong><br>Created: ' . $created . ' · Updated: ' . $updated . ' · Categories created: ' . $categoryCount . '</div>';
    $table = '<table><thead><tr><th>Action</th><th>Country</th><th>Product</th></tr></thead><tbody>' . $rows . '</tbody></table>';
    $cleanup = '<div class="notice warn"><strong>Security cleanup:</strong> delete <code>api/migrations/run_product_import.php</code> from the server immediately after the approved import is complete.</div>';
    unset($_SESSION['product_import_csrf']);
    renderPage('Product import results', $summary . $table . $cleanup);
} catch (Throwable $error) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('[Xpola product import] ' . $error->getMessage());
    failPage('Product import failed', 'No changes were committed. Check the server PHP error log for technical details, correct the file or database issue, reload the import page, and try again.');
}
