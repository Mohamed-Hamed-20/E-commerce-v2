import mongoose from "mongoose";
import { usermodel } from "./models/user.model.js";

let isConnected = false;

const connectDB = async () => {
  try {
    if (isConnected) {
      console.log("DB already connected");
      return;
    }

    if (!process.env.DB_URL) {
      throw new Error(
        "DB_URL is not defined. Please check your environment variables."
      );
    }

    const db = await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("DB connected");
  } catch (error) {
    console.error("Error in DB connection:", error);
    throw new Error("Unable to connect to the database.");
  }
};

// Open DB connection at the start
const closeDBConnection = () => {
  if (isConnected) {
    mongoose.connection.close(() => {
      console.log("Connection to DB is closed");
      isConnected = false;
    });
  }
};

process.on("SIGINT", () => {
  closeDBConnection();
  process.exit(0);
});

const deleteDB = async () => {
  try {
    // Ensure Mongoose is connected
    if (mongoose.connection.readyState === 1) {
      // Drop the current database
      await mongoose.connection.dropDatabase();
      console.log("Database dropped successfully.");
    } else {
      console.log("Mongoose is not connected.");
    }
  } catch (error) {
    console.error("Error while dropping the database:", error);
  }
};
const deleteUser = async (userId) => {
  console.log({ userId });

  await usermodel.findByIdAndDelete(userId);
};

export { connectDB, closeDBConnection, deleteDB, deleteUser };
