// Transport-agnostic KOT printing via node-thermal-printer.
//   - WiFi/Ethernet:  interface = tcp://<ip>:<port>   (pure JS, no native module)
//   - USB:            interface = printer:<WindowsPrinterName>
//                     (requires the @thiagoelg/node-printer native driver)
const {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} = require("node-thermal-printer");

// node-thermal-printer's `printer:` and `tcp://` interface regexes both require
// a NON-EMPTY host/name. A blank value would silently fall through to its File
// interface and write raw ESC/POS bytes to a literal file named "printer:" /
// "tcp:" — and File.execute retries 1000×200ms (~200s), freezing the poll loop.
// So validate up front and fail fast with a clear message.
function buildInterface(config) {
  if (config.transport === "usb") {
    if (!config.usbPrinterName) throw new Error("No USB printer selected");
    return `printer:${config.usbPrinterName}`;
  }
  if (!config.printerIp) throw new Error("No printer IP configured");
  return `tcp://${config.printerIp}:${config.printerPort || 9100}`;
}

// Lazily load the native USB driver only when USB is actually used. The TCP
// path never touches it, so a missing native module doesn't break WiFi/Ethernet.
let _usbDriver = null;
function usbDriver() {
  if (_usbDriver) return _usbDriver;
  try {
    _usbDriver = require("@thiagoelg/node-printer");
  } catch {
    throw new Error(
      "USB printing module not installed — run: npm i @thiagoelg/node-printer && npm run rebuild-usb",
    );
  }
  return _usbDriver;
}

function makePrinter(config) {
  const opts = {
    type: PrinterTypes.EPSON, // TVS Champ RP STAR speaks ESC/POS (Epson-compatible)
    interface: buildInterface(config),
    characterSet: CharacterSet.PC437_USA,
    removeSpecialCharacters: false,
    options: { timeout: 5000 },
  };
  // The printer: interface needs the native driver object passed explicitly;
  // node-thermal-printer does NOT auto-require it (throws "No driver set!").
  if (config.transport === "usb") opts.driver = usbDriver();
  return new ThermalPrinter(opts);
}

async function isConnected(config) {
  try {
    return await makePrinter(config).isPrinterConnected();
  } catch {
    return false;
  }
}

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour12: true });
  } catch {
    return "";
  }
}

// Render + send one KOT. Throws if the printer is unreachable (so the caller
// leaves the order unmarked and retries on the next poll).
// Note: over TCP, execute() resolves when bytes hit the OS socket — it does NOT
// confirm physical printing (paper-out is not detected here).
async function printKot(config, order) {
  const p = makePrinter(config);

  p.alignCenter();
  p.bold(true);
  p.setTextDoubleHeight();
  p.setTextDoubleWidth();
  p.println("** KOT **");
  p.setTextNormal();
  p.bold(false);
  p.drawLine();

  // KOT number — large
  p.setTextSize(1, 1);
  p.println(order.kotNumber || "");
  p.setTextNormal();

  p.alignLeft();
  p.println(`Table : ${order.tableLabel || "-"}`);
  p.println(`Time  : ${fmtTime(order.createdAt)}`);
  p.println(`Capt  : ${order.captainName || "-"}`);
  p.drawLine();

  for (const it of order.items || []) {
    const veg = it.isVegetarian ? "[V]" : "[N]";
    p.println(`${it.quantity}x ${it.name} ${veg}`);
    if (it.notes) p.println(`   >> ${it.notes}`);
  }
  p.drawLine();

  if (order.specialInstructions) {
    p.println(`NOTE: ${order.specialInstructions}`);
    p.drawLine();
  }

  p.cut();
  await p.execute();
}

async function testPrint(config) {
  await printKot(config, {
    kotNumber: "TEST-001",
    tableLabel: "Table 1",
    captainName: "Agent",
    createdAt: new Date().toISOString(),
    items: [
      { quantity: 1, name: "Paneer Tikka", isVegetarian: true },
      { quantity: 2, name: "Butter Naan", isVegetarian: true, notes: "extra butter" },
    ],
    specialInstructions: "Printer connection OK",
  });
}

module.exports = { printKot, testPrint, isConnected, makePrinter };
