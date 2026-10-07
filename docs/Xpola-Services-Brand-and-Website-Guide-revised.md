# XPOLA SERVICES
## Brand & Website Guide — Revised Handover Edition

**Plain-English guide to the brand, website, online shop, and day-to-day operation**  
**Website:** https://xpolaservices.com/  
**Business:** Xpola Services Limited (Nigeria and Canada)  
**Built and documented by:** Nosyra Digital

> **Important scope note:** The Canada information and services site is live. The Canada marketplace and checkout are deliberately switched off while Moneris setup is pending. Canadian visitors can learn about the company, view services, and send enquiries, but they cannot place marketplace orders.

## Contents

1. Welcome
2. Brand at a glance
3. The two markets
4. Services
5. Website tour
6. Shop and checkout
7. Customer account
8. Admin guide
9. Everyday tasks
10. Brand voice and claims
11. Review, decisions, and handover checklist
12. Questions and troubleshooting
13. Contacts and glossary

---

## 1. Welcome

Xpola Services Limited uses one website to present the company, explain its services, receive enquiries, and operate the Nigerian online shop. This guide is for the owner, managers, sales staff, customer support, shop/order staff, and future team members.

- **Owner/director:** Start with Sections 2, 3, 10, and 11.
- **Sales/business development:** Start with Sections 4, 5, and 10.
- **Shop/order manager:** Start with Sections 6, 8, and 9.
- **Customer support:** Start with Sections 7, 8, and 12.

---

## 2. Brand at a glance

**Company:** Xpola Services Limited  
**Core promise:** One trusted partner across consulting, supply, logistics, and commerce, combining local market knowledge with professional standards.

| Element | Approved working direction |
|---|---|
| Main colours | Signal red, black, white, and soft greys |
| Look | Clean, corporate, confident, and spacious |
| Tone | Professional, reassuring, practical, and confident without boasting |
| Nigeria message | Powering Growth Across Key Sectors |
| Canada message | Professional services built for performance |
| Audience | Businesses, public institutions, NGOs, operators, contractors, individuals, and households |

**Proof rule:** Only publish registration, sector, project, client, support, compliance, or performance claims that the owner can substantiate. A claim that is true in a proposal or internal plan must not be presented as a public fact until it is verified.

---

## 3. The two markets

| Item | Nigeria | Canada |
|---|---|---|
| Currency | NGN / naira | CAD / Canadian dollars for future marketplace use |
| Published service count | 7 sectors | 5 services |
| Phone | +234 708 627 5105 | +1 306 730 0639 |
| Office hours | Monday–Friday, 8:00 AM–6:00 PM WAT | Monday–Friday, 9:00 AM–5:00 PM ET |
| Location shown | Lagos, Nigeria | Toronto, Ontario, Canada |
| Email | info@xpolaservices.com; xpolaservices@gmail.com | info@xpolaservices.com; xpolaservices@gmail.com |
| Online commerce | Nigerian shop and Paystack checkout are enabled | Marketplace and checkout are off while Moneris setup is pending |

The country switch changes the information, services, contact details, and shop context. Never send Nigerian currency, delivery promises, hours, or payment instructions to a Canadian shopper.

---

## 4. Services

### Nigeria — seven published sectors

1. General Consulting
2. Oil & Gas Support
3. Construction & Real Estate
4. Mining & Quarrying
5. General Commerce
6. E-Commerce Platform
7. Transportation & Logistics

### Canada — five published services

1. Consulting & Advisory
2. Business & Operational Support
3. Logistics & Distribution
4. Retail & Wholesale Trade
5. Community & Personal Services

### Five-step client process

1. Initial consultation
2. Assessment and proposal
3. Planning and strategy
4. Implementation
5. Delivery and support

Use this as a conversational outline, not a promise of a fixed timeline or result. Confirm scope, pricing, milestones, and deliverables in the proposal or contract.

---

## 5. Website tour

The public website includes home, about, services, individual service pages, projects, contact, legal pages, login, customer account, Nigerian shop, product pages, checkout, and order success pages. The admin area is restricted to approved staff.

### What happens when someone sends an enquiry

