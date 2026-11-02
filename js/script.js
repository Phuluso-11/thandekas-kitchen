/* ==========================================================================
   Thandeka's Kitchen - script.js
   WEDE5020 Part 3: JavaScript functionality
   Author: Phuluso

   Plain JavaScript (no jQuery), so there is nothing extra to download.
   One file serves all six pages: each init function only runs when the
   elements it needs exist on the current page.

   Contents
   1. Configuration and shared data
   2. Helper functions
   3. Form validation engine
   4. Products page: dynamic content, search, filter, sort
   5. Enquiry form: validation, AJAX price lookup, quote response
   6. Contact form: validation and mailto email
   7. Accordion (FAQ)
   8. Gallery lightbox
   9. Interactive map (Leaflet)
   10. Scroll-reveal animation
   11. Start-up

   Techniques adapted from documentation (see README references):
   fetch and IntersectionObserver (Mozilla, 2026), accordion and modal
   dialog patterns (W3C, 2026), Leaflet quick start (Leaflet, 2026).
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. CONFIGURATION AND SHARED DATA
   -------------------------------------------------------------------------- */

const DATA_URL = 'data/products.json';
const BUSINESS_EMAIL = 'thandekaskitchen@gmail.com';
const BUSINESS_PHONE = '011 555 0192';
const MAX_BOOKING_DAYS = 365;

/* Both trading locations. The coordinates are approximate: check each pin in
   Google Maps and adjust lat/lng here if needed. */
const LOCATIONS = [
    {
        id: 'bakery',
        name: "Thandeka's Kitchen Bakery",
        address: 'Trefnant Road, Johannesburg, 2196',
        lat: -26.2478,
        lng: 28.0603
    },
    {
        id: 'popup',
        name: "Thandeka's Kitchen Pop-Up Kitchen",
        address: '4955 Highveld Dunn Road, Alberton, 2031',
        lat: -26.2679,
        lng: 28.1220
    }
];

/* The catalogue is fetched once and shared by the products and enquiry pages. */
let cataloguePromise = null;

/* Products for the enquiry form (filled when the catalogue has loaded). */
let enquiryProducts = [];

/* --------------------------------------------------------------------------
   2. HELPER FUNCTIONS
   -------------------------------------------------------------------------- */

