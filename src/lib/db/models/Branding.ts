import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBrandingDoc extends Document {
  restaurantName: string;
  logoUrl?: string;
  whatsappNumber: string;
  callNumber: string;
  tagline?: string;
  primaryColor: string;
  accentColor?: string;
  coverVideoUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  updatedAt: Date;
}

const BrandingSchema = new Schema<IBrandingDoc>(
  {
    restaurantName: { type: String, required: true, default: "Regalia Resort" },
    logoUrl: { type: String },
    whatsappNumber: { type: String, required: true, default: "" },
    callNumber: { type: String, required: true, default: "" },
    tagline: { type: String },
    primaryColor: { type: String, default: "#f97316" },
    accentColor: { type: String },
    coverVideoUrl: { type: String },
    coverImageUrl: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
  },
  { timestamps: true },
);

const Branding: Model<IBrandingDoc> =
  mongoose.models.Branding ||
  mongoose.model<IBrandingDoc>("Branding", BrandingSchema);

export default Branding;
