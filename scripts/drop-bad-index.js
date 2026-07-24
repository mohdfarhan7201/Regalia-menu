import "dotenv/config";
import mongoose from "mongoose";

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Please set MONGODB_URI in .env.local");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const collection = mongoose.connection.collection("orders");

  try {
    console.log("Dropping bad index 'kotNumber_1'...");
    await collection.dropIndex("kotNumber_1");
    console.log("✅ Successfully dropped 'kotNumber_1' index.");
  } catch (err) {
    if (err.code === 27) {
      console.log("ℹ️ Index 'kotNumber_1' not found. It may have already been dropped.");
    } else {
      console.error("❌ Failed to drop index:", err.message);
    }
  }

  try {
    console.log("Creating correct compound index on kotDate and kotNumber...");
    await collection.createIndex({ kotDate: 1, kotNumber: 1 }, { unique: true, sparse: true });
    console.log("✅ Successfully created correct index.");
  } catch (err) {
    console.error("❌ Failed to create correct index:", err.message);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
