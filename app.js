// app.js (updated for cart-ui integration)

// DOM Elements
const menuCategoriesDOM = document.querySelector(".menu-categories");
const menuItemsDOM = document.querySelector(".menu-items");
const cartCountDOM = document.querySelector(".cart-count");

// In-memory state for menu data only (no cart)
let allMenuItems = {};
let allCategories = [];
let currentCategory = null;

// Menu class - fetch data
class Menu {
  async getMenuItems() {
    const currentPath = window.location.pathname;
    let jsonPath = "menu-items.json";

    if (currentPath.includes("/order/") || currentPath.includes("/pages/")) {
      jsonPath = "../menu-items.json";
    }

    try {
      let result = await fetch(jsonPath);
      if (result.ok) {
        let menuItems = await result.json();
        console.log("✅ Menu items loaded successfully");
        return menuItems;
      }
      throw new Error("Failed to load menu items");
    } catch (error) {
      console.error("❌ Error fetching menu items:", error);
      return this.getFallbackMenuItems();
    }
  }

  async getMenuCategories() {
    const currentPath = window.location.pathname;
    let jsonPath = "menu-categories.json";

    if (currentPath.includes("/order/") || currentPath.includes("/pages/")) {
      jsonPath = "../menu-categories.json";
    }

    try {
      let result = await fetch(jsonPath);
      if (result.ok) {
        let data = await result.json();
        console.log("✅ Categories loaded successfully");
        return data.categories || [];
      }
      throw new Error("Failed to load categories");
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      return this.getFallbackCategories();
    }
  }

  getFallbackMenuItems() {
    return {
      tacos: [
        {
          id: 1,
          title: "Carne Asada Tacos",
          description:
            "3 soft-shell 4 inch corn tortilla garnish with flank steak, white onion, cilantro in the french fries on the side.",
          price: 18.99,
          qty: 1,
        },
        {
          id: 2,
          title: "Pollo Asado Tacos",
          description:
            "3 soft shell 4 inch corn tortilla with grilled chicken, white onion, cilantro in the french fries on the side.",
          price: 17.99,
          qty: 1,
        },
      ],
      burritos: [
        {
          id: 4,
          title: "Carne Asada Burritos",
          description:
            "Flank steak, black beans, lettuce, jalapeno, ranchero sauce, sour cream, avocado mayonnaise & side fries.",
          price: 17.99,
          qty: 1,
        },
      ],
    };
  }

  getFallbackCategories() {
    return [
      { id: 1, title: "Tacos", image: "/public/menu-tacos.jpg" },
      { id: 2, title: "Burritos", image: "/public/menu-burritos.jpg" },
    ];
  }
}

