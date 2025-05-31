const mongoose = require("mongoose");

/**
 * Database connection utility
 */
class Database {
  static async connect() {
    try {
      const connectionString =
        process.env.MONGODB_URI ||
        "mongodb://localhost:27017/GNA-enery-assignment";

      await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log("Connected to MongoDB");

      // Handle connection events
      mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected");
      });

      // Graceful shutdown
      process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
      });
    } catch (err) {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    }
  }

  static async disconnect() {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
  }

  static getConnection() {
    return mongoose.connection;
  }

  static isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = Database;
