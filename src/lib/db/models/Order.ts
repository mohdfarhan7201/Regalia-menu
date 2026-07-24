import mongoose, { Schema, Document, Model } from "mongoose";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "partially_ready"
  | "ready"
  | "partially_delivered"
  | "delivered"
  | "cancelled"
  | "paid"
  | "cleared";

export type ItemStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface IOrderItemDoc {
  _id: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isVegetarian: boolean;
  preparationTtlMinutes: number;
  itemStatus: ItemStatus;
  orderedAt: Date;
  preparingAt?: Date;
  readyAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId; // staff who voided the item
  cancelReason?: string;
  isNoCharge?: boolean; // complimentary — made + served but billed ₹0
  ncReason?: string;
  ncBy?: mongoose.Types.ObjectId;
}

export interface ISplitPaymentEntry {
  method: "cash" | "card" | "upi" | "room_charge";
  amount: number;
}

export interface IOrderDoc extends Document {
  kotNumber: string;
  tableId: mongoose.Types.ObjectId;
  tableLabel: string;
  captainId: mongoose.Types.ObjectId;
  captainName: string;
  placedByRole?: "captain" | "cashier" | "admin"; // who actually created the order
  status: OrderStatus;
  items: IOrderItemDoc[];
  specialInstructions?: string;
  subtotal: number;
  tax?: number;
  total: number;
  paymentMethod?: "cash" | "card" | "upi" | "room_charge";
  paymentAmount?: number;
  splitPayment?: ISplitPaymentEntry[];
  cashierId?: mongoose.Types.ObjectId;
  paidAt?: Date;
  clearedAt?: Date;
  voidReason?: string; // set when a table is freed without payment (no-show/walkout)
  voidedBy?: mongoose.Types.ObjectId;
  transferredFrom?: string; // previous tableLabel when order moved between tables
  reopenReason?: string; // set when admin un-clears a paid/cleared order
  reopenedBy?: mongoose.Types.ObjectId;
  reopenedAt?: Date;
  refundAmount?: number; // amount refunded on reopen, if any
  editedBy?: mongoose.Types.ObjectId; // admin who last edited items post-placement
  editedAt?: Date;
  kotDate?: string; // "YYYY-MM-DD"
  kotPrinted?: boolean; // physical KOT printed by the local print agent
  kotPrintedAt?: Date; // timestamp of first successful print
  kotPrintAttempts?: number; // retry counter
  isOfflineSynced?: boolean; // true if this order was synced from the offline POS
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItemDoc>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String },
    isVegetarian: { type: Boolean, default: false },
    preparationTtlMinutes: { type: Number, default: 15 },
    itemStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "delivered", "cancelled"],
      default: "pending",
    },
    orderedAt: { type: Date, default: Date.now },
    preparingAt: { type: Date },
    readyAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "Staff" },
    cancelReason: { type: String },
    isNoCharge: { type: Boolean, default: false },
    ncReason: { type: String },
    ncBy: { type: Schema.Types.ObjectId, ref: "Staff" },
  },
  { _id: true },
);

const OrderSchema = new Schema<IOrderDoc>(
  {
    kotNumber: { type: String, required: true },
    tableId: { type: Schema.Types.ObjectId, ref: "Location", required: true },
    tableLabel: { type: String, required: true },
    captainId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    captainName: { type: String, required: true },
    placedByRole: {
      type: String,
      enum: ["captain", "cashier", "admin"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "preparing",
        "partially_ready",
        "ready",
        "partially_delivered",
        "delivered",
        "cancelled",
        "paid",
        "cleared",
      ],
      default: "pending",
    },
    items: { type: [OrderItemSchema], required: true },
    specialInstructions: { type: String },
    subtotal: { type: Number, required: true },
    tax: { type: Number },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "room_charge"],
    },
    paymentAmount: { type: Number },
    splitPayment: {
      type: [
        {
          method: {
            type: String,
            enum: ["cash", "card", "upi", "room_charge"],
            required: true,
          },
          amount: { type: Number, required: true },
        },
      ],
    },
    cashierId: { type: Schema.Types.ObjectId, ref: "Staff" },
    paidAt: { type: Date },
    clearedAt: { type: Date },
    voidReason: { type: String },
    voidedBy: { type: Schema.Types.ObjectId, ref: "Staff" },
    transferredFrom: { type: String },
    reopenReason: { type: String },
    reopenedBy: { type: Schema.Types.ObjectId, ref: "Staff" },
    reopenedAt: { type: Date },
    refundAmount: { type: Number },
    editedBy: { type: Schema.Types.ObjectId, ref: "Staff" },
    editedAt: { type: Date },
    kotDate: { type: String }, // "YYYY-MM-DD" — used for compound unique index
    kotPrinted: { type: Boolean, default: false },
    kotPrintedAt: { type: Date },
    kotPrintAttempts: { type: Number, default: 0 },
    isOfflineSynced: { type: Boolean, default: false },
  },
  { timestamps: true },
);

OrderSchema.index({ status: 1 });
OrderSchema.index({ tableId: 1, status: 1 });
OrderSchema.index({ captainId: 1 });
OrderSchema.index({ createdAt: -1 });
// Compound unique: KOT numbers reset daily — KOT-001 on Mon ≠ KOT-001 on Tue
OrderSchema.index({ kotDate: 1, kotNumber: 1 }, { unique: true, sparse: true });
// Print queue: agent polls for unprinted KOTs newest-first
OrderSchema.index({ kotPrinted: 1, createdAt: -1 });

const Order: Model<IOrderDoc> =
  mongoose.models.Order || mongoose.model<IOrderDoc>("Order", OrderSchema);

export default Order;
