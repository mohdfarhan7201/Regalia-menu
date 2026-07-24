const $ = (id) => document.getElementById(id);
let transport = "tcp";
let config = {};

// ── Tabs ──────────────────────────────────────────────────────────────────────
document.querySelectorAll("nav button").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll("nav button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    $(`tab-${b.dataset.tab}`).classList.add("active");
  };
});

// ── Live status / stats / log ─────────────────────────────────────────────────
function setStatus(s) {
  $("pillDot").classList.toggle("ok", !!s.ok);
  $("pillMsg").textContent = s.msg || "";
  $("dStatus").textContent = s.msg || "—";
}
function setStats(st) {
  $("cPrinted").textContent = st.printedToday ?? 0;
  $("cPending").textContent = st.queuePending ?? 0;
  $("cFail").textContent = st.failures ?? 0;
}
function addLog(entry) {
  const el = document.createElement("div");
  el.className = "ln";
  el.innerHTML = `<span class="t">${entry.time}</span><span class="${entry.level}">${escapeHtml(entry.text)}</span>`;
  const log = $("log");
  log.insertBefore(el, log.firstChild);
  while (log.childElementCount > 200) log.removeChild(log.lastChild);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function renderHistory(history) {
  const body = $("histBody");
  body.innerHTML = "";
  if (!history || !history.length) {
    $("histEmpty").classList.remove("hide");
    return;
  }
  $("histEmpty").classList.add("hide");
  for (const h of history) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>${escapeHtml(h.kotNumber)}</td><td>${escapeHtml(h.table)}</td>` +
      `<td>${escapeHtml(h.captain)}</td><td>${escapeHtml(h.time)}</td>` +
      `<td><span class="badge ${h.ok ? "ok" : "bad"}">${h.ok ? "printed" : "failed"}</span></td>` +
      `<td><button class="act" data-kot="${escapeHtml(h.kotNumber)}" style="padding:5px 10px">Reprint</button></td>`;
    body.appendChild(tr);
  }
}
$("histBody").onclick = async (e) => {
  const kot = e.target?.dataset?.kot;
  if (!kot) return;
  e.target.textContent = "…";
  const r = await window.agent.reprint(kot);
  e.target.textContent = r.ok ? "Sent" : "Failed";
  setTimeout(() => (e.target.textContent = "Reprint"), 1500);
};

// ── Printer tab ───────────────────────────────────────────────────────────────
function setTransport(t) {
  transport = t;
  $("seg-tcp").classList.toggle("active", t === "tcp");
  $("seg-usb").classList.toggle("active", t === "usb");
  $("tcpBox").classList.toggle("hide", t !== "tcp");
  $("usbBox").classList.toggle("hide", t !== "usb");
}
$("seg-tcp").onclick = () => setTransport("tcp");
$("seg-usb").onclick = () => setTransport("usb");

function addOption(selId, val, selected) {
  const sel = $(selId);
  if (![...sel.options].some((o) => o.value === val)) {
    const o = document.createElement("option");
    o.value = val;
    o.textContent = val;
    sel.appendChild(o);
  }
  if (selected) sel.value = val;
}

$("scanLan").onclick = async (e) => {
  e.target.textContent = "Scanning…";
  e.target.disabled = true;
  const ips = await window.agent.scanLan();
  e.target.textContent = "Scan";
  e.target.disabled = false;
  const sel = $("lanResults");
  const cur = $("printerIp").value;
  sel.innerHTML = '<option value="">— select —</option>';
  ips.forEach((ip) => addOption("lanResults", ip));
  if (ips.includes(cur)) sel.value = cur;
  else if (ips.length === 1) {
    sel.value = ips[0];
    $("printerIp").value = ips[0];
  }
  if (!ips.length) addOption("lanResults", "none found", false);
};
$("lanResults").onchange = (e) => {
  if (e.target.value && e.target.value !== "none found") $("printerIp").value = e.target.value;
};
$("scanUsb").onclick = async (e) => {
  e.target.textContent = "Scanning…";
  e.target.disabled = true;
  const names = await window.agent.listUsb();
  e.target.textContent = "Scan";
  e.target.disabled = false;
  $("usbResults").innerHTML = '<option value="">— select —</option>';
  names.forEach((n) => addOption("usbResults", n));
  if (!names.length) addOption("usbResults", "none found", false);
};

function gatherConfig() {
  return {
    transport,
    printerIp: $("printerIp").value.trim(),
    printerPort: Number($("printerPort").value) || 9100,
    usbPrinterName: $("usbResults").value || config.usbPrinterName || "",
    pollMs: Number($("pollMs").value) || 4000,
    autoLaunch: $("autoLaunch").checked,
  };
}
async function save() {
  await window.agent.saveConfig(gatherConfig());
}
$("bSavePrinter").onclick = save;
$("bSaveSettings").onclick = save;

// ── Action buttons ────────────────────────────────────────────────────────────
$("bTest").onclick = $("bTest2").onclick = async () => {
  await window.agent.testPrint();
};
$("bPrintNow").onclick = () => window.agent.printNow();
$("bFind").onclick = () => window.agent.autodetect();

// ── Printer summary line ──────────────────────────────────────────────────────
function printerSummary(c) {
  if (c.transport === "usb") return c.usbPrinterName ? `USB · ${c.usbPrinterName}` : "USB · not set";
  return c.printerIp ? `WiFi/LAN · ${c.printerIp}:${c.printerPort || 9100}` : "WiFi/LAN · not set";
}

// ── Hydrate ───────────────────────────────────────────────────────────────────
async function load() {
  const s = await window.agent.getState();
  config = s.config;
  $("serverLine").textContent = (config.serverUrl || "").replace(/^https?:\/\//, "");
  $("dServer").textContent = config.serverUrl || "—";
  $("sServer").textContent = config.serverUrl || "—";
  $("sToken").textContent = config.tokenConfigured ? "configured ✓" : "NOT set ✕";
  $("dPrinter").textContent = printerSummary(config);
  $("printerIp").value = config.printerIp || "";
  $("printerPort").value = config.printerPort || 9100;
  $("pollMs").value = config.pollMs || 4000;
  $("autoLaunch").checked = config.autoLaunch !== false;
  if (config.printerIp) addOption("lanResults", config.printerIp, true);
  if (config.usbPrinterName) addOption("usbResults", config.usbPrinterName, true);
  setTransport(config.transport || "tcp");

  if (config.tokenConfigured === false) {
    $("tokenWarn").classList.remove("hide");
    $("bTest").disabled = $("bTest2").disabled = $("bPrintNow").disabled = true;
  }

  setStatus(s.status);
  setStats(s.stats);
  renderHistory(s.history);
  (s.activity || []).slice().reverse().forEach(addLog);
}

window.agent.onStatus(setStatus);
window.agent.onActivity(addLog);
window.agent.onState((s) => {
  setStatus(s.status);
  setStats(s.stats);
  renderHistory(s.history);
  $("dPrinter").textContent = printerSummary(config);
});

// ── Offline POS Logic ──────────────────────────────────────────────────────────
let posMenu = { categories: [], items: [], locations: [] };
let posCart = [];
let currentCategory = null;

async function loadPosData() {
  posMenu = await window.agent.getMenuData();
  renderPosMenu();
}

function renderPosMenu() {
  const catEl = $("posCategories");
  const itemsEl = $("posItems");
  const tableEl = $("posTableSelect");
  
  // Render tables
  if (posMenu.locations && posMenu.locations.length) {
    const curTable = tableEl.value;
    tableEl.innerHTML = '<option value="">Select Table...</option>';
    posMenu.locations.forEach(t => {
      addOption("posTableSelect", t._id, false);
      tableEl.lastChild.textContent = t.label;
    });
    if (curTable) tableEl.value = curTable;
  }

  if (!posMenu.categories || posMenu.categories.length === 0) {
    itemsEl.innerHTML = '<div class="empty">No menu data. Wait for network sync.</div>';
    return;
  }

  // Render categories
  catEl.innerHTML = "";
  posMenu.categories.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "act" + (currentCategory === c._id ? " active" : "");
    btn.style.padding = "6px 12px";
    btn.style.whiteSpace = "nowrap";
    btn.textContent = c.name;
    btn.onclick = () => {
      currentCategory = c._id;
      renderPosMenu();
    };
    catEl.appendChild(btn);
  });
  if (!currentCategory && posMenu.categories.length > 0) {
    currentCategory = posMenu.categories[0]._id;
    catEl.firstChild.classList.add("active");
  }

  // Render items
  itemsEl.innerHTML = "";
  const filtered = (posMenu.items || []).filter(i => i.categoryId === currentCategory);
  filtered.forEach(item => {
    const d = document.createElement("div");
    d.className = "card";
    d.style.cursor = "pointer";
    d.style.userSelect = "none";
    d.innerHTML = `<div style="font-weight:600; font-size:13px; line-height:1.2; margin-bottom:5px">${escapeHtml(item.name)}</div><div class="k">₹${item.discountPrice ?? item.price}</div>`;
    d.onclick = () => addToCart(item);
    itemsEl.appendChild(d);
  });
}

function addToCart(item) {
  const ex = posCart.find(c => c.itemId === item._id);
  if (ex) ex.quantity++;
  else posCart.push({ itemId: item._id, name: item.name, price: item.discountPrice ?? item.price, quantity: 1 });
  renderCart();
}

function updateQty(id, delta) {
  const ex = posCart.find(c => c.itemId === id);
  if (ex) {
    ex.quantity += delta;
    if (ex.quantity <= 0) posCart = posCart.filter(c => c.itemId !== id);
  }
  renderCart();
}

function renderCart() {
  const cEl = $("posCart");
  cEl.innerHTML = "";
  let tot = 0;
  if (posCart.length === 0) {
    cEl.innerHTML = '<div class="empty" style="font-size:12px">Cart is empty</div>';
  } else {
    posCart.forEach(c => {
      tot += c.price * c.quantity;
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.marginBottom = "8px";
      row.innerHTML = `
        <div style="flex:1; font-size:13px; line-height:1.2">
          ${escapeHtml(c.name)}<br/><span style="color:var(--muted); font-size:11px">₹${c.price} x ${c.quantity}</span>
        </div>
        <div style="display:flex; gap:5px; align-items:center">
          <button class="act" style="padding:2px 8px" onclick="updateQty('${c.itemId}', -1)">-</button>
          <span style="width:20px; text-align:center">${c.quantity}</span>
          <button class="act" style="padding:2px 8px" onclick="updateQty('${c.itemId}', 1)">+</button>
        </div>
      `;
      cEl.appendChild(row);
    });
  }
  $("posTotal").textContent = "₹" + tot;
  $("btnPlaceOrder").disabled = posCart.length === 0 || !$("posTableSelect").value;
}

$("posTableSelect").onchange = renderCart;

$("btnPlaceOrder").onclick = async () => {
  const tId = $("posTableSelect").value;
  if (!tId || posCart.length === 0) return;
  const tLabel = posMenu.locations.find(l => l._id === tId)?.label || "Unknown";
  
  $("btnPlaceOrder").disabled = true;
  $("btnPlaceOrder").textContent = "Printing...";
  
  const orderData = {
    tableId: tId,
    tableLabel: tLabel,
    items: posCart
  };

  const res = await window.agent.placeOfflineOrder(orderData);
  if (res.ok) {
    posCart = [];
    $("posTableSelect").value = "";
    renderCart();
    alert(`Offline KOT generated: ${res.kotNumber}`);
  } else {
    alert("Failed to place offline order: " + res.error);
  }
  $("btnPlaceOrder").textContent = "Print & Place Order";
  renderCart();
};

$("btnForceSync").onclick = async (e) => {
  e.target.disabled = true;
  e.target.textContent = "Syncing...";
  const res = await window.agent.forceSyncMenu();
  if (!res.ok) alert("Menu Sync failed: " + res.error);
  e.target.textContent = "Sync Menu";
  e.target.disabled = false;
};

window.agent.onMenuUpdated((data) => {
  posMenu = data;
  renderPosMenu();
});

window.agent.onSyncUpdated((data) => {
  const pill = $("syncPill");
  if (data.pending > 0) {
    pill.style.display = "flex";
    $("syncMsg").textContent = `Pending Sync: ${data.pending}`;
    $("syncDot").className = "dot"; // red
  } else {
    pill.style.display = "none";
  }
});

async function checkSync() {
  const queue = await window.agent.getOfflineQueue();
  if (queue && queue.length > 0) {
    $("syncPill").style.display = "flex";
    $("syncMsg").textContent = `Pending Sync: ${queue.length}`;
    $("syncDot").className = "dot"; 
  }
}

checkSync();
loadPosData();

load();

