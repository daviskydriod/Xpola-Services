# Product import guide

Use `scripts/import-products.php` from the repository root on the PHP/MySQL server. The importer is CLI-only and reads the existing `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, and `DB_PORT` environment variables through `api/config/db.php`.

Run a validation-only import first:

```bash
php scripts/import-products.php --file=scripts/products.example.json --dry-run
```

When the output is correct, run the real import. Add `--create-categories` only when the JSON contains categories that do not already exist in the admin catalogue:

```bash
php scripts/import-products.php --file=/path/to/approved-products.json --create-categories
```

Each product can include `name`, `summary`, `description`, `specifications`, `brand`, `warranty`, `price`, `currency`, `country`, `category`, `category_name`, `image_path`, `images`, `stock_qty`, `featured`, and `tags`. Products are matched by `name` plus `country`, so rerunning an approved file updates the existing product instead of creating a duplicate. The script also refreshes the primary and additional rows in `product_images`.

Images should already be uploaded to the production image storage before import. Use repository-relative or production paths that the existing `productImageUrl()` helper can resolve. Do not put payment credentials or admin passwords in the JSON file.

The backend still keeps Canada marketplace access disabled. Canada products may be prepared in the database, but the public Canada shop and checkout must not be enabled until the payment, delivery, and launch controls are approved together.
