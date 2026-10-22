# Market image integration plan

## Supplied image set

The `src/assets/New Images and Videos Update/` folder contains sixteen JPEG product photos and one MP4 video. The photos show a single power/inverter product line in factory, warehouse, front, rear, side, top, and accessory views. The files now use descriptive, URL-safe names, and `asset-manifest.json` records every file's role, dimensions, market usage, caption, and recommended accessibility text.

The asset filenames are maintained in lowercase kebab-case so imports and generated URLs remain readable and maintainable. The manifest should be updated whenever the client supplies additional views or a replacement video.

## Recommended approach for both market pages

Use one reusable `MarketMediaSection` component driven by market data rather than duplicating image markup in the Canada and Nigeria pages. The component should support:

1. A responsive feature banner using a wide factory/warehouse image, with a dark overlay, a short market-specific caption, and a link to the relevant service or enquiry page.
2. A six-to-eight-image product gallery using the clean front, side, rear, top, and accessory photos. Use `object-contain` on a neutral background so the entire unit remains visible and is not cropped.
3. A lightbox or accessible dialog for larger images, with keyboard close support, descriptive `alt` text, and previous/next controls.
4. Lazy loading for gallery images and a poster image for the MP4 video. The video should be muted, autoplay only when visible, looped, and supplied with controls and a fallback poster.
5. A single data map for image roles, captions, and market links so the same assets can be reused without copying imports between routes.

## Nigeria placement

Add the feature banner below the Nigeria hero or above the sector cards with messaging such as **Power and equipment solutions for Nigerian business**. Link the call to action to `/nigeria/contact` or the relevant commerce/e-commerce route. A second placement on the Nigeria commerce or e-commerce service page can present the clean product views as a catalogue-ready gallery, but the products should only be listed for sale after staff enter approved names, prices, descriptions, and available quantities in the Staff Portal.

The newly supplied `laptop-screen-extender.jpeg` and `laptop-screen-extender-3-in-1.jpeg` graphics are shown in a Nigeria-only catalogue spotlight. They contain Nigerian contact details and NGN promotional prices, so they are intentionally not shown on the Canada page. Their prices remain promotional content only until the products are approved and entered into the Staff Portal.

Suggested image roles:

- `factory-floor-wide.jpeg` — wide warehouse/factory feature image.
- `warehouse-crates.jpeg` and `07.04.51 (2).jpeg` — inventory and fulfilment context.
- `07.04.51.jpeg`, `07.04.52.jpeg`, and `07.04.53.jpeg` — primary product angles.
- `07.04.51 (3).jpeg`, `07.04.52 (1).jpeg`, and `07.04.53 (2).jpeg` — top/accessory and rear-detail views.

## Canada placement

Add the same reusable section below the Canada hero or between the About and Services sections with messaging such as **Reliable equipment and operational supply support across Canada**. Link the call to action to `/canada/contact` or the Canada logistics/trade service page. Keep the Canada placement enquiry-led while the Canadian marketplace remains disabled; do not present the images as purchasable catalogue items until the Canada payment and marketplace controls are enabled.

Use the cleaner product views for a professional gallery and reserve the factory/warehouse images for the banner. This gives Canada a polished B2B presentation while avoiding an implied live Canadian shop listing.

## Accessibility and performance checklist

- Add descriptive alt text that identifies the view and product category, not the WhatsApp filename.
- Preserve the full product silhouette with `object-contain` and a consistent aspect-ratio frame.
- Generate responsive WebP/AVIF derivatives for the banner and gallery; keep the originals as source assets.
- Add a poster image and a text fallback for the MP4 video.
- Verify mobile cropping at 320px, 390px, and 768px widths.
- Keep the current country-specific routes and market gate unchanged.
- Confirm that any future product listing has real stock quantities before enabling Add to Cart.
