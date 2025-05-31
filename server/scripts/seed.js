const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Order = require("../models/Order");

// Load environment variables
dotenv.config();

const defaultUsers = [
  {
    username: "manager1",
    email: "manager@restaurant.com",
    password: "manager123",
    role: "manager",
  },
  {
    username: "delivery1",
    email: "delivery1@restaurant.com",
    password: "delivery123",
    role: "delivery_partner",
    estimatedDeliveryTime: 25,
    isAvailable: true,
  },
  {
    username: "delivery2",
    email: "delivery2@restaurant.com",
    password: "delivery123",
    role: "delivery_partner",
    estimatedDeliveryTime: 30,
    isAvailable: true,
  },
  {
    username: "delivery3",
    email: "delivery3@restaurant.com",
    password: "delivery123",
    role: "delivery_partner",
    estimatedDeliveryTime: 35,
    isAvailable: true,
  },
];

const clearDatabase = async () => {
  console.log("🗑️  Clearing database...");

  // Clear all collections
  await User.deleteMany({});
  console.log("   ✅ Cleared users collection");

  await Order.deleteMany({});
  console.log("   ✅ Cleared orders collection");

  console.log("🧹 Database cleared successfully!\n");
};

const seedUsers = async () => {
  console.log("👥 Seeding users...");

  for (const userData of defaultUsers) {
    const user = new User(userData);
    await user.save();
    console.log(`   ✅ Created user: ${userData.username} (${userData.role})`);
  }

  console.log("👥 Users seeded successfully!\n");
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/GNA-enery-assignment"
    );
    console.log("✅ Connected to MongoDB\n");

    // Clear existing data
    await clearDatabase();

    // Seed fresh data
    await seedUsers();

    console.log("🎉 Database seeding completed successfully!\n");
    console.log("📋 Default login credentials:");
    console.log("   Manager: manager@restaurant.com / manager123");
    console.log("   Delivery Partners:");
    console.log("     - delivery1@restaurant.com / delivery123 (ETA: 25min)");
    console.log("     - delivery2@restaurant.com / delivery123 (ETA: 30min)");
    console.log("     - delivery3@restaurant.com / delivery123 (ETA: 35min)");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run seeder
console.log("🚀 Starting database seeding process...\n");
seedDatabase();
