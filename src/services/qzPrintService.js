import qz from "qz-tray";

const DEFAULT_PRINTER = "BlackCopper 80mm Series(2)";

// ========================
// CONNECTION
// ========================
let isConnected = false;

export const connectQZ = async () => {
  try {
    if (isConnected && qz.websocket.isActive()) return;
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
    }
    isConnected = true;
    console.log("QZ CONNECTED ✔");
  } catch (err) {
    console.error("QZ CONNECT ERROR:", err);
    isConnected = false;
  }
};

// ========================
// PRINTER CONFIG
// ========================
export const getConfig = (printerName = DEFAULT_PRINTER) => {
  return qz.configs.create(printerName, {
    size: { width: 79 },
    units: "mm",
  });
};

// ========================
// ESC/POS COMMANDS
// ========================
const ESC = "\x1B";
const GS  = "\x1D";

const CMD = {
  INIT:         ESC + "\x40",      // Initialize printer
  FEED:         ESC + "\x64\x04",  // Feed 4 lines
  CUT:          GS  + "\x56\x00",  // Full cut

  BOLD_ON:      ESC + "\x45\x01",
  BOLD_OFF:     ESC + "\x45\x00",

  ALIGN_LEFT:   ESC + "\x61\x00",
  ALIGN_CENTER: ESC + "\x61\x01",
  ALIGN_RIGHT:  ESC + "\x61\x02",

  FONT_NORMAL:  ESC + "\x21\x00",  // Normal size
  FONT_WIDE:    ESC + "\x21\x20",  // Double-width
  FONT_TALL:    ESC + "\x21\x10",  // Double-height
  FONT_BIG:     ESC + "\x21\x30",  // Double-width + double-height
};

// ========================
// LAYOUT CONSTANTS
// ========================
const WIDTH          = 48;  // total chars per normal line
const WIDE_WIDTH     = 24;  // total chars per double-width line (FONT_WIDE)
const ITEM_NAME_W    = 22;  // chars reserved for item name column
const ITEM_QTY_W     = 4;   // chars for qty column
const ITEM_PRICE_W   = 10;  // chars for unit price column
// TOTAL takes the remainder: WIDTH - ITEM_NAME_W - ITEM_QTY_W - ITEM_PRICE_W = 12

// ========================
// HELPERS
// ========================
const line  = () => "-".repeat(WIDTH);
const dline = () => "=".repeat(WIDTH);

/** Left-right two-column row, optional custom width */
const twoCol = (left, right, width = WIDTH) => {
  left  = String(left  || "");
  right = String(right || "");
  const gap = width - left.length - right.length;
  return gap > 0
    ? left + " ".repeat(gap) + right
    : left.substring(0, width - right.length - 1) + " " + right;
};

/** Build display name: "Daal Mash (Half)" */
const itemLabel = (item) =>
  item.variantName ? `${item.name} (${item.variantName})` : item.name;

const endPrint = () => "\n\n" + CMD.FEED + CMD.CUT;

// ========================
// ITEM LINE BUILDER
// Keeps qty / price / total columns perfectly aligned even for long names.
// Long names word-wrap; continuation lines are indented, columns stay intact.
// ========================
const buildItemLine = (item) => {
  const label    = itemLabel(item);
  const total    = item.quantity * item.price;
  const qtyStr   = String(item.quantity).padEnd(ITEM_QTY_W);
  const priceStr = `Rs.${item.price.toFixed(2)}`.padEnd(ITEM_PRICE_W);
  const totalStr = `Rs.${total.toFixed(2)}`;

  // Word-boundary wrap label into ITEM_NAME_W-wide chunks
  const words  = label.split(" ");
  const chunks = [];
  let current  = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > ITEM_NAME_W) {
      if (current) chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);

  const lines = [];

  // First chunk: name col + qty + price + total — all on ONE line
  lines.push(
    chunks[0].padEnd(ITEM_NAME_W) + qtyStr + priceStr + totalStr
  );

  // Remaining name chunks: indented continuation, no numbers (table intact)
  for (let i = 1; i < chunks.length; i++) {
    lines.push("  " + chunks[i]);
  }

  return lines.join("\n");
};

// ========================
// SHARED BILL BUILDER
// ========================
const buildBillData = (order) => {
  let subtotal = 0;

  const itemLines = order.items.map((i) => {
    subtotal += i.quantity * i.price;
    return buildItemLine(i);
  });

  const discount   = order.discount || 0;
  const grandTotal = order.total;
  const change     = order.amountPaid != null ? order.amountPaid - grandTotal : null;

  return { itemLines, subtotal, discount, grandTotal, change };
};

