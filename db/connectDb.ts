import mongoose from "mongoose";

const connectDb = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MongoDB URI is not provided");
    }

    const connection = await mongoose.connect(process.env.MONGODB_URI!);
    console.log("MongoDB connected successfully");
    return connection;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error connecting to MongoDB:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    // Instead of process.exit(1), throw an error that can be caught by the caller
    throw new Error("Failed to connect to MongoDB");
  }
};

export default connectDb;
