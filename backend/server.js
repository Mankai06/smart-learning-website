const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");


const app = express();
app.use(express.json());
// Serve frontend website
app.use(express.static(path.join(__dirname, "../")));
// health route (keeps server awake)
app.get("/ping", (req, res) => {
  res.send("Server awake");
});


/* -------------------- CORS (IMPORTANT) -------------------- */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

/* -------------------- MongoDB -------------------- */
/* PASTE YOUR OWN CONNECTION STRING HERE */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Atlas Connected"))
.catch(err => console.log("Mongo Error:", err));

/* -------------------- Booking Model -------------------- */
const Booking = require("./models/Booking");

/* -------------------- EMAIL CONFIG (Owner mail) -------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
 auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS
}

});

/* =========================================================
   1) CREATE BOOKING
========================================================= */
// =====================
// CREATE BOOKING + EMAIL
// =====================

app.post("/book", async (req, res) => {
  try {
    const { service, date, time, name, email, phone } = req.body;

    if (!service || !date || !time || !name || !email || !phone) {
      return res.json({ success: false, message: "Missing details" });
    }

    // Save booking to MongoDB
    const newBooking = new Booking({
      service,
      date,
      time,
      name,
      email,
      phone
    });

    await newBooking.save();

    console.log("Booking saved:", newBooking);

    res.json({ success: true });

  } catch (error) {
    console.log("BOOKING ERROR:", error);
    res.json({ success: false, message: "Booking failed" });
  }
});


/* =========================================================
   2) GET ALL BOOKINGS
========================================================= */
app.get("/bookings", async (req, res) => {
  try {
    const Bookings = await Booking.find().sort({ _id: -1 });
    res.json(Bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

/* =========================================================
   3) UPDATE BOOKING
========================================================= */
app.put("/bookings/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { date, time } = req.body;

    const updated = await Booking.findByIdAndUpdate(
      id,
      { date, time },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking updated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Update error" });
  }
});

/* =========================================================
   4) DELETE BOOKING
========================================================= */
app.delete("/bookings/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await Booking.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Delete error" });
  }
});

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log("Server running on port " + PORT));

// Homepage route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
