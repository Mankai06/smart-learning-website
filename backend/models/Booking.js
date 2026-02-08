const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    service: String,
    date: String,
    time: String,
    name: String,
    email: String,
    phone: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
