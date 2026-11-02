# Part 3 additions: paste into README.md

Replace `<LIVE-URL>` with your deployed address (default assumed: https://phuluso-11.github.io/thandekas-kitchen/).

---

## Part 3: Enhancing Functionality and SEO

**Live site:** <LIVE-URL>  |  **Repository:** https://github.com/Phuluso-11/thandekas-kitchen

### Part 3 features

| Feature | Where | How it works |
|---|---|---|
| Enquiry form validation | enquiry.html | `script.js` checks name, email, South African phone format, product, quantity (whole number 1 to 500), date (must meet the product's lead time) and message length (10 to 1000). Errors show beside each field and the first bad field receives focus. |
| Enquiry response (AJAX) | enquiry.html | After validation, `fetch()` loads `data/products.json`, calculates the estimated cost for the chosen product and quantity, checks availability against the lead time, and shows a summary with a reference number without reloading the page. |
| Contact form and email | contact.html | Validates name, email, optional phone, message type and message, then compiles a subject and body into a `mailto:` link addressed to thandekaskitchen@gmail.com. A preview is shown and the visitor presses Send in their email app. |
| Accordion | enquiry.html | FAQ with `aria-expanded`, one answer open at a time. |
| Gallery lightbox | gallery.html | Click or Enter opens the full-size photo; arrows, swipe, Escape and backdrop click supported; focus is trapped while open and returned on close. |
| Interactive map | contact.html | Leaflet with OpenStreetMap tiles, markers and popups for both locations, buttons that fly to each one, and a "Get directions" link. |
| Dynamic products, search, filter, sort | products.html | Product cards are built from `data/products.json`. Live search (name, description, keywords), category filter and sort by name or price. `?category=` and `?q=` links pre-fill the filters. |
| Animations | all pages | CSS keyframe fade-up on scroll (IntersectionObserver), card hover lift, lightbox fade, accordion open animation. Disabled automatically for `prefers-reduced-motion`. |

### SEO summary

| Page | Title tag | Main keywords |
|---|---|---|
| index.html | Artisan Bakery & Cakes in Johannesburg \| Thandeka's Kitchen | artisan bakery Johannesburg, celebration cakes, corporate catering |
| about.html | About Thandeka's Kitchen \| Johannesburg Artisan Bakers | Thandeka Mokoena, local bakery, handcrafted baking |
| products.html | Celebration Cakes, Catering & Pastries \| Thandeka's Kitchen | birthday cakes Johannesburg, wedding cakes, pastry platters |
| gallery.html | Cake & Pastry Gallery \| Thandeka's Kitchen Johannesburg | cake gallery, wedding dessert table |
| enquiry.html | Request a Cake or Catering Quote \| Thandeka's Kitchen | cake quote Johannesburg, catering quote |
| contact.html | Contact & Locations \| Thandeka's Kitchen Johannesburg | bakery Johannesburg address, Alberton pop-up kitchen |

- **Keyword research:** the phrases above combine the service (cakes, catering, pastries) with the location (Johannesburg, Alberton), because local customers search that way (Google, 2026). Keywords were checked against what a customer would type to find the products on the price list.
- **Meta keywords:** included on every page because the brief asks for them. Major search engines ignore this tag today (Google, 2026), so the on-page headings, title tags and descriptions carry the real SEO weight.
- **Titles and descriptions:** unique per page; titles about 55 to 60 characters, descriptions about 120 to 150 characters.
- **Headings:** one `h1` per page, then `h2` and `h3` in order.
- **Images:** descriptive file names (for example `two-tier-floral-celebration-cake-johannesburg.jpg`) and meaningful alt text; `loading="lazy"` and `srcset` keep pages fast.
- **Clean URLs and internal links:** short page names; products, enquiry, contact and about link to each other in the body text and footer; product cards deep-link to `enquiry.html?product=...`.
- **Local SEO:** name, address and phone repeated in the footer; `Bakery` structured data (JSON-LD) on the home page (Schema.org, 2026); two locations on the map.
- **robots.txt and sitemap.xml:** in the project root. Note that crawlers only read `robots.txt` at a domain's root; on a GitHub Pages project address it documents intent but is not enforced.
- **Mobile-friendliness:** viewport tag, mobile-first CSS, 44px touch targets, responsive images.
- **Page speed:** deferred script, lazy images, resized `-800` copies, single CSS and JS file, Leaflet loaded only on the contact page.
- **Security:** all visitor input is written to the page with `textContent` (never `innerHTML`); Leaflet files use Subresource Integrity hashes; external links use `rel="noopener noreferrer"`; a strict referrer policy is set; no secrets or server code in the repository.
- **Off-page SEO (plan, not code):** list the business on Google Business Profile for both addresses, share the site on Facebook and Instagram using the Open Graph tags already added, and ask local suppliers and event venues for links back to the site. These cannot be completed on a fictional business, so they are documented as the recommended next steps.

### Deployment (GitHub Pages)

1. Push `main` to GitHub.
2. Repository **Settings > Pages > Build and deployment**: Source "Deploy from a branch", branch `main`, folder `/ (root)`, Save.
3. Wait one to two minutes and open the live address. Test every page (see the testing note below).

### Testing note

| Test | Result |
|---|---|
| Enquiry: submit empty form | 5 errors shown, focus moves to the first |
| Enquiry: invalid phone (12345), past date, short message | Specific message beside each field |
| Enquiry: valid birthday cake x2 for a future date | Summary shows "From R900", lead-time availability message, reference number |
| Enquiry: product changed to Wedding Cake with a date 3 days away | Date error: 14 days' notice needed |
| Enquiry: "Other" type | Product and quantity hidden and skipped |
| Contact: valid message | Preview panel shown and email app opens with subject, body and recipient filled in |
| Products: search "bread", sort by price, category filter | Correct cards, count updates, empty state offers a reset |
| Gallery: click, Enter, arrows, Escape, swipe | Opens, moves, closes, returns focus |
| Map: markers, popups, buttons | Both locations shown; buttons zoom to each |
| Responsive: 1920, 1366, 820, 393, 412 px | No horizontal scrolling; hamburger works below 900px |
| Browsers | Chrome and Edge (add Firefox if you test it) |

---

## Changelog entries to add

### Feedback from Part 2 (75%)
The written feedback and graded rubric for Part 2 were not available to me at the time of this submission, so I could not respond to specific lecturer comments. Instead I re-read the Part 2 rubric and reviewed my own work against it, and made these improvements. 

| Change | Reason |
|---|---|
| Renamed gallery, hero and founder images with descriptive names and updated every page | Clearer file naming; also supports image SEO |
| Applied the same complete meta block (title, description, keywords, canonical, social tags) to all six pages | Consistency across every page |
| Added a footer contact line and body-text links between pages | Easier navigation and consistent contact details |

Only list changes you actually made. Add these two rows **only if you do them**: "Added five device screenshots to the README (the Part 2 brief asks for screenshot evidence there)" and "Re-checked the reference list for consistent Harvard formatting".

### Part 3 development
| Date | Change |
|---|---|
| 2026-11-01 | Added `js/script.js` with form validation, enquiry quote, contact email, accordion, lightbox, map, dynamic products and scroll animation |
| 2026-11-01 | Added `data/products.json` holding all products, prices and lead times; products page now builds from it |
| 2026-11-01 | Wrapped every form field in a `.field` container to hold its error message; added `novalidate` so styled messages replace browser pop-ups |
| 2026-11-01 | Added Part 3 CSS (section 14): errors, result panels, product cards, accordion, lightbox, map, reveal animation |
| 2026-11-01 | Updated title tags, meta descriptions and keywords, canonical and Open Graph tags on all pages; added JSON-LD, `robots.txt`, `sitemap.xml` |
| 2026-11-01 | Renamed images with descriptive names (`tools/rename-images.ps1`) and updated all pages |
| 2026-11-01 | Added footer contact line and body-text internal links for navigation and local SEO |
| 2026-11-01 | Deployed to GitHub Pages |

## References to add (Harvard, IIE style)

In-text examples: (Mozilla, 2026), (Leaflet, 2026), (W3C, 2026), (Google, 2026), (Schema.org, 2026), (Anthropic, 2026).

- Anthropic (2026) *Claude Sonnet 5.5* [Large language model]. Available at: https://claude.ai (Accessed: 1 November 2026).
- GitHub (2026) *GitHub Pages documentation*. Available at: https://docs.github.com/en/pages (Accessed: 1 November 2026).
- Google (2026) *Google Search Central documentation*. Available at: https://developers.google.com/search/docs (Accessed: 1 November 2026).
- Leaflet (2026) *Leaflet quick start guide*. Available at: https://leafletjs.com/examples/quick-start/ (Accessed: 1 November 2026).
- Mozilla (2026) *Fetch API*. MDN Web Docs. Available at: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API (Accessed: 1 November 2026).
- Mozilla (2026) *Intersection Observer API*. MDN Web Docs. Available at: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API (Accessed: 1 November 2026).
- OpenStreetMap Foundation (2026) *Tile usage policy*. Available at: https://operations.osmfoundation.org/policies/tiles/ (Accessed: 1 November 2026).
- Schema.org (2026) *Bakery*. Available at: https://schema.org/Bakery (Accessed: 1 November 2026).
- W3C (2026) *Accordion pattern*. ARIA Authoring Practices Guide. Available at: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/ (Accessed: 1 November 2026).
- W3C (2026) *Dialog (modal) pattern*. ARIA Authoring Practices Guide. Available at: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ (Accessed: 1 November 2026).

Change each "Accessed" date to the day you actually read the source. Keep the Part 2 references (Afrihost, Coyier, Google Fonts, MDN, Unsplash, W3C WCAG, Xneelo) in the same list, alphabetical.

## AI disclosure annexe (IIE requirement)

- **Tool:** Claude Sonnet 5.5 (Anthropic, 2026), accessed via claude.ai.
- **Used for:** drafting and explaining the JavaScript in `js/script.js`, the Part 3 CSS, the form markup, SEO tags, `robots.txt`, `sitemap.xml` and the README text for Part 3, based on the brief and my existing Part 2 files.
- **My contribution:** I supplied the brief and my Part 2 files, reviewed and tested all code in the browser, chose the business rules, and edited the output.
- **Evidence:** attach screen grabs of this chat to the annexe.
- Mention the tool and in-text citation (Anthropic, 2026) in the README, and cite it in the reference list above.

## Commit plan (run one at a time from the project folder)

```
git add tools/rename-images.ps1
powershell -ExecutionPolicy Bypass -File tools\rename-images.ps1
git add -A images
git commit -m "Rename gallery images with descriptive SEO file names"

git add data/products.json
git commit -m "Add products.json catalogue for dynamic product listings and quotes"

git add js/script.js css/style.css
git commit -m "Add JavaScript: form validation, quote, mailto, accordion, lightbox, map, search; add Part 3 CSS"

git add index.html about.html products.html gallery.html enquiry.html contact.html
git commit -m "Update pages: SEO meta tags, structured data, form markup, map and product search"

git add robots.txt sitemap.xml README.md
git commit -m "Add robots.txt and sitemap.xml; update README, changelog and references for Part 3"

git push origin main
```
