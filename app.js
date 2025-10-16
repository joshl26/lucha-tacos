// app.js - Main application logic (with feedback modal)

/**
 * Sets the active navigation link based on current page
 * @param {string} page - The page identifier ('home', 'order', 'about')
 */
export function setActiveNavLink(page) {
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("data-page");

    if (linkPage === page) {
      link.classList.add("active", "bg-success");
      link.classList.remove("text-white");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active", "bg-success");
      link.classList.add("text-white");
      link.removeAttribute("aria-current");
    }
  });
}

// Menu data storage
let menuCategories = [];
let menuItems = [];
let currentFilter = "all";

/**
 * Load menu categories from JSON
 */
async function loadCategories() {
  try {
    const response = await fetch("/menu-categories.json");
    if (!response.ok) throw new Error("Failed to load categories");
    const data = await response.json();

    menuCategories = Array.isArray(data) ? data : data.categories || [];
    displayCategories();
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

/**
 * Load menu items from JSON
 */
async function loadMenuItems() {
  try {
    const response = await fetch("/menu-items.json");
    if (!response.ok) throw new Error("Failed to load menu items");
    const data = await response.json();

    if (data && typeof data === "object" && !Array.isArray(data)) {
      menuItems = [];
      Object.keys(data).forEach((categoryKey) => {
        if (Array.isArray(data[categoryKey])) {
          data[categoryKey].forEach((item) => {
            menuItems.push({
              ...item,
              categoryKey: categoryKey.toLowerCase().trim(),
              price: Math.round((item.price || 0) * 100),
            });
          });
        }
      });
    } else {
      menuItems = Array.isArray(data) ? data : data.items || [];
    }

    displayMenuItems();
  } catch (error) {
    console.error("Error loading menu items:", error);
  }
}

/**
 * Display category buttons
 */
function displayCategories() {
  const container = document.querySelector(".menu-categories");
  if (!container || !Array.isArray(menuCategories)) return;

  let html = `
    <button 
      class="category-btn btn ${
        currentFilter === "all" ? "btn-light active" : "btn-outline-light"
      }"
      data-category="all"
      aria-label="Show all menu items"
    >
      All Items
    </button>
  `;

  html += menuCategories
    .map((category) => {
      const categoryName = category.name || category.title;
      const categoryKey = (category.title || category.name || "").toLowerCase();
      return `
    <button 
      class="category-btn btn ${
        currentFilter === categoryKey ? "btn-light active" : "btn-outline-light"
      }"
      data-category="${categoryKey}"
      aria-label="Filter menu by ${categoryName}"
    >
      ${categoryName}
    </button>
  `;
    })
    .join("");

  container.innerHTML = html;

  const buttons = container.querySelectorAll(".category-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", handleCategoryClick);
  });
}

/**
 * Handle category button clicks
 */
function handleCategoryClick(e) {
  const category = e.target.getAttribute("data-category");
  currentFilter = category;

  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active", "btn-light");
    btn.classList.add("btn-outline-light");
  });
  e.target.classList.add("active", "btn-light");
  e.target.classList.remove("btn-outline-light");

  displayMenuItems();
}

/**
 * Display menu items (filtered or all)
 */
