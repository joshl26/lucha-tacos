// app.js - Enhanced with advanced filtering and page transitions

/**
 * Page transition on load
 */
document.addEventListener("DOMContentLoaded", () => {
  document.body.style.opacity = "0";
  setTimeout(() => {
    document.body.style.transition = "opacity 0.4s ease-in-out";
    document.body.style.opacity = "1";
  }, 10);
});

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
let currentFilters = {
  category: "all",
  vegetarian: false,
  spicyLevel: "all", // 'all', '1', '2', '3'
  dietary: [], // ['gluten-free', 'dairy-free', 'vegan']
};

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
    displayFilterControls();
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
        currentFilters.category === "all"
          ? "btn-light active"
          : "btn-outline-light"
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
        currentFilters.category === categoryKey
          ? "btn-light active"
          : "btn-outline-light"
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
 * Display advanced filter controls
 */
function displayFilterControls() {
  const container = document.querySelector(".filter-controls");
  if (!container) return;

  const html = `
    <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
      <div class="filter-group">
        <label class="filter-label">
          <input type="checkbox" id="filter-vegetarian" ${
            currentFilters.vegetarian ? "checked" : ""
          }>
          <span class="ms-1">🥗 Vegetarian Only</span>
        </label>
      </div>
      
      <div class="filter-group">
        <label class="filter-label me-2">🌶️ Spice Level:</label>
        <select id="filter-spicy" class="form-select form-select-sm" style="width: auto; display: inline-block;">
          <option value="all" ${
            currentFilters.spicyLevel === "all" ? "selected" : ""
          }>All Levels</option>
          <option value="1" ${
            currentFilters.spicyLevel === "1" ? "selected" : ""
          }>Mild (🌶️)</option>
          <option value="2" ${
            currentFilters.spicyLevel === "2" ? "selected" : ""
          }>Medium (🌶️🌶️)</option>
          <option value="3" ${
            currentFilters.spicyLevel === "3" ? "selected" : ""
          }>Hot (🌶️🌶️🌶️)</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">
          <input type="checkbox" id="filter-gluten-free" ${
            currentFilters.dietary.includes("gluten-free") ? "checked" : ""
          }>
          <span class="ms-1">Gluten-Free</span>
        </label>
      </div>

      <div class="filter-group">
        <label class="filter-label">
          <input type="checkbox" id="filter-dairy-free" ${
            currentFilters.dietary.includes("dairy-free") ? "checked" : ""
          }>
          <span class="ms-1">Dairy-Free</span>
        </label>
      </div>

      <div class="filter-group">
        <label class="filter-label">
          <input type="checkbox" id="filter-vegan" ${
            currentFilters.dietary.includes("vegan") ? "checked" : ""
          }>
          <span class="ms-1">🌱 Vegan</span>
        </label>
      </div>

      <button id="clear-filters" class="btn btn-sm btn-outline-danger ms-2">Clear All Filters</button>
    </div>
    <div id="filter-results-count" class="text-white-50 small mb-2"></div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  document
    .getElementById("filter-vegetarian")
    ?.addEventListener("change", handleFilterChange);
  document
    .getElementById("filter-spicy")
    ?.addEventListener("change", handleFilterChange);
  document
    .getElementById("filter-gluten-free")
    ?.addEventListener("change", handleFilterChange);
  document
    .getElementById("filter-dairy-free")
    ?.addEventListener("change", handleFilterChange);
  document
    .getElementById("filter-vegan")
    ?.addEventListener("change", handleFilterChange);
  document
    .getElementById("clear-filters")
    ?.addEventListener("click", clearAllFilters);
}

/**
 * Handle category button clicks
 */
function handleCategoryClick(e) {
  const category = e.target.getAttribute("data-category");
  currentFilters.category = category;

  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active", "btn-light");
    btn.classList.add("btn-outline-light");
  });
  e.target.classList.add("active", "btn-light");
  e.target.classList.remove("btn-outline-light");

  displayMenuItems();
}

/**
 * Handle filter changes
 */
function handleFilterChange() {
  const vegCheckbox = document.getElementById("filter-vegetarian");
  const spicySelect = document.getElementById("filter-spicy");
  const glutenCheckbox = document.getElementById("filter-gluten-free");
  const dairyCheckbox = document.getElementById("filter-dairy-free");
  const veganCheckbox = document.getElementById("filter-vegan");

  currentFilters.vegetarian = vegCheckbox?.checked || false;
  currentFilters.spicyLevel = spicySelect?.value || "all";
  currentFilters.dietary = [];

  if (glutenCheckbox?.checked) currentFilters.dietary.push("gluten-free");
  if (dairyCheckbox?.checked) currentFilters.dietary.push("dairy-free");
  if (veganCheckbox?.checked) currentFilters.dietary.push("vegan");

  displayMenuItems();
}

/**
 * Clear all filters
 */
function clearAllFilters() {
  currentFilters.vegetarian = false;
  currentFilters.spicyLevel = "all";
  currentFilters.dietary = [];

  displayFilterControls();
  displayMenuItems();
}

/**
 * Apply all filters to menu items
 */
function applyFilters(items) {
  let filtered = items;

  // Category filter
  if (currentFilters.category !== "all") {
    filtered = filtered.filter(
      (item) => item.categoryKey === currentFilters.category
    );
  }

  // Vegetarian filter
  if (currentFilters.vegetarian) {
    filtered = filtered.filter((item) => item.isVegetarian === true);
  }

  // Spicy level filter
  if (currentFilters.spicyLevel !== "all") {
    const level = parseInt(currentFilters.spicyLevel);
    filtered = filtered.filter((item) => item.spicyLevel === level);
  }

  // Dietary filters
  if (currentFilters.dietary.includes("gluten-free")) {
    filtered = filtered.filter((item) => item.isGlutenFree === true);
  }
  if (currentFilters.dietary.includes("dairy-free")) {
    filtered = filtered.filter(
      (item) => !item.allergens?.some((a) => a.toLowerCase().includes("dairy"))
    );
  }
  if (currentFilters.dietary.includes("vegan")) {
    filtered = filtered.filter((item) => item.isVegan === true);
  }

  return filtered;
}

/**
 * Get spicy level emoji
 */
function getSpicyEmoji(level) {
  if (!level || level === 0) return "";
  return "🌶️".repeat(level);
}

/**
 * Display menu items (filtered)
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

  const filteredItems = applyFilters(menuItems);

  // Update results count
  const countEl = document.getElementById("filter-results-count");
  if (countEl) {
    countEl.textContent = `Showing ${filteredItems.length} item${
      filteredItems.length !== 1 ? "s" : ""
    }`;
  }

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="text-center text-white py-5">
        <p class="mb-2">😔 No items match your current filters.</p>
        <button onclick="document.getElementById('clear-filters').click()" class="btn btn-sm btn-outline-light">
          Clear Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredItems
    .map((item) => {
      const priceFormatted = `$${(item.price / 100).toFixed(2)}`;
      const itemName = item.name || item.title;
      const spicyEmoji = getSpicyEmoji(item.spicyLevel);
      const staffPick = item.staffPick
        ? '<span class="badge bg-warning text-dark ms-2">⭐ Staff Pick</span>'
        : "";
      const vegBadge = item.isVegetarian
        ? '<span class="badge bg-success ms-1">🥗 Vegetarian</span>'
        : "";
      const veganBadge = item.isVegan
        ? '<span class="badge bg-success ms-1">🌱 Vegan</span>'
        : "";
      const gfBadge = item.isGlutenFree
        ? '<span class="badge bg-info ms-1">GF</span>'
        : "";

      return `
        <div class="menu-item card bg-dark text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="flex-grow-1">
                <h5 class="card-title mb-1">
                  ${itemName} ${spicyEmoji}
                  ${staffPick}
                  ${vegBadge}
                  ${veganBadge}
                  ${gfBadge}
                </h5>
                ${
                  item.detailedDescription
                    ? `<p class="card-text text-white-50 small mb-2">${item.detailedDescription}</p>`
                    : item.description
                    ? `<p class="card-text text-muted small mb-2">${item.description}</p>`
                    : ""
                }
                ${
                  item.ingredients
                    ? `<p class="card-text small text-white-50 mb-1">
                        <strong>Ingredients:</strong> ${item.ingredients.join(
                          ", "
                        )}
                       </p>`
                    : ""
                }
                ${
                  item.allergens && item.allergens.length > 0
                    ? `<p class="card-text small text-warning mb-1">
                        <strong>⚠️ Contains:</strong> ${item.allergens.join(
                          ", "
                        )}
                       </p>`
                    : ""
                }
                ${
                  item.calories
                    ? `<p class="card-text small text-white-50 mb-2">${item.calories} cal</p>`
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

  wrapper
    .querySelector(".feedback-modal-close")
    .addEventListener("click", closeFeedbackModal);

  wrapper
    .querySelector(".feedback-cancel")
    .addEventListener("click", closeFeedbackModal);

  wrapper.querySelector("#feedback-form").addEventListener("submit", (e) => {
    e.preventDefault();
    handleFeedbackSubmit();
  });

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

  const locationDisplay = document.getElementById("feedback-location-display");
  const locationName =
    location.charAt(0).toUpperCase() + location.slice(1) + " Location";
  locationDisplay.textContent = `Feedback for: ${locationName}`;

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

  if (!name) {
    showFeedbackFieldError(nameInput, "Please enter your name");
    valid = false;
  }

  if (!email) {
    showFeedbackFieldError(emailInput, "Please enter your email");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFeedbackFieldError(emailInput, "Please enter a valid email");
    valid = false;
  }

  if (!rating) {
    showFeedbackFieldError(ratingInput, "Please select a rating");
    valid = false;
  }

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

  const payload = {
    name,
    email,
    phone: phone || null,
    rating: parseInt(rating),
    message,
    location,
    timestamp: new Date().toISOString(),
  };

  window.dispatchEvent(
    new CustomEvent("feedback:submitted", { detail: payload })
  );

  const form_elem = document.getElementById("feedback-form");
  const originalHTML = form_elem.innerHTML;
  form_elem.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: #198754;">
      <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">Thank you!</p>
      <p>Your feedback has been submitted. We appreciate your input!</p>
    </div>
  `;

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
  if (document.querySelector(".menu-categories")) {
    loadCategories();
    loadMenuItems();
  }

  if (document.querySelector(".feedback-button")) {
    setupFeedbackButtons();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
