import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export type StaffRole = "captain" | "kitchen" | "cashier" | "lead_manager";

export interface IStaffDoc extends Document {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const StaffSchema = new Schema<IStaffDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["captain", "kitchen", "cashier", "lead_manager"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

StaffSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

StaffSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

const Staff: Model<IStaffDoc> =
  mongoose.models.Staff || mongoose.model<IStaffDoc>("Staff", StaffSchema);

export default Staff;