// ========================
// KITCHEN TOKEN
// ========================
export const printKitchenToken = async (order, printerName = DEFAULT_PRINTER) => {
  await connectQZ();
  const config = getConfig(printerName);

  const items = order.items
    .map((i) => `  ${i.quantity} x ${itemLabel(i)}`)
    .join("\n");

  const data = [
    CMD.INIT,

    CMD.ALIGN_CENTER,
    CMD.FONT_BIG, CMD.BOLD_ON,
    "KITCHEN\n",
    CMD.FONT_NORMAL, CMD.BOLD_OFF,

    line() + "\n",

    CMD.ALIGN_LEFT,
    CMD.BOLD_ON, "Order #: ", CMD.BOLD_OFF, `${order.OrderNo}\n`,
    CMD.BOLD_ON, "Table  : ", CMD.BOLD_OFF, `${order.tableNo || "-"}\n`,
    CMD.BOLD_ON, "Type   : ", CMD.BOLD_OFF, `${(order.orderType || "dine-in").toUpperCase()}\n`,
    CMD.BOLD_ON, "Time   : ", CMD.BOLD_OFF, `${new Date().toLocaleTimeString()}\n`,

    line() + "\n",
    CMD.BOLD_ON, "  ITEMS\n", CMD.BOLD_OFF,
    line() + "\n",

    items + "\n",

    line() + "\n",
    CMD.ALIGN_CENTER,
    `Total Items: ${order.items.reduce((s, i) => s + i.quantity, 0)}\n`,

    endPrint(),
  ];

  await qz.print(config, data, { copies: 1 });
};

// ========================
// WAITER TOKEN
// ========================
export const printWaiterToken = async (order, waiter, printerName = DEFAULT_PRINTER) => {
  await connectQZ();
  const config = getConfig(printerName);

  const data = [
    CMD.INIT,

    CMD.ALIGN_CENTER,
    CMD.FONT_BIG, CMD.BOLD_ON,
    "WAITER\n",
    CMD.FONT_NORMAL, CMD.BOLD_OFF,

    line() + "\n",

    CMD.ALIGN_LEFT,
    CMD.BOLD_ON, "Order #: ", CMD.BOLD_OFF, `${order.OrderNo}\n`,
    CMD.BOLD_ON, "Waiter : ", CMD.BOLD_OFF, `${waiter || "-"}\n`,
    CMD.BOLD_ON, "Table  : ", CMD.BOLD_OFF, `${order.tableNo || "-"}\n`,
    CMD.BOLD_ON, "Items  : ", CMD.BOLD_OFF, `${order.items.length}\n`,
    CMD.BOLD_ON, "Time   : ", CMD.BOLD_OFF, `${new Date().toLocaleTimeString()}\n`,

    endPrint(),
  ];

  await qz.print(config, data, { copies: 1 });
};

// ========================
// CUSTOMER BILL (UNPAID)
// ========================
export const printCustomerBill = async (order, restaurant, printerName = DEFAULT_PRINTER) => {
  await connectQZ();
  const config = getConfig(printerName);

  const { itemLines, subtotal, discount, grandTotal } = buildBillData(order);

  const data = [
    CMD.INIT,

    // ---- HEADER ----
    CMD.ALIGN_CENTER,
    CMD.FONT_BIG, CMD.BOLD_ON,
    `${restaurant.name || "RESTAURANT"}\n`,
    CMD.FONT_NORMAL, CMD.BOLD_OFF,

    restaurant.tagline ? `${restaurant.tagline}\n` : "",
    restaurant.address ? `${restaurant.address}\n` : "",
    restaurant.phone   ? `Tel: ${restaurant.phone}\n` : "",

    dline() + "\n",

    // ---- ORDER INFO ----
    CMD.ALIGN_LEFT,
    twoCol(`Order #: ${order.OrderNo}`, `Table: ${order.tableNo || "-"}`) + "\n",
    twoCol(`Type: ${(order.orderType || "dine-in").toUpperCase()}`, `Date: ${new Date().toLocaleDateString()}`) + "\n",
    `Time: ${new Date().toLocaleTimeString()}\n`,

    line() + "\n",

    // ---- COLUMN HEADERS ----
    CMD.BOLD_ON,
    `${"ITEM".padEnd(ITEM_NAME_W)}${"QTY".padEnd(ITEM_QTY_W)}${"PRICE".padEnd(ITEM_PRICE_W)}TOTAL\n`,
    CMD.BOLD_OFF,
    line() + "\n",

    // ---- ITEMS ----
    itemLines.join("\n") + "\n",

    line() + "\n",

    // ---- TOTALS ----
    twoCol("Subtotal:", `Rs.${subtotal.toFixed(2)}`) + "\n",
    discount > 0 ? twoCol("Discount:", `-Rs.${discount.toFixed(2)}`) + "\n" : "",

    dline() + "\n",
    CMD.BOLD_ON, CMD.FONT_WIDE,
    twoCol("TOTAL:", `Rs.${grandTotal.toFixed(2)}`, WIDE_WIDTH) + "\n",
    CMD.FONT_NORMAL, CMD.BOLD_OFF,
    dline() + "\n",

    // ---- STATUS ----
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON, "** BILL NOT YET PAID **\n", CMD.BOLD_OFF,

    endPrint(),
  ];

  await qz.print(config, data, { copies: 1 });
};

