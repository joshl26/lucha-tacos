// cart-ui.js
// ES module to wire cart UI to cart.js (single source of truth, uses configurable storage in cart.js)

import { cart } from "./cart.js";

const CART_BUTTON_ID = "site-cart-button";
const CART_MODAL_ID = "site-cart-modal";
const CHECKOUT_MODAL_ID = "cart-checkout-modal";
const CART_ANNOUNCER_ID = "cart-announcer";
const TOAST_CONTAINER_ID = "cart-toast-container";

function createCartButton() {
  if (document.getElementById(CART_BUTTON_ID)) return;

  const btn = document.createElement("button");
  btn.id = CART_BUTTON_ID;
  btn.className = "cart-button";
  btn.setAttribute("aria-label", "Open cart — 0 items");
  btn.setAttribute("aria-haspopup", "dialog");
  btn.type = "button";

  btn.innerHTML = `
    <span class="cart-icon" aria-hidden="true">🧾</span>
    <span class="cart-badge" aria-hidden="true">0</span>
  `;

  const header =
    document.querySelector("header") ||
    document.querySelector("nav") ||
    document.body;
  header.prepend(btn);

  btn.addEventListener("click", () => openCartModal());
}

function createAnnouncer() {
  if (document.getElementById(CART_ANNOUNCER_ID)) return;
  const div = document.createElement("div");
  div.id = CART_ANNOUNCER_ID;
  div.setAttribute("aria-live", "polite");
  div.className = "sr-only";
  document.body.appendChild(div);
}

function ensureToastContainer() {
  if (document.getElementById(TOAST_CONTAINER_ID)) return;
  const c = document.createElement("div");
  c.id = TOAST_CONTAINER_ID;
  c.className = "cart-toast-container";
  c.setAttribute("aria-live", "polite");
  document.body.appendChild(c);
}

function showToast(message, opts = {}) {
  ensureToastContainer();
  const container = document.getElementById(TOAST_CONTAINER_ID);
  const toast = document.createElement("div");
  toast.className = "cart-toast";
  toast.role = "status";
  toast.textContent = message;
  container.appendChild(toast);
  const timeout = opts.timeout || 3000;
  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => container.removeChild(toast), 300);
  }, timeout);
}

function buildCartModalHtml() {
  return `
  <div class="cart-modal-backdrop"></div>
  <div class="cart-modal" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1">
    <div class="cart-modal-header">
      <h2 id="cart-title">Your Cart</h2>
      <button class="cart-modal-close" aria-label="Close cart">&times;</button>
    </div>
    <div class="cart-modal-body">
      <div class="cart-items" id="cart-items"></div>
      <div class="cart-empty" id="cart-empty" hidden>
        <p>Your cart is empty.</p>
        <a href="#menu" class="btn btn-primary">View menu</a>
      </div>
    </div>
    <div class="cart-modal-footer">
      <div class="cart-subtotal" id="cart-subtotal"></div>
      <div class="cart-actions">
        <button class="btn btn-secondary cart-clear">Clear</button>
        <button class="btn btn-primary cart-checkout">Proceed to Checkout</button>
      </div>
    </div>
  </div>
  `;
}

function ensureCartModalExists() {
  if (document.getElementById(CART_MODAL_ID)) return;
  const wrapper = document.createElement("div");
  wrapper.id = CART_MODAL_ID;
  wrapper.className = "cart-modal-wrapper";
  wrapper.innerHTML = buildCartModalHtml();
  document.body.appendChild(wrapper);

  wrapper
    .querySelector(".cart-modal-close")
    .addEventListener("click", closeCartModal);
  wrapper.querySelector(".cart-clear").addEventListener("click", () => {
    cart.clearCart();
    updateCartUI();
    announce("Cart cleared");
    showToast("Cart cleared");
  });
  wrapper.querySelector(".cart-checkout").addEventListener("click", () => {
    // Open checkout modal
    openCheckoutModal();
  });
}

function openCartModal() {
  ensureCartModalExists();
  const wrapper = document.getElementById(CART_MODAL_ID);
  wrapper.classList.add("open");
  const dialog = wrapper.querySelector(".cart-modal");
  dialog.focus();
  trapFocus(dialog);
  document.body.classList.add("cart-open");
  updateCartUI();
}

function closeCartModal() {
  const wrapper = document.getElementById(CART_MODAL_ID);
  if (!wrapper) return;
  wrapper.classList.remove("open");
  document.body.classList.remove("cart-open");
  releaseFocusTrap();
  const btn = document.getElementById(CART_BUTTON_ID);
  if (btn) btn.focus();
}

