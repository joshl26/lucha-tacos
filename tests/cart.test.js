// tests/cart.unit.test.js
// Jest unit tests for cart.js edge cases

// compatibility require: works with named createCart or default export
import cartModule, {
  createCart as _createCart,
  setStorageMode as _setStorageMode,
} from "../cart.js";
const createCart = _createCart || cartModule || cartModule;
const setStorageMode = _setStorageMode || (() => {});

beforeEach(() => {
  // reset storage so persistence tests are deterministic
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
    window.sessionStorage &&
      window.sessionStorage.clear &&
      window.sessionStorage.clear();
  }
  // reset storage mode to default (local) if setter exists
  try {
    setStorageMode && setStorageMode("local");
  } catch (e) {}
});

test("addItem with decimal price converts to cents and calculates subtotal", () => {
  const cart = createCart();
  cart.addItem({ id: "a1", price: 9.99 }, 2);
  expect(cart.getTotalQty()).toBe(2);
  expect(cart.getSubtotal()).toBeCloseTo(19.98, 2);
  expect(cart.getSubtotalCents()).toBe(1998);
});

test("addItem with explicit priceCents uses cents directly", () => {
  const cart = createCart();
  cart.addItem({ id: 2, priceCents: 250 }, 3); // $2.50 * 3 = $7.50
  expect(cart.getSubtotalCents()).toBe(750);
  expect(cart.getSubtotal()).toBeCloseTo(7.5, 2);
});

test("addItem with qty 0 or negative does not add item", () => {
  const cart = createCart();
  cart.addItem({ id: "x" }, 0);
  cart.addItem({ id: "y" }, -2);
  expect(cart.getTotalQty()).toBe(0);
  expect(cart.getItems()).toHaveLength(0);
});

test("updateQty to zero removes the item", () => {
  const cart = createCart();
  cart.addItem({ id: "p", price: 1.0 }, 2);
  expect(cart.getTotalQty()).toBe(2);
  cart.updateQty("p", 0);
  expect(cart.getTotalQty()).toBe(0);
  expect(cart.getItems()).toHaveLength(0);
});

test("removeItem removes single item and recalculates totals", () => {
  const cart = createCart();
  cart.addItem({ id: 1, price: 3.0 }, 1);
  cart.addItem({ id: 2, price: 2.5 }, 2);
  expect(cart.getTotalQty()).toBe(3);
  cart.removeItem(1);
  expect(cart.getTotalQty()).toBe(2);
  expect(cart.getSubtotal()).toBeCloseTo(5.0, 2);
});

test("clearCart empties the cart", () => {
  const cart = createCart();
  cart.addItem({ id: "a", price: 1.0 }, 1);
  cart.addItem({ id: "b", price: 2.0 }, 1);
  expect(cart.getItems().length).toBe(2);
  cart.clearCart();
  expect(cart.getItems().length).toBe(0);
  expect(cart.getSubtotal()).toBe(0);
});

// snapshot and restoreFromSummary produce equivalent state
test("snapshot and restoreFromSummary produce equivalent state", () => {
  const cart1 = createCart();
  cart1.addItem({ id: "s1", price: 1.23 }, 1);
  cart1.addItem({ id: "s2", priceCents: 450 }, 2); // $4.50 * 2
  const snap = cart1.snapshot();
  const parsed = JSON.parse(snap);

  // Ensure persistent storage is cleared so a new cart starts empty
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
    window.sessionStorage &&
      window.sessionStorage.clear &&
      window.sessionStorage.clear();
  }

  const cart2 = createCart();
  // ensure cart2 starts empty
  expect(cart2.getItems().length).toBe(0);

  cart2.restoreFromSummary(parsed);
  expect(cart2.getTotalQty()).toBe(cart1.getTotalQty());
  expect(cart2.getSubtotalCents()).toBe(cart1.getSubtotalCents());
  expect(cart2.getItems()).toEqual(cart1.getItems());
});

// restore uses persistent storage (localStorage) across instances
test("restore uses persistent storage (localStorage) across instances", () => {
  // ensure using local storage mode (if setter exists)
  try {
    setStorageMode && setStorageMode("local");
  } catch (e) {}

  const cartA = createCart();
  // use priceCents for a whole-dollar value to avoid integer-as-cents ambiguity
  cartA.addItem({ id: "persist1", priceCents: 100 }, 2); // $1.00 * 2 = $2.00

  // create a fresh cart instance which should pick up stored summary
  const cartB = createCart();

  // Because createCart restores from storage during initialization,
  // cartB should have the persisted item
  expect(cartB.getSubtotal()).toBeCloseTo(2.0, 2);
  expect(cartB.getTotalQty()).toBe(2);
});
test("getItems returns items with id as string", () => {
  const cart = createCart();
  cart.addItem({ id: 123, price: 2.0 }, 1);
  const items = cart.getItems();
  expect(items[0].id).toBe(String(123));
});
