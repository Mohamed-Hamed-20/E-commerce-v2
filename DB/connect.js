import mongoose from "mongoose";

let isConnected = false; // To track connection status

const connectDB = async () => {
  try {
    if (isConnected) {
      console.log("DB already connected");
      return;
    }

    const db = await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
  closeDBConnection(); // Close connection when the app is terminated (Ctrl+C)
  process.exit(0); // Exit the app gracefully
});

export { connectDB, closeDBConnection };
