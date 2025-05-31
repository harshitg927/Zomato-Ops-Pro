const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    prepTime: {
      type: Number,
      required: true,
      min: 1, // Minimum 1 minute prep time
    },
    status: {
      type: String,
      enum: ["PREP", "PICKED", "ON_ROUTE", "DELIVERED"],
      default: "PREP",
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Auto-calculated dispatch time (prepTime + ETA)
    dispatchTime: {
      type: Number,
      default: null,
    },
    customerInfo: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Timestamps for each status change
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["PREP", "PICKED", "ON_ROUTE", "DELIVERED"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total amount before saving
orderSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  }
  next();
});

// Calculate dispatch time when delivery partner is assigned
orderSchema.pre("save", function (next) {
  if (this.deliveryPartner && this.prepTime) {
    if (!this.dispatchTime) {
      this.dispatchTime = this.prepTime + 30;
    }
  }
  next();
});

// Add status to history when status changes
orderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

// Generate unique order ID
orderSchema.statics.generateOrderId = function () {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `ORD-${timestamp}-${randomStr}`.toUpperCase();
};

module.exports = mongoose.model("Order", orderSchema);
