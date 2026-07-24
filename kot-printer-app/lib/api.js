// Thin client for the Regalia print-queue API.
// Server URL + token are baked in (see ../config.js) — hidden from the UI.
const { SERVER_URL, AGENT_TOKEN } = require("../config");

const BASE = SERVER_URL.replace(/\/+$/, ""); // strip trailing slash

function authHeaders() {
  return {
    Authorization: `Bearer ${AGENT_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/**
 * Fetch unprinted KOTs. Returns an array (possibly empty).
 * Throws on network error or non-2xx so the caller can show a red status.
 */
async function fetchQueue() {
  const res = await fetch(`${BASE}/api/orders/print-queue`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`print-queue HTTP ${res.status}`);
  return res.json();
}

/** Mark a KOT as printed. Throws on non-2xx. */
async function markPrinted(orderId) {
  const res = await fetch(`${BASE}/api/orders/${orderId}/mark-printed`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`mark-printed HTTP ${res.status}`);
  return res.json();
}

/** Fetch menu, categories, and locations for offline POS. */
async function fetchSyncMenu() {
  const res = await fetch(`${BASE}/api/sync/menu`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`sync-menu HTTP ${res.status}`);
  return res.json();
}

/** Push offline orders to the server. */
async function pushOfflineOrders(orders) {
  const res = await fetch(`${BASE}/api/sync/offline-orders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ orders }),
  });
  if (!res.ok) throw new Error(`sync-offline-orders HTTP ${res.status}`);
  return res.json();
}

module.exports = { fetchQueue, markPrinted, fetchSyncMenu, pushOfflineOrders, BASE };
