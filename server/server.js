const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const morgan = require("morgan");

// Load environment variables
dotenv.config();

// Import utilities
const Database = require("./utils/database");

// Import routes
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const deliveryRoutes = require("./routes/delivery");

const app = express();
const server = http.createServer(app);

// Socket.IO setup for real-time updates
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Initialize database connection
Database.connect();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    database: Database.isConnected() ? "Connected" : "Disconnected",
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