// UI class - render elements
class UI {
  displayCategories(menuCategories) {
    if (!menuCategoriesDOM) {
      console.warn("⚠️ Menu categories container not found");
      return;
    }

    let result = "";
    menuCategories.forEach((category) => {
      result += `
        <button class="menu-category position-relative" data-category="${category.title.toLowerCase()}">
          <img
            class="position-relative"
            src="${category.image}"
            alt="${category.title} category menu items"
            style="max-width: 150px; max-height: 150px"
          />
          <h5
            class="position-absolute p-1 text-white"
            style="top: 0; background-color: rgb(255, 0, 0)"
          >
            ${category.title}
          </h5>
        </button>
      `;
    });
    menuCategoriesDOM.innerHTML = result;

    // Add click handlers to category buttons
    document.querySelectorAll(".menu-category").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const category = e.currentTarget.getAttribute("data-category");
        this.filterItems(category);

        // Update active state
        document.querySelectorAll(".menu-category").forEach((b) => {
          b.style.opacity = "0.5";
        });
        e.currentTarget.style.opacity = "1";
      });
    });

    console.log("✅ Categories displayed:", menuCategories.length);
  }

  displayItems(itemsToDisplay) {
    if (!menuItemsDOM) {
      console.warn("⚠️ Menu items container not found");
      return;
    }

    if (!itemsToDisplay || itemsToDisplay.length === 0) {
      menuItemsDOM.innerHTML = `
        <div class="text-center p-5">
          <h4>No items available in this category</h4>
        </div>
      `;
      return;
    }

    let result = "";

    itemsToDisplay.forEach((item) => {
      // compute price cents for data attribute
      const priceCents =
        item.priceCents ?? Math.round(Number(item.price || 0) * 100);

      result += `
        <div class="menu-item flex-row rounded-4 bg-white mb-3" data-id="${
          item.id
        }">
          <div
            class="rounded-top-4 h-auto text-black"
            style="background-color: lightgray"
          >
            <div class="d-flex flex-row justify-content-between">
              <h5 class="pt-3 px-3 m-0">${escapeHtml(item.title)}</h5>
              <div class="d-flex flex-row">
                <p class="m-auto px-2" style="font-size: 20px">$${(
                  priceCents / 100
                ).toFixed(2)}</p>
              </div>
            </div>
            <p class="p-3 m-0">
              ${escapeHtml(item.description)}
            </p>
          </div>
          <div class="d-flex flex-row justify-content-between w-100 p-2">
            <div class="flex-column">
              <div class="d-flex flex-row text-black h-100">
                <div class="flex-column px-3 m-auto">
                  <button
                    class="qty-minus"
                    style="background-color: transparent; border: 0px; cursor: pointer"
                    data-id="${item.id}"
                    aria-label="Decrease quantity"
                  >
                    <i
                      class="fa-sharp fa-solid fa-circle-minus fa-xl"
                      style="font-size: 25px; color: rgb(255, 30, 30)"
                    ></i>
                  </button>
                </div>
                <div
                  class="qty-display flex-column px-3 m-auto"
                  style="font-size: 20px"
                  aria-label="Quantity"
                >
                  1
                </div>
                <div class="flex-column px-3 m-auto">
                  <button
                    class="qty-plus"
                    style="background-color: transparent; border: 0px; cursor: pointer"
                    data-id="${item.id}"
                    aria-label="Increase quantity"
                  >
                    <i
                      class="fa-sharp fa-solid fa-circle-plus fa-xl"
                      style="font-size: 25px; color: rgb(255, 30, 30)"
                    ></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="flex-column align-content-center">
              <button
                class="add-to-cart p-2 rounded mx-3 my-2 px-4 text-white"
                style="background-color: red; border: 0px; cursor: pointer"
                data-id="${item.id}"
                data-name="${escapeHtml(item.title)}"
                data-price-cents="${priceCents}"
                type="button"
              >
                ADD TO CART
              </button>
            </div>
          </div>
        </div>
      `;
    });

    menuItemsDOM.innerHTML = result;
    this.attachItemEventListeners();
    console.log("✅ Items displayed:", itemsToDisplay.length);
  }

  filterItems(category) {
    currentCategory = category;
    const categoryKey = category.toLowerCase();

    console.log("🔍 Filtering category:", categoryKey);
    console.log("📦 Available categories:", Object.keys(allMenuItems));

    let items = allMenuItems[categoryKey];

    if (!items && categoryKey.endsWith("s")) {
      const singular = categoryKey.slice(0, -1);
      items = allMenuItems[singular];
      console.log("🔄 Trying singular version:", singular);
    }

    if (!items && !categoryKey.endsWith("s")) {
      const plural = categoryKey + "s";
      items = allMenuItems[plural];
      console.log("🔄 Trying plural version:", plural);
    }

    if (items && items.length > 0) {
      this.displayItems(items);
    } else {
      console.warn("⚠️ No items found for category:", categoryKey);
      this.displayItems([]);
    }
  }

  attachItemEventListeners() {
    // Add-to-cart buttons: set data-qty before letting cart-ui handle the actual add
    document.querySelectorAll(".add-to-cart").forEach((btn) => {
      // avoid re-binding
      if (btn.dataset.uiWired) return;
      btn.dataset.uiWired = "1";
      btn.addEventListener("click", (e) => {
        const menuItemEl = e.currentTarget.closest(".menu-item");
        const qtyDisplay = menuItemEl.querySelector(".qty-display");
        const qty = parseInt(qtyDisplay.textContent || "1", 10) || 1;
        // set attribute so cart-ui reads it
        e.currentTarget.dataset.qty = String(qty);
        // Optionally show a quick visual confirmation here (we rely on cart-ui announce/modal)
      });
    });

    // Minus buttons
    document.querySelectorAll(".qty-minus").forEach((btn) => {
      if (btn.dataset.wiredMinus) return;
      btn.dataset.wiredMinus = "1";
      btn.addEventListener("click", (e) => {
        const qtyDisplay = e.currentTarget
          .closest(".menu-item")
          .querySelector(".qty-display");
        let qty = parseInt(qtyDisplay.textContent || "1", 10);
        if (qty > 1) {
          qty--;
          qtyDisplay.textContent = qty;
        }
      });
    });

    // Plus buttons
    document.querySelectorAll(".qty-plus").forEach((btn) => {
      if (btn.dataset.wiredPlus) return;
      btn.dataset.wiredPlus = "1";
      btn.addEventListener("click", (e) => {
        const qtyDisplay = e.currentTarget
          .closest(".menu-item")
          .querySelector(".qty-display");
        let qty = parseInt(qtyDisplay.textContent || "1", 10);
        qty++;
        qtyDisplay.textContent = qty;
      });
    });
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

// Initialize app
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Initializing Lucha Libre Menu App...");

  const ui = new UI();
  const menu = new Menu();

  // Load menu items
  console.log("📥 Loading menu items...");
  const menuItems = await menu.getMenuItems();
  allMenuItems = menuItems;
  console.log("📦 Menu items loaded:", Object.keys(menuItems));

  // Load categories
  console.log("📥 Loading categories...");
  const categories = await menu.getMenuCategories();
  allCategories = categories;
  console.log("📂 Categories loaded:", categories.length);

  // Display categories
  if (menuCategoriesDOM) {
    ui.displayCategories(categories);
  }

  // Display first category by default
  if (categories.length > 0 && menuItemsDOM) {
    const firstCategory = categories[0].title.toLowerCase();
    console.log("🎯 Displaying first category:", firstCategory);
    ui.filterItems(firstCategory);

    // Set first category as active
    const firstCategoryBtn = document.querySelector(".menu-category");
    if (firstCategoryBtn) {
      firstCategoryBtn.style.opacity = "1";
    }
  }

  console.log("✅ App initialized successfully!");
});
