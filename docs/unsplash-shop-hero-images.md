# Shop hero image sources

The shop hero sliders use locally bundled, optimized Unsplash photos so the banners do not depend on missing `/assets/...` paths or third-party image requests at page load.

| Local asset | Use | Unsplash search/source |
|---|---|---|
| `src/assets/shop-hero-containers.jpg` | Nigeria and Canada marketplace / commerce cover | [Container yard photos on Unsplash](https://unsplash.com/s/photos/container-yard) |
| `src/assets/shop-hero-warehouse.jpg` | Construction and industrial supplies cover | [Warehouse interior photos on Unsplash](https://unsplash.com/s/photos/warehouse-interior) |
| `src/assets/shop-hero-port.jpg` | Fulfilment and logistics cover | [Port container photos on Unsplash](https://unsplash.com/s/photos/port-containers) |

The selected originals were downloaded from Unsplash search results and resized proportionally to a maximum 2,000-pixel width, saved as optimized progressive JPEGs, and bundled with the frontend. No image content was cropped during optimization; the hero uses CSS `object-fit: cover` responsively.