/* --- Checkout modal --- */

function buildCheckoutModalHtml() {
  return `
  <div class="checkout-modal-backdrop"></div>
  <div class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" tabindex="-1">
    <div class="checkout-modal-header">
      <h2 id="checkout-title">Checkout</h2>
      <button class="checkout-modal-close" aria-label="Close checkout">&times;</button>
    </div>
    <div class="checkout-modal-body">
      <section class="checkout-summary" aria-labelledby="checkout-summary-heading">
        <h3 id="checkout-summary-heading">Order Summary</h3>
        <div id="checkout-items" class="checkout-items"></div>
        <div id="checkout-subtotal" class="checkout-subtotal" aria-live="polite"></div>
      </section>

      <section class="checkout-contact" aria-labelledby="checkout-contact-heading">
        <h3 id="checkout-contact-heading">Contact & Delivery</h3>
        <form id="checkout-form" novalidate>
          <label>
            Full name *
            <input type="text" name="name" id="checkout-name" required autocomplete="name" />
          </label>
          <label>
            Email (or) Phone *
            <input type="text" name="contact" id="checkout-contact" required autocomplete="email tel" />
          </label>
          <label>
            Delivery address (optional)
            <textarea name="address" id="checkout-address" rows="3" ></textarea>
          </label>
          <div class="checkout-form-actions">
            <button type="button" class="btn btn-secondary checkout-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary checkout-confirm">Confirm Order</button>
          </div>
        </form>
      </section>
    </div>
  </div>
  `;
}

function ensureCheckoutModalExists() {
  if (document.getElementById(CHECKOUT_MODAL_ID)) return;
  const wrapper = document.createElement("div");
  wrapper.id = CHECKOUT_MODAL_ID;
  wrapper.className = "checkout-modal-wrapper";
  wrapper.innerHTML = buildCheckoutModalHtml();
  document.body.appendChild(wrapper);

  wrapper
    .querySelector(".checkout-modal-close")
    .addEventListener("click", closeCheckoutModal);
  wrapper
    .querySelector(".checkout-cancel")
    .addEventListener("click", closeCheckoutModal);

  const form = wrapper.querySelector("#checkout-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleCheckoutSubmit(form);
  });
}

function openCheckoutModal() {
  // close cart modal first to keep single-modal UX
  closeCartModal();

  ensureCheckoutModalExists();
  const wrapper = document.getElementById(CHECKOUT_MODAL_ID);
  wrapper.classList.add("open");
  const dialog = wrapper.querySelector(".checkout-modal");
  dialog.focus();
  trapFocus(dialog);
  document.body.classList.add("checkout-open");
  updateCheckoutSummary(); // render current cart summary into modal
}

function closeCheckoutModal() {
  const wrapper = document.getElementById(CHECKOUT_MODAL_ID);
  if (!wrapper) return;
  wrapper.classList.remove("open");
  document.body.classList.remove("checkout-open");
  releaseFocusTrap();
  const cartBtn = document.getElementById(CART_BUTTON_ID);
  if (cartBtn) cartBtn.focus();
}

function updateCheckoutSummary() {
  const itemsContainer = document.getElementById("checkout-items");
  const subtotalEl = document.getElementById("checkout-subtotal");
  if (!itemsContainer || !subtotalEl) return;
  const s = cart.getSummary();
  itemsContainer.innerHTML = "";
  if (!s.items || s.items.length === 0) {
    itemsContainer.innerHTML = `<p>Your cart is empty.</p>`;
  } else {
    for (const it of s.items) {
      const row = document.createElement("div");
      row.className = "checkout-item";
      row.innerHTML = `
        <div class="checkout-item-name">${escapeHtml(
          it.name
        )} <small class="muted">x${it.qty}</small></div>
        <div class="checkout-item-price">$${formatPrice(
          it.priceCents * it.qty
        )}</div>
      `;
      itemsContainer.appendChild(row);
    }
  }
  subtotalEl.innerHTML = `<strong>Subtotal:</strong> $${formatPrice(
    s.subtotalCents
  )}`;
}

