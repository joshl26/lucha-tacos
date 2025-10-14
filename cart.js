// cart.js
// ES module — in-memory cart factory and default instance
// Price values are handled as integer cents to avoid floating point errors.

export function createCart(initialState = {}) {
  const items = new Map(); // key: id -> { id, name, priceCents, qty, meta }

  const toCents = (price) => {
    if (price == null) return 0;
    if (Number.isInteger(price)) return price; // already cents
    return Math.round(Number(price) * 100);
  };

  function addItem(item, qty = 1) {
    if (!item || !item.id) throw new Error("addItem: item must have an id");
    const id = String(item.id);
    const priceCents =
      item.priceCents != null ? Number(item.priceCents) : toCents(item.price);
    const name = item.name || item.title || id;
    const meta = item.meta || null;
    const existing = items.get(id);
    if (existing) {
      existing.qty = Math.max(0, existing.qty + Number(qty));
      if (existing.qty === 0) items.delete(id);
    } else {
      const q = Math.max(0, Number(qty));
      if (q > 0) items.set(id, { id, name, priceCents, qty: q, meta });
    }
    return getSummary();
  }

  function updateQty(id, qty) {
    if (!items.has(id)) return getSummary();
    const n = Math.max(0, Number(qty));
    if (n === 0) items.delete(id);
    else items.get(id).qty = n;
    return getSummary();
  }

  function removeItem(id) {
    items.delete(id);
    return getSummary();
  }

  function clearCart() {
    items.clear();
    return getSummary();
  }

  function getItems() {
    return Array.from(items.values()).map((it) => ({ ...it }));
  }

  function getTotalQty() {
    let total = 0;
    for (const it of items.values()) total += Number(it.qty);
    return total;
  }

  function getSubtotalCents() {
    let subtotal = 0;
    for (const it of items.values())
      subtotal += Number(it.priceCents) * Number(it.qty);
    return subtotal;
  }

  function getSubtotal() {
    return getSubtotalCents() / 100;
  }

  function getSummary() {
    return {
      items: getItems(),
      totalQty: getTotalQty(),
      subtotalCents: getSubtotalCents(),
      subtotal: getSubtotal(),
    };
  }

  function snapshot() {
    return JSON.stringify(getSummary());
  }

  function restoreFromSummary(summary) {
    if (!summary || !Array.isArray(summary.items)) return;
    items.clear();
    for (const it of summary.items) {
      items.set(it.id, {
        id: it.id,
        name: it.name,
        priceCents: Number(it.priceCents),
        qty: Number(it.qty),
        meta: it.meta || null,
      });
    }
  }

  if (initialState && Array.isArray(initialState.items)) {
    for (const it of initialState.items) {
      items.set(it.id, {
        id: it.id,
        name: it.name,
        priceCents: Number(it.priceCents),
        qty: Number(it.qty),
        meta: it.meta || null,
      });
    }
  }

  return {
    addItem,
    updateQty,
    removeItem,
    clearCart,
    getItems,
    getTotalQty,
    getSubtotalCents,
    getSubtotal,
    getSummary,
    snapshot,
    restoreFromSummary,
  };
}

// default singleton instance (convenience)
export const cart = createCart();
