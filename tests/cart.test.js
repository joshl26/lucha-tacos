// tests/cart.test.js
// Run with node (ES module). See README snippet below for run instructions.

import assert from "assert/strict";
import { createCart } from "../cart.js";

function cents(amount) {
  // helper to convert dollars to cents for test convenience
  return Math.round(Number(amount) * 100);
}

async function runTests() {
  console.log("Starting cart tests...");

  // create fresh cart for tests
  const c = createCart();

  // Test 1: addItem and totals
  c.addItem({ id: "t1", name: "California Taco", priceCents: 500 }, 2);
  let s = c.getSummary();
  assert.equal(s.totalQty, 2, "totalQty should be 2 after adding 2 items");
  assert.equal(s.subtotalCents, 1000, "subtotalCents should be 1000 (2 * 500)");

  // Test 2: adding same item increments qty
  c.addItem({ id: "t1", name: "California Taco", priceCents: 500 }, 1);
  s = c.getSummary();
  assert.equal(s.totalQty, 3, "totalQty should be 3 after adding one more");
  assert.equal(s.subtotalCents, 1500, "subtotal = 3 * 500 = 1500");

  // Test 3: updateQty sets exact qty and remove at zero
  c.updateQty("t1", 1);
  s = c.getSummary();
  assert.equal(s.totalQty, 1, "totalQty should be 1 after updateQty to 1");
  assert.equal(s.subtotalCents, 500, "subtotalCents should be 500 after qty=1");

  c.updateQty("t1", 0);
  s = c.getSummary();
  assert.equal(s.totalQty, 0, "totalQty should be 0 after qty=0");
  assert.equal(s.subtotalCents, 0, "subtotalCents should be 0 after removal");

  // Test 4: removeItem and clearCart
  c.addItem({ id: "t2", name: "Al Pastor", priceCents: cents(3.25) }, 2); // $3.25 each
  c.addItem({ id: "t3", name: "Carnitas", priceCents: cents(4) }, 1);
  s = c.getSummary();
  assert.equal(s.totalQty, 3, "3 items in cart (2 + 1)");
  assert.equal(
    s.subtotalCents,
    cents(3.25) * 2 + cents(4) * 1,
    "subtotal should match expected"
  );

  c.removeItem("t2");
  s = c.getSummary();
  assert.equal(s.totalQty, 1, "after removing t2, only 1 item left");
  assert.equal(
    s.subtotalCents,
    cents(4),
    "subtotal should be price of t3 only"
  );

  c.clearCart();
  s = c.getSummary();
  assert.equal(s.totalQty, 0, "cart empty after clearCart");

  console.log("All cart tests passed ✅");
}

runTests().catch((err) => {
  console.error("Tests failed:", err);
  process.exit(1);
});
