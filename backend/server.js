const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Serve frontend
app.use(express.static(path.join(__dirname, "../")));

// Wake up route
app.get("/ping", (req, res) => {
  res.send("Server awake");
});

/* -------------------- MongoDB -------------------- */

// Start server FIRST (important for Render)
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});

// THEN connect MongoDB (after server already alive)
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch(err => console.log("❌ Mongo Error:", err));

/* -------------------- Booking Model -------------------- */
const Booking = require("./models/Booking");

/* -------------------- EMAIL (OPTIONAL) -------------------- */
/* IMPORTANT: Email failure should NOT break booking */

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // IMPORTANT
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


/* =========================================================
   CREATE BOOKING  (MOST IMPORTANT FIX)
========================================================= */

app.post("/book", async (req, res) => {
  try {
    const { service, date, time, name, email, phone } = req.body;

    // validation
    if (!service || !date || !time || !name || !email || !phone) {
      return res.status(400).json({ success: false, message: "Missing details" });
    }

    // ---------------- SAVE BOOKING FIRST ----------------
    const newBooking = new Booking({
      service,
      date,
      time,
      name,
      email,
      phone
    });

    await newBooking.save();
    console.log("✅ Booking saved to MongoDB");

    // ---------------- SEND EMAIL (DO NOT BREAK BOOKING) ----------------
    try {

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: "New Booking - Smart Learning",
        text: `
New Booking Received

Service: ${service}
Date: ${date}
Time: ${time}

Student Name: ${name}
Phone: ${phone}
Email: ${email}
        `
      };

      await transporter.sendMail(mailOptions);
      console.log("📧 Email sent successfully");

    } catch (mailErr) {
      console.log("⚠ Email failed BUT booking saved:", mailErr.message);
    }

    // FINAL RESPONSE
    res.json({ success: true });

  } catch (error) {
    console.log("❌ BOOKING ERROR:", error);
    res.status(500).json({ success: false, message: "Booking failed" });
  }
});


/* -------------------- GET BOOKINGS -------------------- */
app.get("/bookings", async (req, res) => {
  const bookings = await Booking.find().sort({ _id: -1 });
  res.json(bookings);
});

/* -------------------- SERVER -------------------- */


/* Homepage */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});
