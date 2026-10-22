# Browser-Based Product Import

This is a one-time PHP page that imports approved products into the existing Xpola database. It follows the browser-run migration pattern: upload a JSON file, preview changes, confirm, and remove the runner after use.

## Before you begin

- Back up the production database.
- Confirm the hosting account has PHP with PDO MySQL enabled and that the existing `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, and `DB_PORT` settings connect to the correct database.
- Prepare a product JSON file using [`products.example.json`](../scripts/products.example.json) as a template. Replace the sample product names, prices, stock, category slugs, and image paths before importing real data.
- Upload product images to the production image storage first. The JSON should use paths the storefront's `productImageUrl()` helper can resolve.

## Configure the private import token

Generate a long random token on your computer:

```bash
openssl rand -hex 32
```

Add the generated value to the server's `api/.env` file as a new line:

```text
PRODUCT_IMPORT_TOKEN=paste-your-generated-random-token-here
```

Do not commit this token, add it to a public URL, or share it in chat. The browser page requires it in a password field. The runner refuses to proceed if this token is missing or shorter than 32 characters.

## Upload and run

1. Upload `api/migrations/run_product_import.php` to the same relative path on the server. Create the `api/migrations/` directory if needed.
2. Open the script over HTTPS in your browser: `https://YOUR-DOMAIN.com/api/migrations/run_product_import.php`.
3. Choose the prepared `.json` file. Enter the private token and the confirmation phrase shown on the page.
4. Leave **Preview only** checked for the first run. The script opens a database transaction, shows which products would be created or updated, then rolls it back without committing changes.
5. Review the preview. To import, reload the page, choose the same approved JSON, enter the token and phrase again, uncheck **Preview only**, and submit.
6. If a category does not already exist for that country, the import stops unless **Create categories** is checked. Leave it unchecked unless you explicitly want the script to create those categories.
7. Confirm the result page reports that the import committed successfully.

Products are matched by their exact `name` and `country`. A matching product is updated; otherwise a new one is inserted. Use distinct names for distinct products. The script does not create or alter database tables, and wraps product and image changes in a transaction.

## Remove the runner after use

Immediately delete `api/migrations/run_product_import.php` from the production server and remove `PRODUCT_IMPORT_TOKEN` from `api/.env` after the import is complete. The runner is intended to be temporary, not a permanent admin endpoint.

## Product fields

Each object in the top-level `products` array can include `name`, `summary`, `description`, `specifications`, `brand`, `warranty`, `price`, `currency`, `country` (`NG` or `CA`), `category` (existing category slug or name), `category_name` (used only when creating categories), `image_path`, `images`, `stock_qty`, `featured`, and `tags`. Accepted currencies are `NGN`, `CAD`, and `USD`. The upload is limited to 2 MiB and 500 products per run.

Canada shop and checkout access remain disabled in the project configuration. Adding a Canadian product does not enable the Canada storefront.