// ========================
// PAID RECEIPT
// ========================
export const printPaidBill = async (order, restaurant, waiter, printerName = DEFAULT_PRINTER) => {
  await connectQZ();
  const config = getConfig(printerName);

  const { itemLines, subtotal, discount, grandTotal, change } = buildBillData(order);

  const data = [
    CMD.INIT,

    // ---- HEADER ----
    CMD.ALIGN_CENTER,
    CMD.FONT_BIG, CMD.BOLD_ON,
    `${restaurant.name || "RESTAURANT"}\n`,
    CMD.FONT_NORMAL, CMD.BOLD_OFF,

    restaurant.tagline ? `${restaurant.tagline}\n` : "",
    restaurant.address ? `${restaurant.address}\n` : "",
    restaurant.phone   ? `Tel: ${restaurant.phone}\n` : "",

    dline() + "\n",

    // ---- ORDER INFO ----
    CMD.ALIGN_LEFT,
    twoCol(`Order #: ${order.OrderNo}`, `Table: ${order.tableNo || "-"}`) + "\n",
    twoCol(`Type: ${(order.orderType || "dine-in").toUpperCase()}`, `Date: ${new Date().toLocaleDateString()}`) + "\n",
    `Time: ${new Date().toLocaleTimeString()}\n`,
    waiter ? `Waiter: ${waiter.name || waiter}\n` : "",

    line() + "\n",

    // ---- COLUMN HEADERS ----
    CMD.BOLD_ON,
    `${"ITEM".padEnd(ITEM_NAME_W)}${"QTY".padEnd(ITEM_QTY_W)}${"PRICE".padEnd(ITEM_PRICE_W)}TOTAL\n`,
    CMD.BOLD_OFF,
    line() + "\n",

    // ---- ITEMS ----
    itemLines.join("\n") + "\n",

    line() + "\n",

    // ---- TOTALS ----
    twoCol("Subtotal:", `Rs.${subtotal.toFixed(2)}`) + "\n",
    discount > 0 ? twoCol("Discount:", `-Rs.${discount.toFixed(2)}`) + "\n" : "",

    dline() + "\n",
    CMD.BOLD_ON, CMD.FONT_WIDE,
    twoCol("TOTAL:", `Rs.${grandTotal.toFixed(2)}`, WIDE_WIDTH) + "\n",
    CMD.FONT_NORMAL, CMD.BOLD_OFF,
    dline() + "\n",

    // ---- PAYMENT INFO ----
    order.amountPaid != null ? twoCol("Cash Received:", `Rs.${Number(order.amountPaid).toFixed(2)}`) + "\n" : "",
    change != null && change >= 0 ? twoCol("Change:", `Rs.${change.toFixed(2)}`) + "\n" : "",
    order.paymentMethod ? twoCol("Payment Via:", order.paymentMethod.toUpperCase()) + "\n" : "",

    line() + "\n",

    // ---- STATUS & FOOTER ----
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON, "** PAID **\n", CMD.BOLD_OFF,

    "\n",
    "Thank you for dining with us!\n",
    restaurant.name ? `Visit us again at ${restaurant.name}\n` : "",
    restaurant.website ? `${restaurant.website}\n` : "",
    restaurant.instagram ? `${restaurant.instagram}\n` : "",

    line() + "\n",
    `${new Date().toLocaleString()}\n`,

    endPrint(),
  ];

  await qz.print(config, data, { copies: 1 });
};