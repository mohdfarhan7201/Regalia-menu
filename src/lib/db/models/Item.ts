import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItemDoc extends Document {
  categoryId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  videoUrl?: string;
  isVegetarian: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  sortOrder: number;
  preparationTtlMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItemDoc>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    imageUrl: { type: String },
    videoUrl: { type: String },
    isVegetarian: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    preparationTtlMinutes: { type: Number, default: 15 },
  },
  { timestamps: true },
);

ItemSchema.index({ categoryId: 1, sortOrder: 1 });
ItemSchema.index({ isAvailable: 1 });
// { slug: 1 } index is already created by unique:true on the field

const Item: Model<IItemDoc> =
  mongoose.models.Item || mongoose.model<IItemDoc>("Item", ItemSchema);

export default Item;
