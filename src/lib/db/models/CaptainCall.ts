import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICaptainCallDoc extends Document {
  tableId: string;
  tableLabel: string;
  locationCode: string;
  isGeneric?: boolean; // true when called without a specific location
  status: "pending" | "acknowledged";
  createdAt: Date;
  acknowledgedAt?: Date;
}

const CaptainCallSchema = new Schema<ICaptainCallDoc>(
  {
    tableId: { type: String, required: true },
    tableLabel: { type: String, required: true },
    locationCode: { type: String, required: true },
    isGeneric: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "acknowledged"],
      default: "pending",
    },
    acknowledgedAt: { type: Date },
  },
  { timestamps: true },
);

// Auto-delete acknowledged calls after 5 minutes
CaptainCallSchema.index(
  { acknowledgedAt: 1 },
  {
    expireAfterSeconds: 300,
    partialFilterExpression: { status: "acknowledged" },
  },
);

// Auto-delete any call after 30 minutes regardless
CaptainCallSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

const CaptainCall: Model<ICaptainCallDoc> =
  mongoose.models.CaptainCall ||
  mongoose.model<ICaptainCallDoc>("CaptainCall", CaptainCallSchema);

export default CaptainCall;
