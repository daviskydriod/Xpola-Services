<?php
/**
 * Xpola Services product importer (CLI only).
 *
 * Usage:
 *   php scripts/import-products.php --file=scripts/products.example.json --dry-run
 *   php scripts/import-products.php --file=/path/products.json --create-categories
 *
 * The input JSON must contain a "products" array. Each item supports:
 * name, summary, description, specifications, brand, warranty, price, currency,
 * country (NG or CA), category (existing category slug or name), image_path,
 * images (array of paths), stock_qty, featured, tags, and variations.
 *
 * The script is intentionally CLI-only. It uses the existing database config,
 * prepared statements, a transaction, category-country validation, and an
 * idempotent name+country upsert so rerunning a file does not create duplicates.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This importer can only be run from the command line.\n");
    exit(1);
}

require_once __DIR__ . '/../api/config/db.php';

function optionValue(array $options, string $key, ?string $default = null): ?string
{
    return isset($options[$key]) && $options[$key] !== false ? (string)$options[$key] : $default;
}

function fail(string $message): never
{
    fwrite(STDERR, "Error: {$message}\n");
    exit(1);
}

$rawOptions = getopt('', [
    'file:',
    'dry-run',
    'create-categories',
    'help',
]);

if (isset($rawOptions['help']) || !$rawOptions) {
    echo "Usage: php scripts/import-products.php --file=products.json [--dry-run] [--create-categories]\n";
    exit(isset($rawOptions['help']) ? 0 : 1);
}

$file = optionValue($rawOptions, 'file');
if (!$file) fail('Missing --file=/path/to/products.json');
if (!is_file($file) || !is_readable($file)) fail("Cannot read input file: {$file}");

$payload = json_decode((string)file_get_contents($file), true);
if (!is_array($payload) || !isset($payload['products']) || !is_array($payload['products'])) {
    fail('Input must be JSON with a top-level products array.');
}

$allowedCountries = ['NG', 'CA'];
$allowedCurrencies = ['NGN', 'CAD', 'USD'];
$dryRun = isset($rawOptions['dry-run']);
$createCategories = isset($rawOptions['create-categories']);
$db = getDB();

$db->exec("CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency ENUM('NGN','CAD','USD') DEFAULT 'NGN',
    country ENUM('NG','CA') DEFAULT 'NG',
    category_id INT,
    image_path VARCHAR(500),
    stock_status ENUM('in_stock','out_of_stock') DEFAULT 'in_stock',
    stock_qty INT NULL DEFAULT NULL,
    featured TINYINT(1) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    reviews INT DEFAULT 0,
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
$db->exec("CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product_images_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
foreach ([
    'summary VARCHAR(500) DEFAULT NULL',
    'specifications TEXT DEFAULT NULL',
    'brand VARCHAR(120) DEFAULT NULL',
    'warranty VARCHAR(255) DEFAULT NULL',
    'stock_qty INT NULL DEFAULT NULL',
] as $column) {
    try { $db->exec("ALTER TABLE products ADD COLUMN {$column}"); } catch (Throwable $ignored) {}
}

$findCategory = $db->prepare('SELECT id, country FROM categories WHERE country = ? AND (slug = ? OR name = ?) LIMIT 1');
$insertCategory = $db->prepare('INSERT INTO categories (name, slug, country, sort_order, description) VALUES (?, ?, ?, ?, ?)');
$findProduct = $db->prepare('SELECT id FROM products WHERE country = ? AND name = ? LIMIT 1');
$insertProduct = $db->prepare('INSERT INTO products (name, summary, description, specifications, brand, warranty, price, currency, country, category_id, image_path, stock_status, stock_qty, featured, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$updateProduct = $db->prepare('UPDATE products SET summary=?, description=?, specifications=?, brand=?, warranty=?, price=?, currency=?, category_id=?, image_path=?, stock_status=?, stock_qty=?, featured=?, tags=?, updated_at=NOW() WHERE id=?');
$insertImage = $db->prepare('INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)');
$deleteImages = $db->prepare('DELETE FROM product_images WHERE product_id = ?');

$slugify = static function (string $value): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    return trim($value, '-');
};

$normaliseText = static fn($value): string => trim((string)($value ?? ''));
$created = 0;
$updated = 0;
$categoryCount = 0;

try {
    $db->beginTransaction();

    foreach ($payload['products'] as $index => $item) {
        if (!is_array($item)) fail('Product #' . ($index + 1) . ' must be an object.');
        $name = $normaliseText($item['name'] ?? '');
        $country = strtoupper($normaliseText($item['country'] ?? 'NG'));
        $price = (float)($item['price'] ?? 0);
        $stockQty = max(0, (int)($item['stock_qty'] ?? 0));
        if ($name === '' || $price <= 0) fail("Product #" . ($index + 1) . ' needs a name and price greater than zero.');
        if (!in_array($country, $allowedCountries, true)) fail("Product {$name} has invalid country {$country}.");

        $currency = strtoupper($normaliseText($item['currency'] ?? ($country === 'CA' ? 'CAD' : 'NGN')));
        if (!in_array($currency, $allowedCurrencies, true)) fail("Product {$name} has invalid currency {$currency}.");

        $categoryId = null;
        $category = $normaliseText($item['category'] ?? '');
        if ($category !== '') {
            $findCategory->execute([$country, $category, $category]);
            $categoryRow = $findCategory->fetch();
            if ($categoryRow) {
                $categoryId = (int)$categoryRow['id'];
            } elseif ($createCategories) {
                $categoryName = $normaliseText($item['category_name'] ?? ucwords(str_replace('-', ' ', $category)));
                $insertCategory->execute([$categoryName, $slugify($category), $country, 0, null]);
                $categoryId = (int)$db->lastInsertId();
                $categoryCount++;
            } else {
                fail("Category '{$category}' for {$name} does not exist. Use --create-categories or create it in the admin dashboard.");
            }
        }

        $imagePath = $normaliseText($item['image_path'] ?? ($item['image_url'] ?? '')) ?: null;
        $stockStatus = $stockQty > 0 ? 'in_stock' : 'out_of_stock';
        $values = [
            $name,
            $normaliseText($item['summary'] ?? ''),
            $normaliseText($item['description'] ?? ''),
            $normaliseText($item['specifications'] ?? ''),
            $normaliseText($item['brand'] ?? ''),
            $normaliseText($item['warranty'] ?? ''),
            $price,
            $currency,
            $country,
            $categoryId,
            $imagePath,
            $stockStatus,
            $stockQty,
            !empty($item['featured']) ? 1 : 0,
            $normaliseText($item['tags'] ?? ''),
        ];

        $findProduct->execute([$country, $name]);
        $existingId = $findProduct->fetchColumn();
        if ($existingId) {
            $updateProduct->execute([...array_slice($values, 1), (int)$existingId]);
            $productId = (int)$existingId;
            $updated++;
        } else {
            $insertProduct->execute($values);
            $productId = (int)$db->lastInsertId();
            $created++;
        }

        $images = [];
        if ($imagePath) $images[] = $imagePath;
        foreach (($item['images'] ?? []) as $extraImage) {
            $extraImage = $normaliseText($extraImage);
            if ($extraImage !== '' && !in_array($extraImage, $images, true)) $images[] = $extraImage;
        }
        $deleteImages->execute([$productId]);
        foreach ($images as $sort => $path) $insertImage->execute([$productId, $path, $sort]);

        echo sprintf("%s %s — %s %s\n", $existingId ? 'UPDATE' : 'CREATE', $country, $name, $dryRun ? '(dry run)' : '');
    }

    if ($dryRun) $db->rollBack(); else $db->commit();
} catch (Throwable $error) {
    if ($db->inTransaction()) $db->rollBack();
    fail($error->getMessage());
}

echo sprintf("Done. Created: %d, updated: %d, categories created: %d%s\n", $created, $updated, $categoryCount, $dryRun ? ' (no database changes made)' : '');
