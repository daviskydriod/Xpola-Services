# Xpola Services — Client Feedback Report

**Prepared:** 11 October 2026

## Summary

The original review identified 16 areas for improvement on the Nigeria shop. These improvements have now been completed.

The shop is clearer, easier to use, and better prepared for customers. The products currently shown are sample products for demonstration. The owner has not yet supplied the final approved product list.

Authorised staff can manage the products from the private Staff Portal. They can add, edit, organise, filter, and remove products when the approved product list is ready.

## What has been improved

| No. | Review point | What has been improved |
|---:|---|---|
| 1 | Location message | The message is smaller, easier to read, and can be closed. The choice is remembered. |
| 2 | Duplicate categories | The same category cannot be added twice. |
| 3 | Empty categories | Categories without products are hidden, and product numbers update when customers use filters. |
| 4 | Product names and categories | The sample product names and categories have been corrected and made more consistent. |
| 5 | Sort menu | The Sort By menu is easy to read and clearly shows that it can be opened. |
| 6 | Shop banner and filters | The shop banner works better on phones, and filters can be opened or hidden when needed. |
| 7 | Country flags | The country flags now look consistent on different phones and computers. |
| 8 | Product information | Products can show photos, descriptions, details, brand, warranty, stock information, and an Add to Cart button. |
| 9 | Delivery and payment information | Customers can see useful delivery and payment information before completing an order. |
| 10 | Search wording and visibility | The wording that Google and shared links can read has been improved for the Nigeria shop and product pages. |
| 11 | Newsletter sign-up | Customers receive feedback after signing up, and staff can be notified of new subscribers. |
| 12 | Quick product preview | Customers can quickly preview a product on both phones and computers. |
| 13 | Product editing | Staff can add descriptions, specifications, summaries, photos, prices, stock, and categories. |
| 14 | Guest checkout | Customers can place an order without creating an account first. |
| 15 | Cart protection | Items remain in the cart when a customer creates an account or signs in. |
| 16 | Delivery fee timing | The delivery fee is shown at the final order review, after delivery details are entered. |

## What Google sees

The wording shown to Google has been reviewed and improved. The Nigeria shop and product pages now have clear page titles and short descriptions that explain what each page is about before someone clicks the result.

Examples include:

- **Nigeria Shop | Xpola Services** — explains that customers can view products, stock information, delivery options, and payment information.
- **iPhone 18 Pro Max | Xpola Nigeria** — explains that customers can view product details, availability, and ordering information.
- **10-Inch Bolts | Xpola Nigeria** — explains that customers can view product details, availability, and ordering information.
- **EcoFlow Solar Generator | Xpola Nigeria** — explains that customers can view product details, availability, and ordering information.

This gives Google and customers clearer information about the shop and product pages. Google still decides when pages appear in search results, so indexing and ranking may take time after the updated site is published.

The same type of clear wording has now been added to the main Nigeria and Canada pages, including the home, About, Services, Contact, and individual service pages. This means visitors and search engines can understand the purpose of each page more easily.

## Staff and sample products

The private area is called the **Staff Portal** so it is clear that staff handle the everyday shop work. The owner does not need to add the sample products personally.

Staff can:

- Add new products.
- Change names, prices, descriptions, photos, and stock information.
- Choose the correct category.
- Search and filter the product list.
- Remove sample products when the final product list is available.
- Manage orders, stock alerts, categories, notifications, and newsletter subscribers.

The public shop clearly explains that the current products are samples. This prevents customers from thinking that the sample list is the final approved catalogue.

## Catalogue status

The shop can remain in **Sample Catalogue** mode while the current products are being used for demonstration and testing.

When the owner has approved the final product list and it has been added to the shop, the owner or super-admin can change the shop to **Live Catalogue** mode. The sample notice will then no longer be shown to customers.

The owner remains responsible for approving the final product list and deciding when the shop should change from sample products to the approved catalogue.

## Newsletter subscriber list

A Newsletter section has been added to the Staff Portal. Staff can now:

