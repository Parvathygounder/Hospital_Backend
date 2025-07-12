import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    // Set up connection event listeners
    mongoose.connection.on('connected', () => {
      console.log("Database Connected Successfully");
    });

    mongoose.connection.on('error', (err) => {
      console.error("Database Connection Error:", err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log("Database Disconnected");
    });

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'Apollo',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;