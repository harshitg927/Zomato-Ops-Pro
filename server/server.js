const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");

// Load environment variables
dotenv.config();

// Import utilities
const Database = require("./utils/database");
const User = require("./models/User");

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

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.user = user;

    console.log(
      `Socket authenticated: ${user.username} (${user.role}) - ${socket.id}`
    );
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Authentication error"));
  }
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
  console.log(
    `Client connected: ${socket.user.username} (${socket.userRole}) - ${socket.id}`
  );

  // Join user to their own room for targeted messages
  socket.join(`user_${socket.userId}`);
  if (socket.userRole === "manager") {
    socket.join("managers");
  } else if (socket.userRole === "delivery_partner") {
    socket.join("delivery_partners");
  }

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.user.username} - ${socket.id}`);
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