/* Checkout form validation + submit handling */
function handleCheckoutSubmit(formEl) {
  const nameInput = formEl.querySelector("#checkout-name");
  const contactInput = formEl.querySelector("#checkout-contact");
  const addressInput = formEl.querySelector("#checkout-address");

  const name = (nameInput.value || "").trim();
  const contact = (contactInput.value || "").trim();
  const address = (addressInput.value || "").trim();

  let valid = true;
  clearFieldErrors(formEl);

  if (!name) {
    showFieldError(nameInput, "Please enter your name");
    valid = false;
  }

  if (!contact) {
    showFieldError(contactInput, "Please enter an email or phone number");
    valid = false;
  } else {
    // basic contact validation: email or phone-like
    const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const phoneLike = /^[0-9 \-\+\(\)]{6,}$/.test(contact);
    if (!emailLike && !phoneLike) {
      showFieldError(contactInput, "Enter a valid email or phone number");
      valid = false;
    }
  }

  if (!valid) {
    announce("Please correct the highlighted fields");
    return;
  }

  // All good — emit event with cart summary and contact info
  const summary = cart.getSummary();
  const payload = {
    summary,
    customer: { name, contact, address },
    timestamp: new Date().toISOString(),
  };

  // Emit event for host application to handle (server call, payments, etc.)
  window.dispatchEvent(new CustomEvent("cart:checkout", { detail: payload }));

  // Non-blocking placeholder UI
  showToast("Order placed (placeholder) — check console for event payload");
  announce("Order placed — thank you");

  // Close the modal after a short delay
  setTimeout(() => {
    closeCheckoutModal();
  }, 800);
}

function showFieldError(inputEl, message) {
  if (!inputEl) return;
  inputEl.classList.add("field-error");
  let err = inputEl.parentNode.querySelector(".field-error-msg");
  if (!err) {
    err = document.createElement("div");
    err.className = "field-error-msg";
    inputEl.parentNode.appendChild(err);
  }
  err.textContent = message;
}

function clearFieldErrors(formEl) {
  formEl
    .querySelectorAll(".field-error")
    .forEach((el) => el.classList.remove("field-error"));
  formEl.querySelectorAll(".field-error-msg").forEach((el) => el.remove());
}

/* --- End checkout modal --- */

function formatPrice(cents) {
  return (Number(cents) / 100).toFixed(2);
}

