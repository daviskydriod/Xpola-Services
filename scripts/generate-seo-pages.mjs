import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const siteUrl = 'https://xpolaservices.com';
const template = await readFile(join(dist, 'index.html'), 'utf8');

const products = [
  { name: 'iPhone 18 Pro Max', slug: 'iphone-18-pro-max', category: 'Electronics' },
  { name: '10-Inch Bolts', slug: '10-inch-bolts', category: 'Home & Office' },
  { name: 'EcoFlow Solar Generator', slug: 'ecoflow-solar-generator', category: 'Power' },
];

const pages = [
  { path: 'nigeria', title: 'Nigeria Industrial & Commercial Solutions | Xpola Services', description: 'Xpola Services provides consulting, logistics, commerce, and sector support solutions across Nigeria.' },
  { path: 'nigeria/about', title: 'About Xpola Services Nigeria', description: 'Learn about Xpola Services and our professional services, commerce, and sector support across Nigeria.' },
  { path: 'nigeria/services', title: 'Services in Nigeria | Xpola Services', description: 'Explore Xpola Services consulting, logistics, commerce, and operational support services in Nigeria.' },
  { path: 'nigeria/contact', title: 'Contact Xpola Services Nigeria', description: 'Contact Xpola Services in Nigeria for consulting, logistics, commerce, and business support enquiries.' },
  { path: 'canada', title: 'Canada Professional Services | Xpola Services', description: 'Xpola Services provides consulting, operational support, logistics, and commerce solutions across Canada.' },
  { path: 'canada/about', title: 'About Xpola Services Canada', description: 'Learn about Xpola Services and our professional services, commerce, and operational support in Canada.' },
  { path: 'canada/services', title: 'Services in Canada | Xpola Services', description: 'Explore Xpola Services consulting, operational support, logistics, and business services in Canada.' },
  { path: 'canada/contact', title: 'Contact Xpola Services Canada', description: 'Contact Xpola Services in Canada for consulting, logistics, commerce, and business support enquiries.' },
  { path: 'nigeria/shop', title: 'Nigeria Shop | Xpola Services', description: 'Shop products from Xpola Services Nigeria with clear product details, stock information, delivery options and payment information.', listing: true },
  { path: 'nigeria/shop/iphone-18-pro-max', title: 'iPhone 18 Pro Max | Xpola Nigeria', description: 'View product details, availability and ordering information for the iPhone 18 Pro Max from Xpola Services Nigeria.', product: products[0] },
  { path: 'nigeria/shop/10-inch-bolts', title: '10-Inch Bolts | Xpola Nigeria', description: 'View product details, availability and ordering information for 10-Inch Bolts from Xpola Services Nigeria.', product: products[1] },
  { path: 'nigeria/shop/ecoflow-solar-generator', title: 'EcoFlow Solar Generator | Xpola Nigeria', description: 'View product details, availability and ordering information for the EcoFlow Solar Generator from Xpola Services Nigeria.', product: products[2] },
  { path: 'nigeria/services/consulting', title: 'General Consulting Services in Nigeria | Xpola Services', description: 'Strategic business advisory, project management, and operational improvement support for Nigerian enterprises.' },
  { path: 'nigeria/services/oil-gas', title: 'Oil & Gas Support Services in Nigeria | Xpola Services', description: 'Procurement, logistics coordination, and practical support for Nigeria energy-sector operations.' },
  { path: 'nigeria/services/construction', title: 'Construction & Real Estate Services in Nigeria | Xpola Services', description: 'Construction materials, project support, delivery coordination, and property-development assistance in Nigeria.' },
  { path: 'nigeria/services/mining', title: 'Mining & Quarrying Support in Nigeria | Xpola Services', description: 'Materials sourcing, equipment coordination, safety supplies, and operational logistics for Nigerian extractive-industry teams.' },
  { path: 'nigeria/services/commerce', title: 'General Commerce & Trade in Nigeria | Xpola Services', description: 'International trade, wholesale distribution, and supply-chain coordination for Nigerian businesses.' },
  { path: 'nigeria/services/ecommerce', title: 'E-Commerce Platform in Nigeria | Xpola Services', description: 'Browse a digital marketplace for industrial supplies, consumer goods, and business essentials across Nigeria.' },
  { path: 'nigeria/services/logistics', title: 'Transportation & Logistics in Nigeria | Xpola Services', description: 'Haulage, warehousing, delivery, and coordination services that help move goods safely across Nigeria.' },
  { path: 'canada/services/consulting', title: 'Consulting & Advisory Services in Canada | Xpola Services', description: 'Management, administrative, and organisational consulting tailored for Canadian organisations.' },
  { path: 'canada/services/operations', title: 'Business & Operational Support in Canada | Xpola Services', description: 'Facilities coordination, vendor support, documentation, and operational assistance for Canadian organisations.' },
  { path: 'canada/services/logistics', title: 'Logistics & Distribution in Canada | Xpola Services', description: 'Warehousing, delivery, and supply-chain coordination for businesses operating across Canada.' },
  { path: 'canada/services/trade', title: 'Retail & Wholesale Trade in Canada | Xpola Services', description: 'General merchandise, direct selling, and wholesale supply support for Canadian businesses and institutional buyers.' },
  { path: 'canada/services/community', title: 'Community & Personal Services in Canada | Xpola Services', description: 'Individual, family, and community-focused support designed around practical needs in Canada.' },
];

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function renderProductListing() {
  const cards = products.map(product => `
    <article class="seo-product-card">
      <p class="seo-product-category">${escapeHtml(product.category)}</p>
      <h2>${escapeHtml(product.name)}</h2>
      <p>See current availability and full product specifications.</p>
      <a class="seo-product-link" href="/nigeria/shop/${escapeHtml(product.slug)}">View product details <span aria-hidden="true">→</span></a>
    </article>`).join('');
  return `<main class="seo-fallback"><p class="seo-eyebrow">Xpola Services · Nigeria</p><h1>Nigeria Shop</h1><p class="seo-intro">Browse products available from Xpola Services Nigeria. Open a product to see its full details, availability and ordering information.</p><section class="seo-product-grid" aria-label="Products">${cards}</section></main>`;
}

