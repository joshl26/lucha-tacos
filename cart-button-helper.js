// cart-button-helper.js - Ensures cart button appears on order page
// Add this to the end of cart-ui.js or load as separate module

/**
 * Creates and injects cart button into header if container exists
 */
function ensureCartButton() {
  const container = document.getElementById("cart-button-container");
  if (!container) return;

  // Check if cart button already exists
  if (container.querySelector(".cart-button")) return;

  // Create cart button
  const button = document.createElement("button");
  button.className = "cart-button btn btn-success";
  button.setAttribute("aria-label", "View shopping cart");
  button.innerHTML = `
      <i class="fas fa-shopping-cart"></i>
      <span class="cart-badge">0</span>
    `;

  container.appendChild(button);

  // Add click handler to open cart modal
  button.addEventListener("click", () => {
    const cartModal = document.querySelector(".cart-modal-wrapper");
    if (cartModal) {
      cartModal.classList.add("open");
      // Focus first focusable element in modal
      const firstFocusable = cartModal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) firstFocusable.focus();
    }
  });

  // Listen for cart changes to update badge
  window.addEventListener("cart:changed", (e) => {
    const badge = button.querySelector(".cart-badge");
    if (badge && e.detail) {
      const totalItems = e.detail.totalQuantity || 0;
      badge.textContent = totalItems;

      // Add bump animation
      button.classList.add("bump");
      setTimeout(() => button.classList.remove("bump"), 300);
    }
  });
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ensureCartButton);
} else {
  ensureCartButton();
}

export { ensureCartButton };