The visitor submits their name, contact details, and message. Staff should acknowledge and respond within one working day where practical. Do not promise 24/7 phone availability: the published office hours are Monday–Friday.

### Canada visitor journey while the marketplace is off

A visitor who opens the Canada marketplace or checkout sees a clear “Canada Market — Coming Soon” page. It says that the marketplace is switched off while Moneris setup is completed, that Canadian visitors cannot place an order or check out, and that the information, services, and enquiry routes remain available. Staff should not accept a manual Canadian marketplace order as a workaround.

---

## 6. Shop and checkout

### Nigeria shop

The Nigerian shop supports product browsing, categories, filters, cart, wishlist, delivery areas, coupons, and Paystack checkout. Customers must sign in before checkout so an order can be linked to an account.

### Canada marketplace

Do not describe Canadian categories, loyalty points, free-delivery thresholds, referral discounts, or Canadian marketplace activity as live features while Moneris is off. Those items can be documented and enabled only after the owner approves the Canadian launch and the payment/API controls are tested.

### Nigerian buying journey

1. Add products to the cart.
2. Sign in or create an account.
3. Select a Nigerian delivery area.
4. Apply a discount code if eligible.
5. Pay in the Paystack window.
6. Wait for server-side payment confirmation and order status update.

Paystack card details are handled by Paystack, not by Xpola. Staff should not mark a payment paid solely because a browser callback appeared; check the server-side order/payment status.

### Operational checks still required

- **Restock alerts:** The frontend stores a customer opt-in. Confirm whether the deployed API sends alerts automatically, creates a staff task, or only records the preference.
- **Coupons:** The checkout UI converts typed codes to uppercase. Confirm whether the API/database treats codes case-insensitively and document that rule for staff.
- **Payment failure:** Failed, declined, cancelled, and abandoned payments must not remain as paid orders.

---

## 7. Customer account

Signed-in customers can use account summary, orders, wishlist, loyalty, profile, addresses, notifications, referrals, and support features where enabled by the API.

The previous guide’s naira-only loyalty, free-delivery, and referral examples should be treated as **Nigeria-only** until Canadian commerce is launched. Do not quote those figures to Canadian shoppers.

### Passwords

New registrations require **at least 8 characters** in the website UI. The PHP API must enforce the same or stronger rule. Never share passwords or one-time codes.

---

## 8. Admin guide

The admin panel is the staff control room. Staff should use individual accounts, enable one-time verification where available, log out on shared devices, and never share credentials.

### Orders

Orders should show both `status` and `payment_status`. The normal progression is pending → paid → processing → shipped → delivered. Failed payments must be visible as failed. Admin orders can be searched and filtered by status, country, and date range.

### Other areas

Products manage name, description, price, category, image, stock, and featured state. Customers manage account status and tags. Support manages tickets and replies. Settings manages delivery zones, categories, coupons, security, and maintenance. Audit/activity logs should show who performed an action and when.

---

## 9. Everyday tasks

### Add or update a product

1. Open Products.
2. Add or edit the product.
3. Confirm name, description, price, category, image, country, and stock.
4. Save and check the public Nigerian shop.

### Process a paid Nigerian order

1. Open Orders and confirm the server-side payment status.
2. Check the customer, delivery area, address, and items.
3. Pack and dispatch the order.
4. Set Shipped and add tracking information if available.
5. Set Delivered after confirmed receipt.

### Handle a Canadian enquiry

1. Keep the visitor on the Canada information/services route.
2. Explain that the Canadian marketplace and checkout are off while Moneris setup is pending.
3. Record and answer the enquiry through the normal contact/support process.
4. Do not create a Canadian marketplace order manually.

### Pause the site

Use Maintenance only for planned work, stock takes, or major updates. Check the public notice, then switch maintenance off and verify the public site afterwards.

---

## 10. Brand voice and claims

Use clear, respectful, practical language. Say what Xpola does, who it helps, and what the next step is. Avoid round-number claims, fake certainty, “always available” wording, and unverified client stories.

The public site has been adjusted so unsupported counters and the testimonial carousel are not presented as verified proof. Before adding them back, obtain written approval for each real figure, client name, title, company, quote, image, and usage permission.

