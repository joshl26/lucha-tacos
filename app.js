// app.js - Main application logic

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
  console.log("=== loadCategories START ===");
  try {
    const response = await fetch("/menu-categories.json");
    console.log("Categories response:", response.ok);
    if (!response.ok) throw new Error("Failed to load categories");
    const data = await response.json();
    console.log("Categories data:", data);

    // Handle both array and object with categories property
    menuCategories = Array.isArray(data) ? data : data.categories || [];

    console.log("Loaded categories array:", menuCategories);
    displayCategories();
  } catch (error) {
    console.error("Error loading categories:", error);
  }
  console.log("=== loadCategories END ===");
}

/**
 * Load menu items from JSON
 */
async function loadMenuItems() {
  console.log("=== loadMenuItems START ===");
  try {
    const response = await fetch("/menu-items.json");
    console.log("Menu items response:", response.ok);
    if (!response.ok) throw new Error("Failed to load menu items");
    const data = await response.json();
    console.log("Menu items data:", data);

    // Handle object with category keys (tacos, burritos, quesadillas)
    if (data && typeof data === "object" && !Array.isArray(data)) {
      menuItems = [];
      // Flatten all category arrays into single array
      Object.keys(data).forEach((categoryKey) => {
        if (Array.isArray(data[categoryKey])) {
          data[categoryKey].forEach((item) => {
            // Add categoryKey to each item for filtering (keep original case from JSON key)
            menuItems.push({
              ...item,
              categoryKey: categoryKey, // This will be "tacos", "burritos", "quesadillas" from JSON keys
              // Convert price from dollars to cents for consistency
              price: Math.round((item.price || 0) * 100),
            });
          });
        }
      });
    } else {
      // Handle array format
      menuItems = Array.isArray(data) ? data : data.items || [];
    }

    console.log("Loaded menu items:", menuItems);
    if (menuItems.length > 0) {
      console.log("Sample item:", menuItems[0]);
      console.log("Sample item categoryKey:", menuItems[0].categoryKey);
    }
    displayMenuItems();
  } catch (error) {
    console.error("Error loading menu items:", error);
  }
  console.log("=== loadMenuItems END ===");
}

/**
 * Display category buttons - handle both 'name' and 'title' properties
 */
function displayCategories() {
  console.log("=== displayCategories START ===");
  const container = document.querySelector(".menu-categories");
  console.log("Categories container found:", container);
  if (!container) {
    console.error("No .menu-categories container found!");
    return;
  }

  // Ensure menuCategories is an array
  if (!Array.isArray(menuCategories)) {
    console.error("menuCategories is not an array:", menuCategories);
    return;
  }

  console.log("Creating buttons for categories:", menuCategories);

  // Create "All" button
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

  // Create category buttons
  html += menuCategories
    .map((category) => {
      const categoryName = category.name || category.title;
      // Use title.toLowerCase() as the filter key (matches JSON keys: tacos, burritos, quesadillas)
      const categoryKey = (category.title || category.name || "").toLowerCase();
      console.log("Creating button:", categoryName, "key:", categoryKey);
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
  console.log("Buttons HTML inserted into container");

  // Add event listeners to category buttons
  const buttons = container.querySelectorAll(".category-btn");
  console.log("Found category buttons:", buttons.length);
  buttons.forEach((btn, index) => {
    const category = btn.getAttribute("data-category");
    console.log(`Attaching handler #${index}:`, category);
    btn.addEventListener("click", handleCategoryClick);
  });
  console.log("=== displayCategories END ===");
}

/**
 * Handle category button clicks
 */
function handleCategoryClick(e) {
  console.log("=== CATEGORY CLICKED ===");
  const category = e.target.getAttribute("data-category");
  console.log("Category clicked:", category);
  currentFilter = category;

  // Update active button state
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active", "btn-light");
    btn.classList.add("btn-outline-light");
  });
  e.target.classList.add("active", "btn-light");
  e.target.classList.remove("btn-outline-light");

  // Display filtered items
  displayMenuItems();
}

/**
 * Display menu items (filtered or all)
 */
