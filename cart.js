// cart.js
// ES module — in-memory cart with configurable storage persistence and change events.
// Default storage is localStorage (cross-tab sync). Prices are handled as dollars by default.

const STORAGE_KEY = "lucha_cart_v1";

// Storage mode: 'local' (localStorage, cross-tab) or 'session' (sessionStorage, per-tab).
let _storageMode = "local"; // default per decision 1 (cross-tab persistence enabled)
let _customStorage = null; // For testability/injection

/**
 * Set storage mode at runtime.
 * mode: 'local' | 'session'
 * Calling this will persist current summary to the selected storage and dispatch cart:changed.
 */
export function setStorageMode(mode) {
  if (mode !== "local" && mode !== "session") {
    throw new Error('Invalid storage mode. Use "local" or "session".');
  }
  _storageMode = mode;
  try {
    // move current state to new storage
    const summary = cart.getSummary();
    const raw = JSON.stringify(summary);
    const target = _getStorage();
    target.setItem(STORAGE_KEY, raw);
    // also remove from the other storage to avoid stale copies
    const other = _getStorage(mode === "local" ? "session" : "local");
    try {
      other.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
    // notify listeners
    window.dispatchEvent(
      new CustomEvent("cart:storageModeChanged", { detail: { mode } })
    );
    window.dispatchEvent(new CustomEvent("cart:changed", { detail: summary }));
  } catch (err) {
    console.warn("cart: unable to switch storage mode", err);
  }
}

// For testability
export function __setStorageProvider(provider) {
  _customStorage = provider;
}

function _getStorage(forceMode) {
  // Use custom provider if set (for testing)
  if (_customStorage) return _customStorage;

  const mode = forceMode || _storageMode;
  try {
    if (
      mode === "local" &&
      typeof window !== "undefined" &&
      window.localStorage
    )
      return window.localStorage;
    if (
      mode === "session" &&
      typeof window !== "undefined" &&
      window.sessionStorage
    )
      return window.sessionStorage;
  } catch (err) {
    // access to storage may be blocked (privacy mode), fallthrough
  }
  // fallback object with same API but in-memory (no persistence)
  return {
    _mem: {},
    getItem(key) {
      return this._mem[key] || null;
    },
    setItem(key, val) {
      this._mem[key] = String(val);
    },
    removeItem(key) {
      delete this._mem[key];
    },
  };
}

// Improved price conversion - always treat numbers as dollars unless priceCents provided
const toCents = (price) => {
  if (price == null) return 0;
  if (typeof price === "number") return Math.round(price * 100);
  const s = String(price).trim();
  // remove currency symbols
  const parsed = Number(s.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

export function createCart(initialState = {}, options = {}) {
  const items = new Map(); // key: id -> { id, name, priceCents, qty, meta }
  const storageProvider = options.storageProvider || _getStorage;
  const persistDebounceMs = options.persistDebounceMs || 0;

  let persistTimeout = null;

  function persist() {
    // Clear existing timeout if debouncing
    if (persistDebounceMs > 0 && persistTimeout) {
      clearTimeout(persistTimeout);
    }

    const doPersist = () => {
      try {
        const summary = getSummary();
        const raw = JSON.stringify(summary);
        const storage =
          typeof storageProvider === "function"
            ? storageProvider()
            : storageProvider;
        storage.setItem(STORAGE_KEY, raw);
      } catch (err) {
        console.warn("cart: unable to persist to storage", err);
      }
    };

    if (persistDebounceMs > 0) {
      persistTimeout = setTimeout(doPersist, persistDebounceMs);
    } else {
      doPersist();
    }
  }

  function restore() {
    try {
      const storage =
        typeof storageProvider === "function"
          ? storageProvider()
          : storageProvider;
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return;
      const summary = JSON.parse(raw);
      if (!summary || !Array.isArray(summary.items)) return;
      items.clear();
      for (const it of summary.items) {
        items.set(String(it.id), {
          id: String(it.id),
          name: it.name,
          priceCents: Number(it.priceCents),
          qty: Number(it.qty),
          meta: it.meta || null,
        });
      }
      dispatchChange();
    } catch (err) {
      console.warn("cart: unable to restore from storage", err);
    }
  }

  function dispatchChange() {
    try {
      const summary = getSummary();
      window.dispatchEvent(
        new CustomEvent("cart:changed", { detail: summary })
      );
    } catch (err) {
      /* swallow */
    }
  }

  function addItem(item, qty = 1) {
    if (!item || !item.id) throw new Error("addItem: item must have an id");
    const id = String(item.id);
    // Use priceCents if provided, otherwise convert price to cents
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
    persist();
    dispatchChange();
    return getSummary();
  }

  function updateQty(id, qty) {
    id = String(id);
    if (!items.has(id)) return getSummary();
    const n = Math.max(0, Number(qty));
    if (n === 0) items.delete(id);
    else items.get(id).qty = n;
    persist();
    dispatchChange();
    return getSummary();
  }

  function removeItem(id) {
    id = String(id);
    items.delete(id);
    persist();
    dispatchChange();
    return getSummary();
  }

  function clearCart() {
    items.clear();
    persist();
    dispatchChange();
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
      storageMode: _storageMode,
    };
  }

  function snapshot() {
    return JSON.stringify(getSummary());
  }

  function restoreFromSummary(summary) {
    if (!summary || !Array.isArray(summary.items)) return;
    items.clear();
    for (const it of summary.items) {
      items.set(String(it.id), {
        id: String(it.id),
        name: it.name,
        priceCents: Number(it.priceCents),
        qty: Number(it.qty),
        meta: it.meta || null,
      });
    }
    persist();
    dispatchChange();
  }

  // initialize from storage then from initialState
  if (typeof window !== "undefined") {
    restore();
  }

  if (
    initialState &&
    Array.isArray(initialState.items) &&
    initialState.items.length > 0
  ) {
    for (const it of initialState.items) {
      items.set(String(it.id), {
        id: String(it.id),
        name: it.name,
        priceCents: Number(it.priceCents),
        qty: Number(it.qty),
        meta: it.meta || null,
      });
    }
    persist();
    dispatchChange();
  }

  // Public API
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