function displayMenuItems() {
  const container = document.querySelector(".menu-items");
  if (!container || !Array.isArray(menuItems)) {
    if (container) {
      container.innerHTML = `
        <div class="text-center text-white py-5">
          <p>Error loading menu items. Please refresh the page.</p>
        </div>
      `;
    }
    return;
  }

  const filteredItems =
    currentFilter === "all"
      ? menuItems
      : menuItems.filter((item) => item.categoryKey === currentFilter);

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="text-center text-white py-5">
        <p>No items found in this category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredItems
    .map((item) => {
      const priceFormatted = `$${(item.price / 100).toFixed(2)}`;
      const itemName = item.name || item.title;
      return `
        <div class="menu-item card bg-dark text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="flex-grow-1">
                <h5 class="card-title mb-1">${itemName}</h5>
                ${
                  item.description
                    ? `<p class="card-text text-muted small mb-2">${item.description}</p>`
                    : ""
                }
                <p class="card-text fw-bold text-success">${priceFormatted}</p>
              </div>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex gap-2 align-items-center">
                <button
                  class="btn btn-sm btn-outline-light qty-minus"
                  data-item-id="${item.id}"
                  aria-label="Decrease quantity"
                >
                  <i class="fas fa-minus"></i>
                </button>
                <span class="qty-display px-2" data-item-id="${
                  item.id
                }">1</span>
                <button
                  class="btn btn-sm btn-outline-light qty-plus"
                  data-item-id="${item.id}"
                  aria-label="Increase quantity"
                >
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <button
                class="btn btn-danger add-to-cart"
                data-item-id="${item.id}"
                data-item-name="${itemName}"
                data-item-price="${item.price}"
                aria-label="Add ${itemName} to cart"
              >
                <i class="fas fa-cart-plus me-1"></i> Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  attachQuantityControls();
}

/**
 * Attach event listeners to quantity controls
 */
function attachQuantityControls() {
  document.querySelectorAll(".qty-plus").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.currentTarget.getAttribute("data-item-id");
      const display = document.querySelector(
        `.qty-display[data-item-id="${itemId}"]`
      );
      if (display) {
        let currentQty = parseInt(display.textContent) || 1;
        currentQty = Math.min(currentQty + 1, 99);
        display.textContent = currentQty;
      }
    });
  });

  document.querySelectorAll(".qty-minus").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.currentTarget.getAttribute("data-item-id");
      const display = document.querySelector(
        `.qty-display[data-item-id="${itemId}"]`
      );
      if (display) {
        let currentQty = parseInt(display.textContent) || 1;
        currentQty = Math.max(currentQty - 1, 1);
        display.textContent = currentQty;
      }
    });
  });

  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const button = e.currentTarget;
      const itemId = button.getAttribute("data-item-id");
      const qtyDisplay = document.querySelector(
        `.qty-display[data-item-id="${itemId}"]`
      );
      const qty = qtyDisplay ? parseInt(qtyDisplay.textContent) : 1;

      button.setAttribute("data-item-quantity", qty);

      if (window.cart) {
        const itemName = button.getAttribute("data-item-name");
        const itemPrice = parseInt(button.getAttribute("data-item-price"));

        try {
          window.cart.addItem(
            {
              id: itemId,
              name: itemName,
              priceCents: itemPrice,
            },
            qty
          );
        } catch (error) {
          console.error("Error adding to cart:", error);
        }
      }

      if (qtyDisplay) {
        setTimeout(() => {
          qtyDisplay.textContent = "1";
        }, 300);
      }
    });
  });
}

/**
 * Create and inject feedback modal HTML
 */
function ensureFeedbackModalExists() {
  if (document.getElementById("feedback-modal-wrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "feedback-modal-wrapper";
  wrapper.className = "feedback-modal-wrapper";
  wrapper.innerHTML = `
    <div class="feedback-modal-backdrop"></div>
    <div class="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title" tabindex="-1">
      <div class="feedback-modal-header">
        <h2 id="feedback-title">Leave Feedback</h2>
        <button class="feedback-modal-close" aria-label="Close feedback form">&times;</button>
      </div>
      <div class="feedback-modal-body">
        <div class="feedback-location" id="feedback-location-display"></div>
        <form id="feedback-form" novalidate>
          <label>
            Your Name *
            <input type="text" name="name" id="feedback-name" required autocomplete="name" />
          </label>
          <label>
            Email *
            <input type="email" name="email" id="feedback-email" required autocomplete="email" />
          </label>
          <label>
            Phone (optional)
            <input type="tel" name="phone" id="feedback-phone" autocomplete="tel" />
          </label>
          <label>
            Rating *
            <select name="rating" id="feedback-rating" required>
              <option value="">-- Select a rating --</option>
              <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
              <option value="4">⭐⭐⭐⭐ Good</option>
              <option value="3">⭐⭐⭐ Average</option>
              <option value="2">⭐⭐ Poor</option>
              <option value="1">⭐ Very Poor</option>
            </select>
          </label>
          <label>
            Your Feedback *
            <textarea name="message" id="feedback-message" required placeholder="Tell us what you think..."></textarea>
          </label>
          <div class="feedback-form-actions">
            <button type="button" class="feedback-cancel">Cancel</button>
            <button type="submit" class="feedback-submit">Submit Feedback</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  // Wire up close button
  wrapper
    .querySelector(".feedback-modal-close")
    .addEventListener("click", closeFeedbackModal);

  // Wire up cancel button
  wrapper
    .querySelector(".feedback-cancel")
    .addEventListener("click", closeFeedbackModal);

  // Wire up form submission
  wrapper.querySelector("#feedback-form").addEventListener("submit", (e) => {
    e.preventDefault();
    handleFeedbackSubmit();
  });

  // Wire up backdrop click to close
  wrapper
    .querySelector(".feedback-modal-backdrop")
    .addEventListener("click", closeFeedbackModal);
}

/**
 * Open feedback modal
 */
function openFeedbackModal(location) {
  ensureFeedbackModalExists();
  const wrapper = document.getElementById("feedback-modal-wrapper");
  wrapper.classList.add("open");

  // Set location display
  const locationDisplay = document.getElementById("feedback-location-display");
  const locationName =
    location.charAt(0).toUpperCase() + location.slice(1) + " Location";
  locationDisplay.textContent = `Feedback for: ${locationName}`;

  // Store location in form for submission
  document.getElementById("feedback-form").dataset.location = location;

  const modal = wrapper.querySelector(".feedback-modal");
  modal.focus();
  trapFeedbackFocus(modal);
  document.body.classList.add("feedback-open");
}

/**
 * Close feedback modal
 */
function closeFeedbackModal() {
  const wrapper = document.getElementById("feedback-modal-wrapper");
  if (!wrapper) return;

  wrapper.classList.remove("open");
  document.body.classList.remove("feedback-open");
  releaseFeedbackFocusTrap();

  // Reset form
  const form = wrapper.querySelector("#feedback-form");
  form.reset();
  clearFeedbackFieldErrors();
}

/**
 * Validate and submit feedback
 */
function handleFeedbackSubmit() {
  const form = document.getElementById("feedback-form");
  const nameInput = form.querySelector("#feedback-name");
  const emailInput = form.querySelector("#feedback-email");
  const phoneInput = form.querySelector("#feedback-phone");
  const ratingInput = form.querySelector("#feedback-rating");
  const messageInput = form.querySelector("#feedback-message");

  const name = (nameInput.value || "").trim();
  const email = (emailInput.value || "").trim();
  const phone = (phoneInput.value || "").trim();
  const rating = (ratingInput.value || "").trim();
  const message = (messageInput.value || "").trim();
  const location = form.dataset.location || "unknown";

  let valid = true;
  clearFeedbackFieldErrors();

  // Validate name
  if (!name) {
    showFeedbackFieldError(nameInput, "Please enter your name");
    valid = false;
  }

  // Validate email
  if (!email) {
    showFeedbackFieldError(emailInput, "Please enter your email");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFeedbackFieldError(emailInput, "Please enter a valid email");
    valid = false;
  }

  // Validate rating
  if (!rating) {
    showFeedbackFieldError(ratingInput, "Please select a rating");
    valid = false;
  }

  // Validate message
  if (!message) {
    showFeedbackFieldError(messageInput, "Please enter your feedback");
    valid = false;
  } else if (message.length < 10) {
    showFeedbackFieldError(
      messageInput,
      "Feedback should be at least 10 characters"
    );
    valid = false;
  }

  if (!valid) return;

  // Prepare payload
  const payload = {
    name,
    email,
    phone: phone || null,
    rating: parseInt(rating),
    message,
    location,
    timestamp: new Date().toISOString(),
  };

  // Emit event for host application to handle (send to server, etc.)
  window.dispatchEvent(
    new CustomEvent("feedback:submitted", { detail: payload })
  );

  // Show success message
  const form_elem = document.getElementById("feedback-form");
  const originalHTML = form_elem.innerHTML;
  form_elem.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: #198754;">
      <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">Thank you!</p>
      <p>Your feedback has been submitted. We appreciate your input!</p>
    </div>
  `;

  // Close modal after delay
  setTimeout(() => {
    closeFeedbackModal();
    form_elem.innerHTML = originalHTML;
  }, 2500);
}

/**
 * Show field error message
 */
function showFeedbackFieldError(inputEl, message) {
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

/**
 * Clear all field errors
 */
function clearFeedbackFieldErrors() {
  const form = document.getElementById("feedback-form");
  if (!form) return;
  form
    .querySelectorAll(".field-error")
    .forEach((el) => el.classList.remove("field-error"));
  form.querySelectorAll(".field-error-msg").forEach((el) => el.remove());
}

/**
 * Setup feedback button handlers
 */
function setupFeedbackButtons() {
  const feedbackButtons = document.querySelectorAll(".feedback-button");

  feedbackButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const location = e.target.getAttribute("data-location");
      openFeedbackModal(location);
    });
  });
}

/**
 * Focus trap for feedback modal
 */
let _feedbackPreviousFocused = null;
let _feedbackTrapActive = false;
let _feedbackTrapElement = null;

function trapFeedbackFocus(el) {
  if (_feedbackTrapActive) return;
  _feedbackTrapActive = true;
  _feedbackTrapElement = el;
  _feedbackPreviousFocused = document.activeElement;
  document.addEventListener("keydown", _feedbackOnKeyDown, true);
}

function releaseFeedbackFocusTrap() {
  if (!_feedbackTrapActive) return;
  _feedbackTrapActive = false;
  _feedbackTrapElement = null;
  document.removeEventListener("keydown", _feedbackOnKeyDown, true);
  if (
    _feedbackPreviousFocused &&
    typeof _feedbackPreviousFocused.focus === "function"
  ) {
    _feedbackPreviousFocused.focus();
  }
}

function _feedbackOnKeyDown(e) {
  if (!_feedbackTrapActive || !_feedbackTrapElement) return;

  if (e.key === "Escape") {
    e.preventDefault();
    closeFeedbackModal();
    return;
  }

  if (e.key === "Tab") {
    const focusable = _feedbackTrapElement.querySelectorAll(
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

/**
 * Initialize the application
 */
function init() {
  // Load menu data if we're on the order page
  if (document.querySelector(".menu-categories")) {
    loadCategories();
    loadMenuItems();
  }

  // Setup feedback buttons if they exist
  if (document.querySelector(".feedback-button")) {
    setupFeedbackButtons();
  }
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
