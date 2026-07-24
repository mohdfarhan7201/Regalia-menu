import mongoose, { Schema, Model } from "mongoose";

interface ICounter {
  _id: string; // e.g. "kot:2026-05-27"
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  { _id: { type: String, required: true }, seq: { type: Number, default: 0 } },
  { versionKey: false },
);

const Counter: Model<ICounter> =
  mongoose.models.Counter ?? mongoose.model<ICounter>("Counter", CounterSchema);

export default Counter;

/**
 * Atomically increments the daily KOT counter and returns the next sequence
 * number. Safe under concurrent requests — uses MongoDB aggregation pipeline
 * update with $ifNull so the counter is seeded from existing orders on first
 * use each day (prevents duplicate key errors when the Counter collection is
 * new but the orders collection already has documents).
 *
 * @param existingTodayCount — pass the count of today's orders so the counter
 *   can bootstrap from the correct starting point on its first call of the day.
 */
export async function nextDailyKotSeq(
  existingTodayCount: number,
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const key = `kot:${today}`;

  // Use the native MongoDB driver's findOneAndUpdate so we can pass an
  // aggregation pipeline (needed for $ifNull to seed the counter correctly
  // on first use each day). Mongoose's own findOneAndUpdate does not support
  // pipeline arrays without extra gymnastics.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collection = Counter.collection as any;
  const result = await collection.findOneAndUpdate(
    { _id: key },
    [
      {
        $set: {
          seq: { $add: [{ $ifNull: ["$seq", existingTodayCount] }, 1] },
        },
      },
    ],
    { upsert: true, returnDocument: "after" },
  );
  return (result as unknown as { seq: number }).seq;
}
