// cart-ui.js
// ES module to wire cart UI to cart.js (single source of truth)

import { cart } from "./cart.js";

const CART_BUTTON_ID = "site-cart-button";
const CART_MODAL_ID = "site-cart-modal";
const CART_ANNOUNCER_ID = "cart-announcer";

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

function buildModalHtml() {
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

function ensureModalExists() {
  if (document.getElementById(CART_MODAL_ID)) return;
  const wrapper = document.createElement("div");
  wrapper.id = CART_MODAL_ID;
  wrapper.className = "cart-modal-wrapper";
  wrapper.innerHTML = buildModalHtml();
  document.body.appendChild(wrapper);

  wrapper
    .querySelector(".cart-modal-close")
    .addEventListener("click", closeCartModal);
  wrapper.querySelector(".cart-clear").addEventListener("click", () => {
    cart.clearCart();
    updateCartUI();
    announce("Cart cleared");
  });
  wrapper.querySelector(".cart-checkout").addEventListener("click", () => {
    announce("Proceed to checkout — placeholder");
    alert("Proceed to checkout — not implemented in this demo");
  });
}

function openCartModal() {
  ensureModalExists();
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

function formatPrice(cents) {
  return (Number(cents) / 100).toFixed(2);
}

function renderCartItems(container) {
  const summary = cart.getSummary();
  const items = summary.items;
  container.innerHTML = "";
  if (!items || items.length === 0) {
    document.getElementById("cart-empty").hidden = false;
    return;
  }
  document.getElementById("cart-empty").hidden = true;

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
    row.querySelector(".qty-decrease").addEventListener("click", () => {
      const newQty = Math.max(0, Number(it.qty) - 1);
      cart.updateQty(it.id, newQty);
      updateCartUI();
      announce(`${it.name} quantity updated to ${newQty}`);
    });
    row.querySelector(".qty-increase").addEventListener("click", () => {
      const newQty = Number(it.qty) + 1;
      cart.updateQty(it.id, newQty);
      updateCartUI();
      announce(`${it.name} quantity updated to ${newQty}`);
    });
    row.querySelector(".qty-input").addEventListener("change", (e) => {
      const v = Math.max(0, Number(e.target.value || 0));
      cart.updateQty(it.id, v);
      updateCartUI();
      announce(`${it.name} quantity updated to ${v}`);
    });
    row.querySelector(".remove-item").addEventListener("click", () => {
      cart.removeItem(it.id);
      updateCartUI();
      announce(`${it.name} removed from cart`);
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
    closeCartModal();
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
      const cartBtn = document.getElementById(CART_BUTTON_ID);
      if (cartBtn) {
        cartBtn.classList.add("bump");
        setTimeout(() => cartBtn.classList.remove("bump"), 300);
      }
    });
  });
}

/* Public init function */
export function initCartUI() {
  createCartButton();
  createAnnouncer();
  ensureModalExists();
  updateCartUI();
  wireAddToCartButtons();

  const mo = new MutationObserver(() => {
    wireAddToCartButtons();
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // Listen for manual refresh events (optional)
  document.addEventListener("cart:refresh", () => updateCartUI());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initCartUI());
} else {
  initCartUI();
}
