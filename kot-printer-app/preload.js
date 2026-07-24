const { contextBridge, ipcRenderer } = require("electron");

// Bridge a small, explicit API to the dashboard. No nodeIntegration.
contextBridge.exposeInMainWorld("agent", {
  // queries / actions
  getState: () => ipcRenderer.invoke("get-state"),
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (c) => ipcRenderer.invoke("save-config", c),
  scanLan: () => ipcRenderer.invoke("scan-lan"),
  listUsb: () => ipcRenderer.invoke("list-usb"),
  autodetect: () => ipcRenderer.invoke("autodetect"),
  testPrint: () => ipcRenderer.invoke("test-print"),
  testConnection: () => ipcRenderer.invoke("test-connection"),
  printNow: () => ipcRenderer.invoke("print-now"),
  reprint: (kotNumber) => ipcRenderer.invoke("reprint", kotNumber),
  // live streams
  onStatus: (cb) => ipcRenderer.on("status", (_e, s) => cb(s)),
  onActivity: (cb) => ipcRenderer.on("activity", (_e, a) => cb(a)),
  onState: (cb) => ipcRenderer.on("state", (_e, s) => cb(s)),
  // Offline POS
  getMenuData: () => ipcRenderer.invoke("get-menu-data"),
  getOfflineQueue: () => ipcRenderer.invoke("get-offline-queue"),
  placeOfflineOrder: (orderData) => ipcRenderer.invoke("place-offline-order", orderData),
  forceSyncMenu: () => ipcRenderer.invoke("force-sync-menu"),
  onMenuUpdated: (cb) => ipcRenderer.on("menu-updated", (_e, m) => cb(m)),
  onSyncUpdated: (cb) => ipcRenderer.on("sync-updated", (_e, s) => cb(s)),
});