function displayMenuItems() {
  console.log("=== displayMenuItems START ===");
  const container = document.querySelector(".menu-items");
  console.log("Menu items container found:", container);
  if (!container) {
    console.error("No .menu-items container found!");
    return;
  }

  // Ensure menuItems is an array
  if (!Array.isArray(menuItems)) {
    console.error("menuItems is not an array:", menuItems);
    container.innerHTML = `
      <div class="text-center text-white py-5">
        <p>Error loading menu items. Please refresh the page.</p>
      </div>
    `;
    return;
  }

  // Filter items based on current category
  const filteredItems =
    currentFilter === "all"
      ? menuItems
      : menuItems.filter((item) => item.categoryKey === currentFilter);

  console.log("Current filter:", currentFilter);
  console.log("Total items:", menuItems.length);
  console.log("Filtered items:", filteredItems.length);
  console.log("Filtered items array:", filteredItems);

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="text-center text-white py-5">
        <p>No items found in this category.</p>
      </div>
    `;
    return;
  }

  // Render menu items
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

  console.log("Menu items HTML inserted");
  // Add event listeners for quantity controls
  attachQuantityControls();
  console.log("=== displayMenuItems END ===");
}

/**
 * Attach event listeners to quantity controls
 */
function attachQuantityControls() {
  // Plus buttons
  document.querySelectorAll(".qty-plus").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.currentTarget.getAttribute("data-item-id");
      const display = document.querySelector(
        `.qty-display[data-item-id="${itemId}"]`
      );
      if (display) {
        let currentQty = parseInt(display.textContent) || 1;
        currentQty = Math.min(currentQty + 1, 99); // Max 99
        display.textContent = currentQty;
      }
    });
  });

  // Minus buttons
  document.querySelectorAll(".qty-minus").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.currentTarget.getAttribute("data-item-id");
      const display = document.querySelector(
        `.qty-display[data-item-id="${itemId}"]`
      );
      if (display) {
        let currentQty = parseInt(display.textContent) || 1;
        currentQty = Math.max(currentQty - 1, 1); // Min 1
        display.textContent = currentQty;
      }
    });
  });

  // Add to cart buttons - ensure proper data attributes for cart-ui.js
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

      // Set quantity as data attribute for cart-ui.js to read
      button.setAttribute("data-item-quantity", qty);

      // Manually trigger cart addition if cart-ui.js listener didn't fire
      // This ensures compatibility
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

      // Reset quantity display after adding
      if (qtyDisplay) {
        setTimeout(() => {
          qtyDisplay.textContent = "1";
        }, 300);
      }
    });
  });
}

/**
 * Setup feedback button handlers
 */
function setupFeedbackButtons() {
  const feedbackButtons = document.querySelectorAll(".feedback-button");

  feedbackButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const location = e.target.getAttribute("data-location");
      showFeedbackModal(location);
    });
  });
}

/**
 * Show feedback modal (placeholder for future implementation)
 */
function showFeedbackModal(location) {
  // TODO: Implement feedback modal in Phase 3
  const locationName = location.charAt(0).toUpperCase() + location.slice(1);
  alert(
    `Feedback form for ${locationName} location will be available soon!\n\nThank you for your interest in providing feedback.`
  );
}

/**
 * Initialize the application
 */
function init() {
  console.log("=== INIT START ===");
  console.log("Document ready state:", document.readyState);
  console.log(
    "Looking for .menu-categories:",
    document.querySelector(".menu-categories")
  );
  console.log(
    "Looking for .menu-items:",
    document.querySelector(".menu-items")
  );

  // Load menu data if we're on the order page
  if (document.querySelector(".menu-categories")) {
    console.log("Found menu elements - loading menu data");
    loadCategories();
    loadMenuItems();
  } else {
    console.log("No menu elements found - skipping menu load");
  }

  // Setup feedback buttons if they exist
  if (document.querySelector(".feedback-button")) {
    console.log("Found feedback buttons - setting up handlers");
    setupFeedbackButtons();
  }
  console.log("=== INIT END ===");
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  console.log("Document still loading, waiting for DOMContentLoaded");
  document.addEventListener("DOMContentLoaded", init);
} else {
  console.log("Document already loaded, running init immediately");
  init();
}
