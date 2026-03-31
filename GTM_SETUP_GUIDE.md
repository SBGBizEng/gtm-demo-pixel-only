# GTM Demo Sites — Setup & Testing Guide

This document outlines how to use the two demo e-commerce websites to test Google Tag Manager (GTM) skills, specifically focusing on Facebook Pixel and Conversions API (CAPI) integrations.

## Live Demo Environments

Both scenarios are hosted in a single GitHub repository and deployed via GitHub Pages.

*   **Repository:** [https://github.com/SBGBizEng/gtm-demo-pixel-only](https://github.com/SBGBizEng/gtm-demo-pixel-only)
*   **Live Landing Page:** [https://sbgbizeng.github.io/gtm-demo-pixel-only/](https://sbgbizeng.github.io/gtm-demo-pixel-only/)

---

## Scenario 1: Pixel Only (Browser-Side Events)

This scenario simulates a standard browser-side only integration using the Facebook Pixel.

### Site Architecture

The site is a simple e-commerce flow consisting of a product grid, product detail pages, a cart, a checkout form, and an order confirmation page. The `dataLayer` is populated with standard e-commerce events as the user navigates the site.

### dataLayer Events Fired

| dataLayer Event | Trigger Action | Expected Facebook Standard Event |
| :--- | :--- | :--- |
| `gtm.js` | Page load (All Pages) | `PageView` |
| `pixel_view_content` | Product detail page load | `ViewContent` |
| `pixel_add_to_cart` | Clicking "Add to Cart" | `AddToCart` |
| `pixel_initiate_checkout` | Checkout page load | `InitiateCheckout` |
| `pixel_purchase` | Clicking "Place Order" | `Purchase` |

### Testing Instructions

1.  **Create a GTM Web Container:** Set up a new GTM Web Container.
2.  **Update the Container ID:** In the repository, edit `scenario-1-pixel-only/index.html`, `product.html`, `cart.html`, `checkout.html`, and `confirmation.html` to replace `GTM-XXXXXXX` with your actual GTM Container ID.
3.  **Configure GTM Tags:**
    *   Install the [Facebook Pixel template by facebookarchive](https://tagmanager.google.com/gallery/#/owners/facebookarchive/templates/GoogleTagManager-WebTemplate-For-FacebookPixel).
    *   Create a base Pixel tag triggered on "All Pages" for the `PageView` event.
    *   Create custom event triggers for `pixel_view_content`, `pixel_add_to_cart`, `pixel_initiate_checkout`, and `pixel_purchase`.
    *   Create Data Layer Variables to extract `value`, `currency`, `content_ids`, `content_type`, etc., from the dataLayer pushes.
    *   Create Facebook Pixel tags for each custom event, mapping the Data Layer Variables to the corresponding object properties.
4.  **Preview and Verify:** Use GTM Preview mode and the Meta Pixel Helper browser extension to verify that events are firing correctly with the appropriate payload data.

---

## Scenario 2: Pixel + CAPI (Browser & Server Events)

This scenario simulates a hybrid integration where events are sent both from the browser (via Pixel) and from the server (via CAPI). It is intentionally designed with gaps (no deduplication, unhashed PII) to serve as a training exercise for implementing these features.

### Site Architecture

The site structure is identical to Scenario 1, but the JavaScript logic (`js/store.js`) pushes two sets of events to the `dataLayer`: one for the browser Pixel and one intended for the server CAPI container. Furthermore, the checkout page collects Personally Identifiable Information (PII) but does not forward it in the CAPI payload.

### dataLayer Events Fired

| dataLayer Event | Target Destination | Expected Facebook Standard Event |
| :--- | :--- | :--- |
| `gtm.js` | Browser (Pixel) | `PageView` |
| `pixel_view_content` | Browser (Pixel) | `ViewContent` |
| `capi_view_content` | Server (CAPI) | `ViewContent` |
| `pixel_add_to_cart` | Browser (Pixel) | `AddToCart` |
| `capi_add_to_cart` | Server (CAPI) | `AddToCart` |
| `pixel_initiate_checkout` | Browser (Pixel) | `InitiateCheckout` |
| `capi_initiate_checkout` | Server (CAPI) | `InitiateCheckout` |
| `pii_collected` | dataLayer only | N/A (Stores PII in `window.customerPII`) |
| `pixel_purchase` | Browser (Pixel) | `Purchase` |
| `capi_purchase` | Server (CAPI) | `Purchase` |

### Intentional Gaps for Training

This scenario is built as a "before" state for a GTM training exercise. The following elements are intentionally missing and must be implemented by the user:

1.  **No Deduplication:** Neither the browser nor the server events include an `event_id`. The user must generate a unique `event_id` (e.g., using a custom JavaScript variable or a GTM template) and append it to both the Pixel and CAPI tags for the same event instance.
2.  **PII Not Forwarded:** The checkout form collects PII (email, phone, name, address) and pushes it to the `dataLayer` via the `pii_collected` event. It is also stored globally in `window.customerPII`. However, the `capi_*` events do not include a `user_data` object. The user must configure GTM to extract this PII and map it to the CAPI tag's user data parameters.
3.  **No Hashing:** The PII collected is raw text. The user must implement SHA-256 hashing within GTM before sending the data to the Conversions API.

### Testing Instructions

1.  **Create GTM Containers:** Set up a GTM Web Container and a GTM Server Container.
2.  **Update the Container ID:** In the repository, edit the HTML files in `scenario-2-pixel-capi/` to replace `GTM-YYYYYYY` with your actual GTM Web Container ID.
3.  **Configure Web Container:**
    *   Set up the Facebook Pixel tags as in Scenario 1.
    *   Set up GA4 tags (or a custom HTTP request tag) triggered by the `capi_*` events to forward the event data to your GTM Server Container URL.
4.  **Configure Server Container:**
    *   Install the [Conversions API template by facebookincubator](https://tagmanager.google.com/gallery/#/owners/facebookincubator/templates/ConversionsAPI-Tag-for-GoogleTagManager).
    *   Configure the CAPI tag to trigger on the incoming requests from the Web Container.
    *   Provide your Conversions API Access Token and Pixel ID.
5.  **Implement Fixes:**
    *   Generate and apply an `event_id` to both browser and server tags for deduplication.
    *   Extract the PII from `window.customerPII` or the `dataLayer`, hash it using SHA-256, and map it to the `user_data` object in the CAPI tag.
6.  **Preview and Verify:** Use GTM Preview mode (for both Web and Server containers) and the Meta Events Manager Test Events tool to verify that events are deduplicated correctly and that hashed PII is being received by the Conversions API.
