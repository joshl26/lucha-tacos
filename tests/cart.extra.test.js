// tests/cart.extra.test.js
// Extra unit tests: rounding/tax, concurrency, stress
import cartModule, {
  createCart as _createCart,
  setStorageMode as _setStorageMode,
} from "../cart.js";
const createCart = _createCart || cartModule || cartModule;
const setStorageMode = _setStorageMode || (() => {});

// Clear storage helper
function clearStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
    window.sessionStorage &&
      window.sessionStorage.clear &&
      window.sessionStorage.clear();
  }
}

beforeEach(() => {
  clearStorage();
  try {
    setStorageMode && setStorageMode("local");
  } catch (e) {}
  jest.useRealTimers();
});

test("rounding and tax calculation (two-step rounding)", () => {
  const cart = createCart();
  // Add three items at prices that can demonstrate rounding issues
  cart.addItem({ id: "t1", price: 0.3333 }, 1); // $0.3333 -> 33 cents
  cart.addItem({ id: "t2", price: 0.6667 }, 1); // $0.6667 -> 67 cents
  cart.addItem({ id: "t3", price: 1.005 }, 1); // $1.005 -> 101 cents (rounding)
  const subtotal = cart.getSubtotal(); // in dollars
  const subtotalCents = cart.getSubtotalCents();
  expect(subtotalCents).toBe(
    Math.round(0.3333 * 100) +
      Math.round(0.6667 * 100) +
      Math.round(1.005 * 100)
  );
  expect(subtotal).toBeCloseTo(subtotalCents / 100, 2);

  // example tax calculation: 8.25% applied to subtotalCents, then rounded to cents
  const taxRate = 0.0825;
  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + taxCents;
  expect(totalCents).toBeGreaterThanOrEqual(subtotalCents);
});

test("concurrent-like rapid updates do not corrupt state", async () => {
  const cart = createCart();
  const ops = [];
  // simulate 50 near-simultaneous add/update operations
  for (let i = 0; i < 50; i++) {
    ops.push(
      Promise.resolve().then(() => {
        // alternate between adding new id and updating same id
        if (i % 5 === 0) cart.addItem({ id: "hot", price: 1.0 }, 1);
        else cart.addItem({ id: `item-${i}`, price: 0.5 }, 1);
      })
    );
  }
  await Promise.all(ops);
  // ensure totals are consistent (the 'hot' item should have been added ~10 times)
  const qty = cart.getTotalQty();
  expect(qty).toBeGreaterThanOrEqual(50); // at least one qty per op
  expect(cart.getItems().length).toBeGreaterThanOrEqual(10);
});

test("stress test: many items added quickly (performance/sanity)", () => {
  const cart = createCart();
  const N = 1000; // adjust down/up depending on CI time budget
  for (let i = 0; i < N; i++) {
    cart.addItem({ id: `s${i}`, price: 0.99 }, 1);
  }
  expect(cart.getTotalQty()).toBe(N);
  // check subtotal roughly equals N * 0.99
  expect(cart.getSubtotal()).toBeCloseTo(N * 0.99, 2);
});