function renderCartItems(container) {
  const summary = cart.getSummary();
  const items = summary.items;
  container.innerHTML = "";
  if (!items || items.length === 0) {
    const emptyEl = document.getElementById("cart-empty");
    if (emptyEl) emptyEl.hidden = false;
    return;
  }
  const emptyEl = document.getElementById("cart-empty");
  if (emptyEl) emptyEl.hidden = true;

  for (const it of items) {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.itemId = it.id;
    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(it.name)}</div>
        <div class="cart-item-controls">
          <button class="qty-decrease" aria-label="Decrease quantity for ${escapeHtml(
            it.name
          )}">−</button>
          <input class="qty-input" type="number" inputmode="numeric" min="0" value="${
            it.qty
          }" aria-label="Quantity for ${escapeHtml(it.name)}">
          <button class="qty-increase" aria-label="Increase quantity for ${escapeHtml(
            it.name
          )}">+</button>
          <button class="remove-item" aria-label="Remove ${escapeHtml(
            it.name
          )}">Remove</button>
        </div>
      </div>
      <div class="cart-item-price">$${formatPrice(it.priceCents)}</div>
    `;
    const dec = row.querySelector(".qty-decrease");
    const inc = row.querySelector(".qty-increase");
    const input = row.querySelector(".qty-input");
    const rem = row.querySelector(".remove-item");

    dec.addEventListener("click", () => {
      const current = Number(input.value || 0);
      const newQty = Math.max(0, current - 1);
      cart.updateQty(it.id, newQty);
      updateCartUI();
      announce(`${it.name} quantity updated to ${newQty}`);
      showToast(`${it.name} quantity: ${newQty}`);
    });
    inc.addEventListener("click", () => {
      const current = Number(input.value || 0);
      const newQty = current + 1;
      cart.updateQty(it.id, newQty);
      updateCartUI();
      announce(`${it.name} quantity updated to ${newQty}`);
      showToast(`${it.name} quantity: ${newQty}`);
    });
    input.addEventListener("change", (e) => {
      const v = Math.max(0, Number(e.target.value || 0));
      cart.updateQty(it.id, v);
      updateCartUI();
      announce(`${it.name} quantity updated to ${v}`);
      showToast(`${it.name} quantity: ${v}`);
    });
    rem.addEventListener("click", () => {
      cart.removeItem(it.id);
      updateCartUI();
      announce(`${it.name} removed from cart`);
      showToast(`${it.name} removed`);
    });

    container.appendChild(row);
  }
}

function updateCartBadge() {
  const existingCountEl = document.querySelector(".cart-count");
  const qty = cart.getTotalQty();

  if (existingCountEl) {
    existingCountEl.textContent = `Cart (${qty})`;
  }

  const btn = document.getElementById(CART_BUTTON_ID);
  if (btn) {
    const badge = btn.querySelector(".cart-badge");
    if (badge) badge.textContent = qty;
    btn.setAttribute(
      "aria-label",
      `Open cart — ${qty} item${qty !== 1 ? "s" : ""}`
    );
  }
}

function updateCartUI() {
  updateCartBadge();
  const wrapper = document.getElementById(CART_MODAL_ID);
  if (!wrapper) return;
  const itemsContainer = wrapper.querySelector("#cart-items");
  renderCartItems(itemsContainer);
  const subtotalEl = wrapper.querySelector("#cart-subtotal");
  const s = cart.getSummary();
  if (subtotalEl)
    subtotalEl.innerHTML = `<strong>Subtotal:</strong> $${formatPrice(
      s.subtotalCents
    )}`;
}

function announce(text) {
  const ann = document.getElementById(CART_ANNOUNCER_ID);
  if (!ann) return;
  ann.textContent = text;
  setTimeout(() => {
    ann.textContent = "";
  }, 2000);
}

/* Focus trap */
let _previouslyFocused = null;
let _trapActive = false;
let _trapElement = null;
function trapFocus(el) {
  if (_trapActive) return;
  _trapActive = true;
  _trapElement = el;
  _previouslyFocused = document.activeElement;
  document.addEventListener("keydown", _onKeyDown, true);
}
function releaseFocusTrap() {
  if (!_trapActive) return;
  _trapActive = false;
  _trapElement = null;
  document.removeEventListener("keydown", _onKeyDown, true);
  if (_previouslyFocused && typeof _previouslyFocused.focus === "function") {
    _previouslyFocused.focus();
  }
}
function _onKeyDown(e) {
  if (!_trapActive || !_trapElement) return;
  if (e.key === "Escape") {
    e.preventDefault();
    // If checkout is open, close it; else close cart
    if (
      document.getElementById(CHECKOUT_MODAL_ID) &&
      document.getElementById(CHECKOUT_MODAL_ID).classList.contains("open")
    ) {
      closeCheckoutModal();
    } else {
      closeCartModal();
    }
    return;
  }
  if (e.key === "Tab") {
    const focusable = _trapElement.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Auto-wire add-to-cart buttons:
   - Buttons should have class `.add-to-cart`
   - Use data attributes: data-id, data-name, data-price-cents (or data-price)
   - Optional: data-qty (or cart-ui will default to 1)
*/
function wireAddToCartButtons() {
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    if (btn.dataset.cartWired) return;
    btn.dataset.cartWired = "1";
    btn.addEventListener("click", (e) => {
      const id = btn.dataset.id || btn.getAttribute("data-id");
      const name = btn.dataset.name || btn.getAttribute("data-name") || id;
      const qty = btn.dataset.qty ? Number(btn.dataset.qty) : 1;
      const priceCents =
        btn.dataset.priceCents || btn.getAttribute("data-price-cents") || null;
      const price = priceCents
        ? Number(priceCents)
        : btn.dataset.price || btn.getAttribute("data-price") || null;
      const item = { id, name };
      if (priceCents) item.priceCents = Number(priceCents);
      else if (price != null) item.price = Number(price);
      cart.addItem(item, qty);
      updateCartUI();
      announce(`${name} added to cart`);
      showToast(`${name} added (x${qty})`);
      const cartBtn = document.getElementById(CART_BUTTON_ID);
      if (cartBtn) {
        cartBtn.classList.add("bump");
        setTimeout(() => cartBtn.classList.remove("bump"), 300);
      }
    });
  });
}

/* react to global cart changes (e.g. other scripts / other tabs) */
window.addEventListener("cart:changed", (evt) => {
  updateCartUI();
});

// storage events will fire across tabs when using localStorage
window.addEventListener("storage", (e) => {
  if (e.key === "lucha_cart_v1") {
    updateCartUI();
    // If checkout modal is open, refresh its summary
    if (
      document.getElementById(CHECKOUT_MODAL_ID) &&
      document.getElementById(CHECKOUT_MODAL_ID).classList.contains("open")
    ) {
      updateCheckoutSummary();
    }
  }
});

export function initCartUI() {
  createCartButton();
  createAnnouncer();
  ensureCartModalExists();
  ensureCheckoutModalExists(); // create checkout modal upfront
  ensureToastContainer();
  updateCartUI();
  wireAddToCartButtons();

  const mo = new MutationObserver(() => {
    wireAddToCartButtons();
  });
  mo.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("cart:refresh", () => updateCartUI());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initCartUI());
} else {
  initCartUI();
}