- See all newsletter subscribers.
- See each subscriber’s email address, country, sign-up status, and sign-up date.
- Refresh the list when new people subscribe.
- Download the list as a spreadsheet for authorised business use.

The subscriber list contains personal contact information and should only be shared with authorised staff.

## Owner and staff responsibilities

The Staff Portal wording does not remove the owner’s access or control. The owner keeps full access through the super-admin account.

| User | Main responsibility |
|---|---|
| **Owner / Super Admin** | Final approvals, staff management, security, catalogue decisions, and overall business control. |
| **Authorised Staff** | Everyday product, order, stock, category, notification, and newsletter work. |

Staff help operate the shop every day, while the owner remains in control and can review or change anything when needed.

## What happens next

1. Staff should continue reviewing the sample products.
2. The owner should provide and approve the final product list, including names, categories, photos, prices, stock, and descriptions.
3. The shop should remain in Sample Catalogue mode until the approved products are ready.
4. Before launch, test the shop, filters, product pages, cart, checkout, payment process, Staff Portal, product updates, categories, newsletter list, spreadsheet download, and search-page wording.
5. After approval and testing, the owner or super-admin can change the shop to Live Catalogue mode.

## Final note

The 16 points from the original Nigeria shop review have been addressed. The latest update also makes the staff responsibilities clear, identifies the products as samples, improves the wording Google can read, adds the newsletter subscriber list, and gives the owner control over when the approved catalogue becomes live.


## Product Card and Detail Page Follow-up

The product cards have been reorganised so they are easier to scan. Long descriptions are shortened on the cards, while the full information remains on each product page. Customers can open a product by selecting its picture, name, or **View details** link. The cards now line up more consistently on computer and phone screens.

The product detail pages have also been corrected so a product link opens the matching item instead of failing to load.

The search-page check found 24 pages listed in the sitemap. The search instructions allow pages to be visited and point to that sitemap. In the FTP update, each listed page also has a readable heading and page text available immediately, including the shop and individual product pages.

**Live-site status:** The updated files are prepared in the FTP package but have not been uploaded to the live hosting account. The live site will show these changes only after the upload is completed. This follow-up does not require a new database migration.


### Product card layout

The cards now follow a familiar shopping layout: product photo first, a short name, easy-to-spot price, customer rating, a brief summary, stock status, and a clear Add to Cart button. Xpola's red brand colour is retained. No sale price or discount is displayed unless the catalogue provides one.


### Mobile header

On phones, the country flag switch is now available directly in the top navigation. The light/dark toggle is hidden on small screens to reduce crowding, and the duplicate country controls have been removed from the expanded menu.


### Product photos

Product photos now fit fully inside the product cards, quick view, product detail gallery, and image thumbnails. This helps customers see the whole item rather than having its edges cropped.


## Latest follow-up: stock limits and shop hero images

Customers are now limited to the available quantity staff enter for each product. The product card, product detail quantity control, cart, and order-creation API all enforce the same limit. When an order is started, tracked units are reserved so another checkout cannot take the same stock. If an unpaid order is cancelled, its reserved units are returned; a confirmed payment keeps the units deducted.

Staff can set **Available Quantity** in Staff Portal → Products. Existing products with a blank quantity remain in the old untracked mode so their stock was not guessed or changed automatically. **To activate the quantity gate for the current catalogue, staff must enter the real available count for each product.**

The Nigeria and Canada shop hero carousels now use locally bundled Unsplash cover photos. This replaces the broken `/assets/...` image paths, avoids remote image hotlinks at page load, and gives the hero a visible warehouse, container-yard, and port image rather than a blank banner. Source notes are in `docs/unsplash-shop-hero-images.md`.

**Release status:** The refreshed frontend and PHP files are prepared in the new FTP packages; they have not been uploaded to the live hosting account. Upload the frontend ZIP contents to the website root and the three updated PHP endpoints to their matching `api/` paths. The APIs add the two nullable inventory columns automatically on first use; no manual SQL is required if the hosting database user has the existing schema-change permission.
