// tests/e2e/cart.spec.js
import { test, expect } from "@playwright/test";

test.describe("Cart flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/order"); // resolves to your baseURL + /order
  });

  test("Add item to cart and update quantity", async ({ page }) => {
    const addBtn = page.locator('[data-test="add-to-cart-1"]');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const miniCount = page.locator('[data-test="mini-cart-count"]');
    await expect(miniCount).toHaveText("1");

    const miniOpen = page.locator('[data-test="mini-cart-open"]');
    await expect(miniOpen).toBeVisible();
    await miniOpen.click();

    const cartItem = page.locator('[data-test="cart-item-1"]');
    await expect(cartItem).toBeVisible();

    const incr = page.locator('[data-test="cart-increment-1"]');
    await expect(incr).toBeVisible();
    await incr.click();

    const qty = page.locator('[data-test="cart-qty-1"]');
    await expect(qty).toHaveText("2");
  });

  test("Checkout flow (mock payment)", async ({ page }) => {
    const addBtn = page.locator('[data-test="add-to-cart-1"]');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const miniOpen = page.locator('[data-test="mini-cart-open"]');
    await expect(miniOpen).toBeVisible();
    await miniOpen.click();

    const checkoutBtn = page.locator('[data-test="checkout-button"]');
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // Fill out the form
    await page.fill("#checkout-name", "Test User");
    await page.fill("#checkout-contact", "test@example.com");

    // Submit the form
    await page.locator(".checkout-confirm").click();

    // Wait for toast notification and modal to close
    await expect(page.locator(".cart-toast")).toBeVisible();
    await expect(page.locator(".checkout-modal-wrapper")).not.toHaveClass(
      /open/
    );
  });
});
