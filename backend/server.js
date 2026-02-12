const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(cors());

/* -------------------- MONGODB -------------------- */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Atlas Connected ✅"))
.catch(err => console.log("Mongo Error ❌:", err));

/* -------------------- MODEL -------------------- */
const Booking = require("./models/Booking");

/* -------------------- EMAIL CONFIG -------------------- */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* -------------------- HEALTH CHECK -------------------- */
app.get("/ping", (req, res) => {
  res.send("Server awake");
});

/* -------------------- TEST API -------------------- */
app.get("/api", (req, res) => {
  res.json({ status: "Backend working" });
});

/* =========================================================
   CREATE BOOKING
========================================================= */
app.post("/book", async (req, res) => {
  try {
    const { service, date, time, name, email, phone } = req.body;

    if (!service || !date || !time || !name || !email || !phone) {
      return res.json({ success:false, message:"Missing details" });
    }

    // 1️⃣ SAVE BOOKING
    const newBooking = new Booking({
      service,
      date,
      time,
      name,
      email,
      phone
    });

    await newBooking.save();
    console.log("✅ Booking stored in MongoDB");

    // 2️⃣ SEND EMAIL (optional but works)
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: "New Booking - Smart Learning",
        text:
`New Booking Received

Service: ${service}
Date: ${date}
Time: ${time}

Student: ${name}
Phone: ${phone}
Email: ${email}`
      });

      console.log("📧 Email sent");
    } catch (mailError) {
      console.log("Email failed but booking saved:", mailError.message);
    }

    res.json({ success:true });

  } catch (error) {
    console.log("BOOKING ERROR:", error);
    res.json({ success:false, message:"Server error" });
  }
});

/* =========================================================
   GET ALL BOOKINGS
========================================================= */
app.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ _id: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

/* =========================================================
   UPDATE BOOKING
========================================================= */
app.put("/bookings/:id", async (req, res) => {
  try {
    const { date, time } = req.body;

    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { date, time },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Booking not found" });

    res.json({ message: "Booking updated successfully" });

  } catch (err) {
    res.status(500).json({ message: "Update error" });
  }
});

/* =========================================================
   DELETE BOOKING
========================================================= */
app.delete("/bookings/:id", async (req, res) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Booking not found" });

    res.json({ message: "Booking deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Delete error" });
  }
});

/* =========================================================
   SERVE FRONTEND (VERY IMPORTANT — MUST BE LAST)
========================================================= */
app.use(express.static(path.join(__dirname, "../")));

/* Prevent API being replaced by HTML */
app.get(/^\/(?!api|book|bookings).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server LIVE on Render");
});
