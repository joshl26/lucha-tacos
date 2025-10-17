// cart-ui.js
// UI wiring for the cart module. Adds stable data-test attributes to enable reliable E2E tests.

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

  // Add data-test attributes expected by tests
  btn.setAttribute("data-test", "mini-cart-open");

  btn.innerHTML = `
    <span class="cart-icon" aria-hidden="true">🧾</span>
    <span class="cart-badge" aria-hidden="true" data-test="mini-cart-count">0</span>
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

/**
 * Show loading state on button
 */
function showButtonLoading(btn) {
  if (!btn) return;
  btn.classList.add("btn-loading");
  btn.disabled = true;
}

/**
 * Hide loading state on button
 */
function hideButtonLoading(btn) {
  if (!btn) return;
  btn.classList.remove("btn-loading");
  btn.disabled = false;
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
        <button class="btn btn-secondary cart-clear" data-test="cart-clear">Clear</button>
        <button class="btn btn-primary cart-checkout" data-test="checkout-button">Proceed to Checkout</button>
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

  wrapper.querySelector(".cart-clear").addEventListener("click", function () {
    showButtonLoading(this);
    setTimeout(() => {
      cart.clearCart();
      updateCartUI();
      announce("Cart cleared");
      showToast("Cart cleared");
      hideButtonLoading(this);
    }, 300);
  });

  wrapper
    .querySelector(".cart-checkout")
    .addEventListener("click", function () {
      showButtonLoading(this);
      setTimeout(() => {
        hideButtonLoading(this);
        openCheckoutModal();
      }, 300);
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
  closeCartModal();
  ensureCheckoutModalExists();
  const wrapper = document.getElementById(CHECKOUT_MODAL_ID);
  wrapper.classList.add("open");
  const dialog = wrapper.querySelector(".checkout-modal");
  dialog.focus();
  trapFocus(dialog);
  document.body.classList.add("checkout-open");
  updateCheckoutSummary();
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

function handleCheckoutSubmit(formEl) {
  const nameInput = formEl.querySelector("#checkout-name");
  const contactInput = formEl.querySelector("#checkout-contact");
  const addressInput = formEl.querySelector("#checkout-address");
  const submitBtn = formEl.querySelector(".checkout-confirm");

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

  showButtonLoading(submitBtn);
  setTimeout(() => {
    const summary = cart.getSummary();
    const payload = {
      summary,
      customer: { name, contact, address },
      timestamp: new Date().toISOString(),
    };

    window.dispatchEvent(new CustomEvent("cart:checkout", { detail: payload }));
    showToast("Order placed (placeholder) — check console for event payload");
    announce("Order placed — thank you");

    hideButtonLoading(submitBtn);
    setTimeout(() => {
      closeCheckoutModal();
    }, 800);
  }, 600);
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
    // data-test attribute for the item row so tests can target it:
    row.setAttribute("data-test", `cart-item-${it.id}`);

    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(it.name)}</div>
        <div class="cart-item-controls">
          <button class="qty-decrease" aria-label="Decrease quantity for ${escapeHtml(
            it.name
          )}" data-test="cart-decrement-${it.id}">−</button>
          <span class="qty-display" data-test="cart-qty-${it.id}">${
      it.qty
    }</span>
          <button class="qty-increase" aria-label="Increase quantity for ${escapeHtml(
            it.name
          )}" data-test="cart-increment-${it.id}">+</button>
          <button class="remove-item" aria-label="Remove ${escapeHtml(
            it.name
          )}" data-test="cart-remove-${it.id}">Remove</button>
        </div>
      </div>
      <div class="cart-item-price">$${formatPrice(it.priceCents)}</div>
    `;

    // hook up handlers using data-test attributes
    const dec = row.querySelector(`[data-test="cart-decrement-${it.id}"]`);
    const inc = row.querySelector(`[data-test="cart-increment-${it.id}"]`);
    const qtyDisplay = row.querySelector(`[data-test="cart-qty-${it.id}"]`);
    const rem = row.querySelector(`[data-test="cart-remove-${it.id}"]`);

    if (dec) {
      dec.addEventListener("click", function () {
        showButtonLoading(this);
        setTimeout(() => {
          const current = Number(qtyDisplay.textContent || 0);
          const newQty = Math.max(0, current - 1);
          cart.updateQty(it.id, newQty);
          updateCartUI();
          announce(`${it.name} quantity updated to ${newQty}`);
          showToast(`${it.name} quantity: ${newQty}`);
          hideButtonLoading(this);
        }, 200);
      });
    }

    if (inc) {
      inc.addEventListener("click", function () {
        showButtonLoading(this);
        setTimeout(() => {
          const current = Number(qtyDisplay.textContent || 0);
          const newQty = current + 1;
          cart.updateQty(it.id, newQty);
          updateCartUI();
          announce(`${it.name} quantity updated to ${newQty}`);
          showToast(`${it.name} quantity: ${newQty}`);
          hideButtonLoading(this);
        }, 200);
      });
    }

    if (rem) {
      rem.addEventListener("click", function () {
        showButtonLoading(this);
        setTimeout(() => {
          cart.removeItem(it.id);
          updateCartUI();
          announce(`${it.name} removed from cart`);
          showToast(`${it.name} removed`);
          hideButtonLoading(this);
        }, 200);
      });
    }

    container.appendChild(row);
  }
}

function updateCartBadge() {
  const qty = cart.getTotalQty();
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

/**
 * Wire add-to-cart buttons:
 * - derive a stable data-test attribute if one isn't provided
 * - attach click handlers only once per button
 */
function wireAddToCartButtons() {
  document.querySelectorAll(".add-to-cart").forEach((btn, idx) => {
    if (btn.dataset.cartWired) return;

    // derive id (prefer explicit data attributes)
    const derivedId =
      btn.dataset.itemId || btn.getAttribute("data-item-id") || `t${idx + 1}`;
    if (!btn.hasAttribute("data-test")) {
      btn.setAttribute("data-test", `add-to-cart-${derivedId}`);
      if (!btn.dataset.itemId && !btn.getAttribute("data-item-id")) {
        btn.dataset.itemId = derivedId;
      }
    }

    btn.dataset.cartWired = "1";

    btn.addEventListener("click", (e) => {
      showButtonLoading(btn);

      const id = btn.dataset.itemId || btn.getAttribute("data-item-id");
      const name =
        btn.dataset.itemName || btn.getAttribute("data-item-name") || id;
      const qty = btn.dataset.itemQuantity
        ? Number(btn.dataset.itemQuantity)
        : 1;
      const priceCents =
        btn.dataset.itemPrice || btn.getAttribute("data-item-price") || null;
      const item = { id, name };
      if (priceCents != null) item.priceCents = Number(priceCents);

      setTimeout(() => {
        cart.addItem(item, qty);
        updateCartUI();
        announce(`${name} added to cart`);
        showToast(`${name} added (x${qty})`);
        const cartBtn = document.getElementById(CART_BUTTON_ID);
        if (cartBtn) {
          cartBtn.classList.add("bump");
          setTimeout(() => cartBtn.classList.remove("bump"), 300);
        }
        hideButtonLoading(btn);
      }, 300);
    });
  });
}

window.addEventListener("cart:changed", (evt) => {
  updateCartUI();
});

window.addEventListener("storage", (e) => {
  if (e.key === "lucha_cart_v1") {
    updateCartUI();
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
  ensureCheckoutModalExists();
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
