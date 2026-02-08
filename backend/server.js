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

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

/* -------------------- Booking Model -------------------- */
const Booking = require("./models/Booking");

/* -------------------- EMAIL (OPTIONAL) -------------------- */
/* IMPORTANT: Email failure should NOT break booking */

let transporter;

try {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log("Mail service ready");
} catch {
  console.log("Mail disabled");
}

/* =========================================================
   CREATE BOOKING  (MOST IMPORTANT FIX)
========================================================= */

app.post("/book", async (req, res) => {

  try {
    const { service, date, time, name, email, phone } = req.body;

    if (!service || !date || !time || !name || !email || !phone) {
      return res.json({ success: false, message: "Missing details" });
    }

    /* ---------- SAVE BOOKING FIRST ---------- */

    const newBooking = new Booking({
      service,
      date,
      time,
      name,
      email,
      phone
    });

    await newBooking.save();
    console.log("✅ Booking SAVED to database");

    /* ---------- TRY EMAIL (BUT DON'T BREAK) ---------- */

    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: "New Booking - Smart Learning",
          text: `
Service: ${service}
Date: ${date}
Time: ${time}

Name: ${name}
Phone: ${phone}
Email: ${email}
          `
        });

        console.log("📧 Email sent");

      } catch (mailErr) {
        console.log("⚠️ Email failed (ignored):", mailErr.message);
      }
    }

    /* ---------- SUCCESS RESPONSE ---------- */

    res.json({ success: true });

  } catch (error) {
    console.log("❌ BOOKING SAVE ERROR:", error);
    res.json({ success: false, message: "Database error" });
  }
});

/* -------------------- GET BOOKINGS -------------------- */
app.get("/bookings", async (req, res) => {
  const bookings = await Booking.find().sort({ _id: -1 });
  res.json(bookings);
});

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Server running on port " + PORT));

/* Homepage */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});