function renderPageContent(page) {
  if (page.listing) return renderProductListing();
  if (page.product) {
    return `<main class="seo-fallback seo-product-detail"><p class="seo-eyebrow"><a href="/nigeria/shop">Nigeria Shop</a> · Product details</p><h1>${escapeHtml(page.product.name)}</h1><p class="seo-intro">${escapeHtml(page.description)}</p><a class="seo-product-link" href="/nigeria/shop">Back to the Nigeria shop</a></main>`;
  }
  const regionPath = page.path.startsWith('canada') ? '/canada' : '/nigeria';
  return `<main class="seo-fallback"><p class="seo-eyebrow"><a href="${regionPath}">Xpola Services</a> · ${page.path.startsWith('canada') ? 'Canada' : 'Nigeria'}</p><h1>${escapeHtml(page.title.replace(/\s*\|\s*Xpola Services$/, ''))}</h1><p class="seo-intro">${escapeHtml(page.description)}</p><p>Learn more about our work or <a class="seo-inline-link" href="${regionPath}/contact">contact Xpola Services</a> for enquiries.</p></main>`;
}

const fallbackStyles = `<style>
.seo-fallback{box-sizing:border-box;max-width:1160px;min-height:100vh;margin:0 auto;padding:48px 24px;background:#fff;color:#171717;font:16px/1.6 Arial,sans-serif}
.seo-fallback *{box-sizing:border-box}.seo-fallback h1{margin:0 0 12px;font-size:clamp(30px,5vw,44px);line-height:1.15;font-weight:800;letter-spacing:-.03em}.seo-fallback h2{margin:0 0 8px;font-size:18px;line-height:1.35}.seo-eyebrow{margin:0 0 12px;color:#b91c1c;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.seo-eyebrow a,.seo-inline-link{color:#b91c1c;text-decoration:underline;text-underline-offset:3px}.seo-intro{max-width:720px;margin:0 0 28px;color:#555}.seo-product-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}.seo-product-card{display:flex;min-height:190px;flex-direction:column;padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;box-shadow:0 4px 16px #1111}.seo-product-card>p:not(.seo-product-category){margin:0 0 18px;color:#666;font-size:14px}.seo-product-category{margin:0 0 8px;color:#b91c1c;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.seo-product-link{display:inline-flex;align-items:center;gap:6px;margin-top:auto;color:#b91c1c;font-size:13px;font-weight:700;text-decoration:none}.seo-product-link:hover{text-decoration:underline}
</style>`;

if (pages.length !== 24) {
  throw new Error(`Expected 24 prerendered entry pages, found ${pages.length}. Review the route list before building.`);
}
if (!template.includes('<div id="root"></div>')) {
  throw new Error('The Vite HTML template is missing the expected React root placeholder.');
}

for (const page of pages) {
  const canonical = `${siteUrl}/${page.path}`;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const schema = page.product
    ? `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: page.product.name,
      description: page.description,
      url: canonical,
    }).replace(/</g, '\\u003c')}</script>`
    : '';
  const social = `<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:type" content="${page.product ? 'product' : 'website'}"><meta property="og:url" content="${canonical}">`;
  const html = template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace('</head>', `${fallbackStyles}<meta name="description" content="${description}"><meta name="robots" content="index,follow"><link rel="canonical" href="${canonical}">${social}${schema}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${renderPageContent(page)}</div>`);
  const out = join(dist, page.path, 'index.html');
  await mkdir(join(dist, page.path), { recursive: true });
  await writeFile(out, html);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url><loc>${siteUrl}/${page.path}</loc></url>`).join('\n')}
</urlset>
`;
await writeFile(join(dist, 'sitemap.xml'), sitemap);
await writeFile(new URL('../public/sitemap.xml', import.meta.url).pathname, sitemap);

console.log(`Pre-rendered ${pages.length} SEO entry pages with visible fallback content and generated sitemap.xml.`);