/* Formats a number as South African rand with comma thousands: 1800 -> R1,800 */
function formatRand(amount) {
    return 'R' + String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/* Creates an element. textContent is used (never innerHTML), so anything a
   visitor types can never be run as code. */
function makeEl(tag, className, text) {
    let element;

    element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

/* Today at midnight, so date comparisons ignore the time of day. */
function startOfToday() {
    let now;

    now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/* Date -> "2026-11-05", the format <input type="date"> uses. */
function toIsoDate(date) {
    let year, month, day;

    year = date.getFullYear();
    month = String(date.getMonth() + 1).padStart(2, '0');
    day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

/* "2026-11-05" -> Date in local time. */
function parseIsoDate(value) {
    let parts;

    parts = value.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function formatLongDate(date) {
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* Loads data/products.json with fetch() (AJAX). The promise is cached so the
   file is only requested once per page; a failure clears the cache so a
   later attempt can retry. */
function loadCatalogue() {
    if (cataloguePromise === null) {
        cataloguePromise = fetch(DATA_URL)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Could not load ' + DATA_URL + ' (HTTP ' + response.status + ')');
                }
                return response.json();
            })
            .catch(function (error) {
                cataloguePromise = null;
                throw error;
            });
    }
    return cataloguePromise;
}

/* --------------------------------------------------------------------------
   3. FORM VALIDATION ENGINE
   Each rule is a function that receives the field and returns an error
   message, or an empty string when the value is acceptable.
   -------------------------------------------------------------------------- */

/* Shows or clears the error for one field. Returns true when the field is valid. */
function setFieldState(field, message) {
    let errorBox;

    errorBox = document.getElementById(field.id + '-error');
    if (message) {
        field.classList.add('is-invalid');
        field.setAttribute('aria-invalid', 'true');
    } else {
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
    }
    if (errorBox) {
        errorBox.textContent = message;
    }
    return message === '';
}

/* A field inside a hidden wrapper (for example the product picker when
   "Other" is chosen) is skipped by validation. */
function isFieldHidden(field) {
    return field.closest('[hidden]') !== null;
}

function validateField(field, rule) {
    let message;

    message = isFieldHidden(field) ? '' : rule(field);
    return setFieldState(field, message);
}

/* Validates every field in the rules object. Shows all errors at once, puts
   the keyboard focus on the first bad field, and reports the count. */
function validateAll(rules, statusBox) {
    let ids, firstInvalid, invalidCount, i, field;

    ids = Object.keys(rules);
    firstInvalid = null;
    invalidCount = 0;

    for (i = 0; i < ids.length; i++) {
        field = document.getElementById(ids[i]);
        if (!validateField(field, rules[ids[i]])) {
            invalidCount++;
            if (firstInvalid === null) {
                firstInvalid = field;
            }
        }
    }

    if (invalidCount > 0) {
        statusBox.textContent = 'Please fix the ' + invalidCount + ' highlighted '
            + (invalidCount === 1 ? 'field' : 'fields') + ' and try again.';
        statusBox.classList.add('is-error');
        firstInvalid.focus();
        return false;
    }

    statusBox.textContent = '';
    statusBox.classList.remove('is-error');
    return true;
}

/* Immediate feedback: check a field when the visitor leaves it, and keep
   re-checking while they correct it. */
function attachLiveValidation(rules) {
    Object.keys(rules).forEach(function (id) {
        let field;

        field = document.getElementById(id);
        field.addEventListener('blur', function () {
            validateField(field, rules[id]);
        });
        field.addEventListener('input', function () {
            if (field.getAttribute('aria-invalid') === 'true') {
                validateField(field, rules[id]);
            }
        });
    });
}

/* Clears every error on a form (used when it is reset). */
function clearFormErrors(form) {
    form.querySelectorAll('.is-invalid').forEach(function (field) {
        setFieldState(field, '');
    });
}

/* ----- Individual rules ----- */

function checkName(field) {
    let value;

    value = field.value.trim();
    if (value === '') {
        return 'Please enter your full name.';
    }
    if (value.length < 2 || value.length > 60) {
        return 'Your name must be between 2 and 60 characters.';
    }
    if (!/^\p{L}[\p{L} '.\-]*$/u.test(value)) {
        return 'Use letters, spaces, apostrophes, full stops or hyphens only.';
    }
    return '';
}

function checkEmail(field) {
    let value;

    value = field.value.trim();
    if (value === '') {
        return 'Please enter your email address.';
    }
    if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        return 'Enter a valid email address, for example name@example.co.za.';
    }
    return '';
}

/* South African numbers: 0 or +27 or 0027, then 9 digits (spaces, hyphens and
   brackets are allowed while typing). */
function isValidPhone(value) {
    let digits;

    digits = value.replace(/[\s\-()]/g, '');
    return /^(?:\+27|0027|0)[1-9]\d{8}$/.test(digits);
}

function checkPhone(field) {
    let value;

    value = field.value.trim();
    if (value === '') {
        return 'Please enter your phone number.';
    }
    if (!isValidPhone(value)) {
        return 'Enter a South African number, for example 011 555 0192 or +27 82 123 4567.';
    }
    return '';
}

/* Contact form: the phone number is optional, but must be valid if given. */
function checkOptionalPhone(field) {
    let value;

    value = field.value.trim();
    if (value !== '' && !isValidPhone(value)) {
        return 'Enter a South African number, for example 011 555 0192, or leave this blank.';
    }
    return '';
}

function checkSelect(field) {
    return field.value === '' ? 'Please choose an option from the list.' : '';
}

/* Text areas: required, with minimum and maximum lengths. */
function checkText(field, label, minLength, maxLength) {
    let length;

    length = field.value.trim().length;
    if (length === 0) {
        return 'Please enter your ' + label + '.';
    }
    if (length < minLength) {
        return 'Your ' + label + ' must be at least ' + minLength + ' characters (currently ' + length + ').';
    }
    if (length > maxLength) {
        return 'Your ' + label + ' must be ' + maxLength + ' characters or fewer (currently ' + length + ').';
    }
    return '';
}

/* --------------------------------------------------------------------------
   4. PRODUCTS PAGE: dynamic content, search, filter and sort
   -------------------------------------------------------------------------- */

function initProducts() {
    let list, searchBox, categoryBox, sortBox, countBox, resetButton;
    let products, categories, params;

    list = document.getElementById('product-list');
    searchBox = document.getElementById('product-search');
    categoryBox = document.getElementById('product-category');
    sortBox = document.getElementById('product-sort');
    countBox = document.getElementById('product-count');
    resetButton = document.getElementById('product-reset');
    products = [];
    categories = [];
    params = new URLSearchParams(window.location.search);

    /* Builds one product card from a product object. */
    function buildCard(product) {
        let card, image, body, price, lead, link;

        card = makeEl('article', 'product-card');
        image = makeEl('img', 'product-card-image');
        image.src = product.image;
        image.alt = product.imageAlt;
        image.loading = 'lazy';
        body = makeEl('div', 'product-card-body');
        price = makeEl('p', 'product-price',
            (product.pricing === 'from' ? 'From ' : '') + formatRand(product.price) + ' ' + product.unitLabel);
        lead = makeEl('p', 'product-lead',
            'Order at least ' + product.leadDays + (product.leadDays === 1 ? ' day' : ' days') + ' ahead');
        link = makeEl('a', 'cta-button', 'Get a quote');
        link.href = 'enquiry.html?product=' + encodeURIComponent(product.id);
        link.setAttribute('aria-label', 'Get a quote for ' + product.name);

        body.appendChild(makeEl('h3', '', product.name));
        body.appendChild(price);
        body.appendChild(makeEl('p', 'product-desc', product.description));
        body.appendChild(lead);
        body.appendChild(link);
        card.appendChild(image);
        card.appendChild(body);
        return card;
    }

    /* Applies the search words, category filter and sort order, then redraws. */
    function render() {
        let words, category, order, matches, fragment, emptyBox, emptyReset;

        words = searchBox.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        category = categoryBox.value;
        order = sortBox.value;

        matches = products.filter(function (product) {
            let haystack;

            if (category !== 'all' && product.category !== category) {
                return false;
            }
            haystack = (product.name + ' ' + product.description + ' ' + product.keywords.join(' ')
                + ' ' + product.category).toLowerCase();
            return words.every(function (word) {
                return haystack.indexOf(word) !== -1;
            });
        });

        matches.sort(function (a, b) {
            if (order === 'price-low') { return a.price - b.price; }
            if (order === 'price-high') { return b.price - a.price; }
            return a.name.localeCompare(b.name);
        });

        list.replaceChildren();
        if (matches.length === 0) {
            emptyBox = makeEl('div', 'product-empty');
            emptyBox.appendChild(makeEl('p', '', 'No products match your search. Try a different word or clear the filters.'));
            emptyReset = makeEl('button', '', 'Clear search and filters');
            emptyReset.type = 'button';
            emptyReset.addEventListener('click', resetFilters);
            emptyBox.appendChild(emptyReset);
            list.appendChild(emptyBox);
        } else {
            fragment = document.createDocumentFragment();
            matches.forEach(function (product) {
                fragment.appendChild(buildCard(product));
            });
            list.appendChild(fragment);
        }
        countBox.textContent = 'Showing ' + matches.length + ' of ' + products.length + ' products';
    }

    function resetFilters() {
        searchBox.value = '';
        categoryBox.value = 'all';
        sortBox.value = 'name';
        render();
        searchBox.focus();
    }

    /* Fills the category drop-down from the JSON file. */
    function fillCategories() {
        categories.forEach(function (category) {
            let option;

            option = makeEl('option', '', category.label);
            option.value = category.id;
            categoryBox.appendChild(option);
        });
    }

    loadCatalogue()
        .then(function (data) {
            products = data.products;
            categories = data.categories;
            fillCategories();

            /* Links such as products.html?category=cake or ?q=bread pre-fill the filters. */
            if (params.get('category') && categoryBox.querySelector('option[value="' + params.get('category') + '"]')) {
                categoryBox.value = params.get('category');
            }
            if (params.get('q')) {
                searchBox.value = params.get('q').slice(0, 60);
            }
            render();
        })
        .catch(function (error) {
            console.warn(error.message);
            list.replaceChildren(makeEl('p', 'product-empty',
                "We couldn't load the product list. Please refresh the page or call " + BUSINESS_PHONE
                + '. (If you opened the file directly, run it through Live Server so the browser can read data/products.json.)'));
            countBox.textContent = '';
        });

    searchBox.addEventListener('input', render);
    categoryBox.addEventListener('change', render);
    sortBox.addEventListener('change', render);
    resetButton.addEventListener('click', resetFilters);
}

/* --------------------------------------------------------------------------
   5. ENQUIRY FORM
   Validation, then an AJAX look-up of the price list to build a quote and an
   availability message for the chosen product, quantity and date.
   -------------------------------------------------------------------------- */

function getSelectedProduct() {
    let productId;

    productId = document.getElementById('product').value;
    return enquiryProducts.find(function (product) {
        return product.id === productId;
    });
}

/* Notice needed for the current choice; "Other" enquiries need one day. */
function getLeadDays() {
    let product;

    product = getSelectedProduct();
    if (document.getElementById('event-type').value === 'other' || !product) {
        return 1;
    }
    return product.leadDays;
}

function checkProduct(field) {
    return field.value === '' ? 'Please choose the product you are enquiring about.' : '';
}

function checkQuantity(field) {
    let value, number;

    value = field.value.trim();
    if (value === '') {
        return 'Please enter a quantity.';
    }
    number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 500) {
        return 'Enter a whole number between 1 and 500.';
    }
    return '';
}

function checkEventDate(field) {
    let chosen, earliest, latest, lead;

    if (field.value === '') {
        return 'Please choose the date you need your order.';
    }
    chosen = parseIsoDate(field.value);
    if (isNaN(chosen.getTime())) {
        return 'Please enter a valid date.';
    }
    lead = getLeadDays();
    earliest = addDays(startOfToday(), lead);
    latest = addDays(startOfToday(), MAX_BOOKING_DAYS);
    if (chosen < earliest) {
        return 'This order needs at least ' + lead + (lead === 1 ? ' day' : ' days')
            + ' notice. The earliest date is ' + formatLongDate(earliest) + '.';
    }
    if (chosen > latest) {
        return 'Please choose a date within the next 12 months.';
    }
    return '';
}

const ENQUIRY_RULES = {
    'name': checkName,
    'email': checkEmail,
    'phone': checkPhone,
    'event-type': checkSelect,
    'product': checkProduct,
    'quantity': checkQuantity,
    'event-date': checkEventDate,
    'message': function (field) {
        return checkText(field, 'enquiry details', 10, 1000);
    }
};

/* Refills the product drop-down for the chosen type of enquiry. */
function populateProductSelect() {
    let eventType, productSelect, matching;

    eventType = document.getElementById('event-type').value;
    productSelect = document.getElementById('product');
    matching = enquiryProducts.filter(function (product) {
        return product.category === eventType;
    });

    productSelect.replaceChildren();
    matching.forEach(function (product) {
        let option;

        option = makeEl('option', '',
            product.name + ' - ' + (product.pricing === 'from' ? 'from ' : '') + formatRand(product.price));
        option.value = product.id;
        productSelect.appendChild(option);
    });
}

/* Shows or hides the product and quantity fields ("Other" has neither). */
function toggleProductFields() {
    let isOther;

    isOther = document.getElementById('event-type').value === 'other';
    document.querySelectorAll('[data-product-only]').forEach(function (element) {
        element.hidden = isOther;
    });
}

/* Keeps the date picker, date hint and quantity label in step with the product. */
function updateOrderConstraints() {
    let product, dateField, hint, label, earliest, latest;

    product = getSelectedProduct();
    dateField = document.getElementById('event-date');
    hint = document.getElementById('event-date-hint');
    label = document.getElementById('quantity-label');
    earliest = addDays(startOfToday(), getLeadDays());
    latest = addDays(startOfToday(), MAX_BOOKING_DAYS);

    dateField.min = toIsoDate(earliest);
    dateField.max = toIsoDate(latest);
    hint.textContent = 'Earliest date for this order: ' + formatLongDate(earliest) + '.';
    label.textContent = product && document.getElementById('event-type').value !== 'other'
        ? 'Quantity (' + product.unitNoun + ')'
        : 'Quantity';
}

/* Works out the estimated cost for a product and quantity. */
function buildQuote(product, quantity) {
    let total, note;

    total = product.price * quantity;
    note = product.pricing === 'from'
        ? 'This is a starting price. The final price depends on size, flavours and decoration and is confirmed in your written quote.'
        : 'This is the price for the quantity requested. It is confirmed in your written quote.';
    return {
        text: (product.pricing === 'from' ? 'From ' : '') + formatRand(total),
        note: note
    };
}

/* Replaces the form with the response panel. */
function showEnquiryResult(values, product) {
    let panel, form, list, quote, rows, firstName, earliestOk, reference, today, availability, resetButton;

    panel = document.getElementById('enquiry-result');
    form = document.getElementById('enquiry-form');
    firstName = values.name.split(/\s+/)[0];
    today = new Date();
    reference = 'TK-' + toIsoDate(today).replace(/-/g, '') + '-' + String(Math.floor(1000 + Math.random() * 9000));
    rows = [['Reference', reference], ['Enquiry type', values.typeLabel]];

    if (product) {
        quote = buildQuote(product, values.quantity);
        earliestOk = addDays(startOfToday(), product.leadDays);
        availability = 'Your date (' + formatLongDate(parseIsoDate(values.date)) + ') meets our '
            + product.leadDays + '-day lead time for ' + product.name
            + '. We can usually accommodate it, and we will confirm availability by email or phone within 24 hours. '
            + 'The earliest available date for this product is ' + formatLongDate(earliestOk) + '.';
        rows.push(['Product', product.name]);
        rows.push(['Quantity', values.quantity + ' ' + product.unitNoun]);
        rows.push(['Date needed', formatLongDate(parseIsoDate(values.date))]);
        rows.push(['Estimated cost', quote.text]);
    } else {
        quote = null;
        availability = 'We will review your request for ' + formatLongDate(parseIsoDate(values.date))
            + ' and reply within 24 hours with availability and pricing.';
        rows.push(['Date needed', formatLongDate(parseIsoDate(values.date))]);
    }

    panel.replaceChildren();
    panel.appendChild(makeEl('h2', '', 'Thank you, ' + firstName + '!'));
    panel.appendChild(makeEl('p', '', 'We have received your enquiry. Here is a summary and our first response.'));

    list = makeEl('dl', 'result-list');
    rows.forEach(function (row) {
        list.appendChild(makeEl('dt', '', row[0]));
        list.appendChild(makeEl('dd', '', row[1]));
    });
    panel.appendChild(list);

    if (quote) {
        panel.appendChild(makeEl('p', 'result-note', quote.note));
    }
    panel.appendChild(makeEl('h3', '', 'Availability'));
    panel.appendChild(makeEl('p', '', availability));
    panel.appendChild(makeEl('p', '',
        'We will contact you on ' + values.email + ' or ' + values.phone + '. Quote the reference above if you call us on '
        + BUSINESS_PHONE + '.'));

    resetButton = makeEl('button', '', 'Make another enquiry');
    resetButton.type = 'button';
    resetButton.addEventListener('click', function () {
        panel.hidden = true;
        form.hidden = false;
        form.reset();
        clearFormErrors(form);
        populateProductSelect();
        toggleProductFields();
        updateOrderConstraints();
        document.getElementById('name').focus();
    });
    panel.appendChild(resetButton);

    form.hidden = true;
    panel.hidden = false;
    panel.focus();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initEnquiry() {
    let form, typeSelect, productSelect, status, params;

    form = document.getElementById('enquiry-form');
    typeSelect = document.getElementById('event-type');
    productSelect = document.getElementById('product');
    status = document.getElementById('enquiry-status');
    params = new URLSearchParams(window.location.search);

    attachLiveValidation(ENQUIRY_RULES);

    typeSelect.addEventListener('change', function () {
        populateProductSelect();
        toggleProductFields();
        updateOrderConstraints();
        validateField(document.getElementById('event-date'), checkEventDate);
    });
    productSelect.addEventListener('change', function () {
        updateOrderConstraints();
        if (document.getElementById('event-date').value !== '') {
            validateField(document.getElementById('event-date'), checkEventDate);
        }
    });

    /* AJAX: load the price list, then fill the product drop-down. */
    loadCatalogue()
        .then(function (data) {
            let wanted;

            enquiryProducts = data.products;

            /* enquiry.html?product=wedding-cake pre-selects that product. */
            wanted = enquiryProducts.find(function (product) {
                return product.id === params.get('product');
            });
            if (wanted) {
                typeSelect.value = wanted.category;
            }
            populateProductSelect();
            if (wanted) {
                productSelect.value = wanted.id;
            }
            toggleProductFields();
            updateOrderConstraints();
        })
        .catch(function (error) {
            console.warn(error.message);
            status.textContent = "We couldn't load our price list. Please refresh the page or call " + BUSINESS_PHONE + '.';
            status.classList.add('is-error');
        });

    form.addEventListener('submit', function (event) {
        let values, isOther, typeLabel;

        event.preventDefault();
        if (!validateAll(ENQUIRY_RULES, status)) {
            return;
        }

        isOther = typeSelect.value === 'other';
        typeLabel = typeSelect.options[typeSelect.selectedIndex].text;
        values = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            typeLabel: typeLabel,
            quantity: isOther ? 0 : Number(document.getElementById('quantity').value),
            date: document.getElementById('event-date').value
        };

        /* Re-read the price list (cached after the first load) and respond. */
        loadCatalogue()
            .then(function () {
                showEnquiryResult(values, isOther ? null : getSelectedProduct());
            })
            .catch(function () {
                status.textContent = "We couldn't calculate your quote right now. Please try again or call " + BUSINESS_PHONE + '.';
                status.classList.add('is-error');
            });
    });
}

/* --------------------------------------------------------------------------
   6. CONTACT FORM: validation, then a ready-to-send email using mailto:
   -------------------------------------------------------------------------- */

const CONTACT_RULES = {
    'c-name': checkName,
    'c-email': checkEmail,
    'c-phone': checkOptionalPhone,
    'c-type': checkSelect,
    'c-message': function (field) {
        return checkText(field, 'message', 10, 1000);
    }
};

/* Builds the subject, body and mailto: link from the validated values. */
function composeEmail(values) {
    let subject, lines, body, href;

    subject = '[' + values.type + '] Website message from ' + values.name;
    lines = [
        "Hello Thandeka's Kitchen,",
        '',
        values.message,
        '',
        '---',
        'Name: ' + values.name,
        'Email: ' + values.email,
        'Phone: ' + (values.phone === '' ? 'Not provided' : values.phone),
        'Message type: ' + values.type,
        'Sent from the website contact form'
    ];
    body = lines.join('\r\n');
    href = 'mailto:' + BUSINESS_EMAIL
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);
    return { subject: subject, body: body, href: href };
}

function showContactResult(email) {
    let panel, form, preview, openLink, resetButton;

    panel = document.getElementById('contact-result');
    form = document.getElementById('contact-form');

    panel.replaceChildren();
    panel.appendChild(makeEl('h3', '', 'Your email is ready'));
    panel.appendChild(makeEl('p', '',
        'Your email app should now open with this message addressed to ' + BUSINESS_EMAIL
        + '. Press Send in your email app to deliver it. Nothing is sent until you do.'));

    preview = makeEl('pre', 'email-preview', 'To: ' + BUSINESS_EMAIL + '\nSubject: ' + email.subject + '\n\n' + email.body);
    panel.appendChild(preview);

    openLink = makeEl('a', 'cta-button', 'Open my email app again');
    openLink.href = email.href;
    panel.appendChild(openLink);

    resetButton = makeEl('button', '', 'Write another message');
    resetButton.type = 'button';
    resetButton.addEventListener('click', function () {
        panel.hidden = true;
        form.hidden = false;
        form.reset();
        clearFormErrors(form);
        document.getElementById('c-name').focus();
    });
    panel.appendChild(resetButton);

    form.hidden = true;
    panel.hidden = false;
    panel.focus();
}

function initContact() {
    let form, status;

    form = document.getElementById('contact-form');
    status = document.getElementById('contact-status');
    attachLiveValidation(CONTACT_RULES);

    form.addEventListener('submit', function (event) {
        let email, typeSelect;

        event.preventDefault();
        if (!validateAll(CONTACT_RULES, status)) {
            return;
        }
        typeSelect = document.getElementById('c-type');
        email = composeEmail({
            name: document.getElementById('c-name').value.trim(),
            email: document.getElementById('c-email').value.trim(),
            phone: document.getElementById('c-phone').value.trim(),
            type: typeSelect.options[typeSelect.selectedIndex].text,
            message: document.getElementById('c-message').value.trim()
        });
        showContactResult(email);
        window.location.href = email.href;
    });
}

/* --------------------------------------------------------------------------
   7. ACCORDION (FAQ on the enquiry page)
   One answer open at a time. Buttons keep it keyboard accessible, and
   aria-expanded tells screen readers the current state.
   -------------------------------------------------------------------------- */

function setAccordionItem(trigger, open) {
    let panel;

    panel = document.getElementById(trigger.getAttribute('aria-controls'));
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
}

function initAccordion() {
    let triggers;

    triggers = document.querySelectorAll('.accordion-trigger');
    triggers.forEach(function (trigger) {
        trigger.addEventListener('click', function () {
            let willOpen;

            willOpen = trigger.getAttribute('aria-expanded') === 'false';
            triggers.forEach(function (other) {
                setAccordionItem(other, false);
            });
            setAccordionItem(trigger, willOpen);
        });
    });
}

/* --------------------------------------------------------------------------
   8. GALLERY LIGHTBOX
   Click or press Enter on a photo to open it large. Arrow keys or the
   buttons move between photos, Escape or a click outside closes it, and
   a swipe works on touch screens.
   -------------------------------------------------------------------------- */

function initLightbox() {
    let images, overlay, bigImage, caption, counter, closeButton, prevButton, nextButton, figure;
    let currentIndex, lastFocused, touchStartX, isOpen;

    images = Array.from(document.querySelectorAll('.gallery-grid img'));
    currentIndex = 0;
    lastFocused = null;
    touchStartX = 0;
    isOpen = false;

    /* Build the viewer once. */
    overlay = makeEl('div', 'lightbox');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image viewer');
    closeButton = makeEl('button', 'lightbox-close', '\u00D7');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close image viewer');
    prevButton = makeEl('button', 'lightbox-nav lightbox-prev', '\u2039');
    prevButton.type = 'button';
    prevButton.setAttribute('aria-label', 'Previous image');
    nextButton = makeEl('button', 'lightbox-nav lightbox-next', '\u203A');
    nextButton.type = 'button';
    nextButton.setAttribute('aria-label', 'Next image');
    figure = makeEl('figure', 'lightbox-figure');
    bigImage = makeEl('img', 'lightbox-image');
    caption = makeEl('figcaption', 'lightbox-caption');
    counter = makeEl('span', 'lightbox-counter');
    caption.appendChild(counter);
    figure.appendChild(bigImage);
    figure.appendChild(caption);
    overlay.appendChild(closeButton);
    overlay.appendChild(prevButton);
    overlay.appendChild(figure);
    overlay.appendChild(nextButton);
    document.body.appendChild(overlay);

    function show(index) {
        let source;

        currentIndex = (index + images.length) % images.length;
        source = images[currentIndex];
        bigImage.src = source.getAttribute('src');   /* the full-size file, not the 800px copy */
        bigImage.alt = source.alt;
        counter.textContent = (currentIndex + 1) + ' of ' + images.length;
        caption.replaceChildren(document.createTextNode(source.alt), makeEl('br'), counter);
    }

    function open(index) {
        lastFocused = document.activeElement;
        show(index);
        overlay.classList.add('is-open');
        document.body.classList.add('no-scroll');
        isOpen = true;
        closeButton.focus();
    }

    function close() {
        overlay.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
        isOpen = false;
        if (lastFocused) {
            lastFocused.focus();
        }
    }

    images.forEach(function (image, index) {
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
        image.setAttribute('aria-haspopup', 'dialog');
        image.setAttribute('aria-label', 'Enlarge photo: ' + image.alt);
        image.addEventListener('click', function () {
            open(index);
        });
        image.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open(index);
            }
        });
    });

    closeButton.addEventListener('click', close);
    prevButton.addEventListener('click', function () { show(currentIndex - 1); });
    nextButton.addEventListener('click', function () { show(currentIndex + 1); });

    /* A click on the dark backdrop (not the photo or buttons) closes the viewer. */
    overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
            close();
        }
    });

    /* Keyboard: Escape, arrows, and Tab kept inside the viewer. */
    document.addEventListener('keydown', function (event) {
        let focusable, first, last;

        if (!isOpen) {
            return;
        }
        if (event.key === 'Escape') {
            close();
        } else if (event.key === 'ArrowLeft') {
            show(currentIndex - 1);
        } else if (event.key === 'ArrowRight') {
            show(currentIndex + 1);
        } else if (event.key === 'Tab') {
            focusable = [closeButton, prevButton, nextButton];
            first = focusable[0];
            last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    /* Swipe left or right on touch screens. */
    overlay.addEventListener('touchstart', function (event) {
        touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    overlay.addEventListener('touchend', function (event) {
        let distance;

        distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) > 50) {
            show(distance > 0 ? currentIndex - 1 : currentIndex + 1);
        }
    }, { passive: true });
}

/* --------------------------------------------------------------------------
   9. INTERACTIVE MAP (Leaflet + OpenStreetMap tiles)
   Both locations get a marker and popup; the buttons above the map fly to
   each one.
   -------------------------------------------------------------------------- */

function buildPopup(location) {
    let box, phoneLink, directions;

    box = makeEl('div', 'map-popup');
    box.appendChild(makeEl('strong', '', location.name));
    box.appendChild(makeEl('br'));
    box.appendChild(document.createTextNode(location.address));
    box.appendChild(makeEl('br'));
    phoneLink = makeEl('a', '', BUSINESS_PHONE);
    phoneLink.href = 'tel:+27115550192';
    box.appendChild(phoneLink);
    box.appendChild(makeEl('br'));
    directions = makeEl('a', '', 'Get directions');
    directions.href = 'https://www.google.com/maps/dir/?api=1&destination=' + location.lat + ',' + location.lng;
    directions.target = '_blank';
    directions.rel = 'noopener noreferrer';
    box.appendChild(directions);
    return box;
}

function initMap() {
    let container, map, markers, bounds, buttons;

    container = document.getElementById('map-embed');
    markers = {};
    bounds = [];
    buttons = document.querySelectorAll('.map-focus');

    /* If the Leaflet library did not load (offline, blocked), show a useful fallback. */
    if (typeof L === 'undefined') {
        container.replaceChildren(makeEl('p', 'map-fallback',
            'The interactive map could not load. Our addresses are listed above, or search them on Google Maps.'));
        return;
    }

    container.replaceChildren();
    map = L.map(container, { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    LOCATIONS.forEach(function (location) {
        let marker;

        marker = L.marker([location.lat, location.lng], { title: location.name, alt: location.name }).addTo(map);
        marker.bindPopup(buildPopup(location));
        markers[location.id] = marker;
        bounds.push([location.lat, location.lng]);
    });
    map.fitBounds(bounds, { padding: [50, 50] });

    /* Scroll-wheel zoom only while the map has focus, so it never traps page scrolling. */
    map.on('focus', function () { map.scrollWheelZoom.enable(); });
    map.on('blur', function () { map.scrollWheelZoom.disable(); });

    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            let id, location;

            id = button.getAttribute('data-location');
            location = LOCATIONS.find(function (item) {
                return item.id === id;
            });
            map.flyTo([location.lat, location.lng], 15);
            markers[id].openPopup();
        });
    });
}

/* --------------------------------------------------------------------------
   10. SCROLL-REVEAL ANIMATION
   Sections fade up as they enter the view. Only runs when the browser
   supports IntersectionObserver, so no content is ever hidden without it.
   -------------------------------------------------------------------------- */

function initReveal() {
    let targets, observer;

    if (!('IntersectionObserver' in window)) {
        return;
    }
    targets = document.querySelectorAll('main > section:not(.hero):not([hidden]), main > .product-tools');
    observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    targets.forEach(function (target) {
        target.classList.add('reveal');
        observer.observe(target);
    });
}

/* --------------------------------------------------------------------------
   11. START-UP
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    if (document.getElementById('product-list')) { initProducts(); }
    if (document.getElementById('enquiry-form')) { initEnquiry(); }
    if (document.getElementById('contact-form')) { initContact(); }
    if (document.querySelector('.accordion-trigger')) { initAccordion(); }
    if (document.querySelector('.gallery-grid')) { initLightbox(); }
    if (document.getElementById('map-embed')) { initMap(); }
});
