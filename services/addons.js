const MAX_ADDONS = 10;

function normalizeAddon(raw) {
  if (typeof raw === 'string') {
    const code = raw.trim().slice(0, 40);
    return code ? { code, label: code, price: 0 } : null;
  }
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const code = String(raw.code || raw.id || '').trim().slice(0, 40);
  if (!code) {
    return null;
  }
  const price = Number(raw.price);
  return {
    code,
    label: String(raw.label || raw.name || code).trim().slice(0, 120),
    price: Number.isFinite(price) && price >= 0 ? Math.round(price) : 0,
  };
}

/**
 * Los add-ons llegan del storefront, que es el que cotiza. Acá sólo se valida
 * la forma y se recalcula el subtotal para no guardar datos inconsistentes.
 */
function normalizeAddons(input) {
  const list = Array.isArray(input) ? input : [];
  const seen = new Set();
  const addons = [];

  for (const raw of list) {
    const addon = normalizeAddon(raw);
    if (!addon || seen.has(addon.code)) {
      continue;
    }
    seen.add(addon.code);
    addons.push(addon);
    if (addons.length >= MAX_ADDONS) {
      break;
    }
  }

  return {
    addons,
    total: addons.reduce((sum, addon) => sum + addon.price, 0),
  };
}

module.exports = { normalizeAddons };
