const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  productName: String,
  price: Number,

  customerName: String,
  phone: String,
  address: String,

  orderId: {
    type: String,
    unique: true
  },

  orderStatus: {
    type: String,
    default: "Pending" // Pending, Confirmed, Shipped, Delivered
  },

  paymentStatus: {
    type: String,
    default: "Pending" // Pending, Paid
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);