Privacy copy names Nigeria’s **National Data Protection Act (NDPA)** and Canada’s **PIPEDA**. This is a signpost, not a legal certification; the owner should obtain appropriate legal review before publishing a “compliant” guarantee.

---

## 11. Review, decisions, and handover checklist

This is the owner’s action list. Items below are intentionally visible because they need confirmation or deployment access.

### Owner decisions and confirmations

- [ ] Confirm the approved Nosyra Digital email address.
- [ ] Confirm the approved Nosyra Digital phone number.
- [ ] Insert domain registrar, hosting/FTP provider, renewal dates, and backup location.
- [ ] Confirm the owner’s Paystack account holder and recovery contact.
- [ ] Confirm who can access the deployed PHP API and database.
- [ ] Confirm restock alerts are automatic, staff-sent, or not enabled.
- [ ] Confirm coupon code case sensitivity at the API/database layer.
- [ ] Approve any real testimonials, client names, logos, counters, and compliance claims.
- [ ] Approve the timing and acceptance criteria for enabling Canada/Moneris.

### Current ownership and access position

- The owner owns the domain.
- The owner controls the Paystack account and credentials.
- Nosyra Digital uses FTP to upload files and does not control the owner’s domain or Paystack credentials.
- Hosting, registrar, renewal dates, backups, and the deployed PHP API access still need to be recorded by the owner in the final handover record.

### Features deliberately switched off

| Feature | Current state | Enable only when |
|---|---|---|
| Canada marketplace | Off | Owner approves launch and product/API/payment testing passes |
| Canadian checkout / Moneris | Off | Moneris merchant setup, server-side verification, refunds, and support process are complete |
| Public client testimonials | Removed/neutralised | Each reference is real, approved, and documented |

---

## 12. Questions and troubleshooting

| Question | Staff answer |
|---|---|
| A Canadian visitor wants to order | Explain that Canada marketplace ordering is unavailable while Moneris setup is pending; offer the Canada services/contact route. |
| A payment appears paid in the browser but not in Orders | Do not dispatch. Check server-side verification and the Paystack dashboard. |
| A coupon is rejected | Check spelling, active dates, minimum order, usage limit, and the confirmed case-sensitivity rule. |
| A customer expects a restock email | Check whether automatic delivery is enabled; otherwise record the request for staff follow-up. |
| The site shows maintenance | Check the admin Maintenance switch and the published message. |
| A customer asks about privacy | Point to the Privacy Policy and the NDPA/PIPEDA references; do not give legal advice. |

---

## 13. Contacts and glossary

### Xpola contacts

- Nigeria: `info@xpolaservices.com`, `xpolaservices@gmail.com`, `+234 708 627 5105`
- Canada: `info@xpolaservices.com`, `xpolaservices@gmail.com`, `+1 306 730 0639`
- Canada hours: Monday–Friday, 9:00 AM–5:00 PM **ET**
- Owner privacy/contact route: `info@xpolaservices.com`

### Nosyra Digital contact — owner to confirm

> **Email:** ____________________  
> **Phone:** ____________________  
> **Preferred support channel / hours:** ____________________

No agency contact detail has been invented in this guide. Fill this box from the approved contract or handover record.

### Glossary

- **Admin panel:** Private staff area for managing products, orders, customers, support, settings, and maintenance.
- **Checkout:** Final steps where the customer confirms delivery details and pays.
- **ET:** Eastern Time, used for Canadian office hours; it covers seasonal daylight-saving changes better than “EST”.
- **Moneris:** Planned Canadian payment provider; inactive while the Canada marketplace is off.
- **Paystack:** Payment provider used for enabled Nigerian orders.
- **Restock alert:** Customer preference to be notified when a wishlisted product returns to stock; delivery automation must be confirmed.
- **Status:** Operational order stage such as pending, paid, processing, shipped, delivered, cancelled, or failed.
- **Payment status:** Payment outcome such as pending, paid, failed, declined, or cancelled.

> **End of revised handover guide.** Keep this guide with the owner’s credential, renewal, backup, and deployment records. Do not put passwords or secret API keys in this document.
