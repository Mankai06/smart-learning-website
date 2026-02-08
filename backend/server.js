const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

/* -------------------- IMPORTANT MIDDLEWARE -------------------- */
app.use(express.json());
app.use(cors());

/* -------------------- SERVE FRONTEND -------------------- */
app.use(express.static(path.join(__dirname, "../")));

/* Home page */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

/* Health check (wake server) */
app.get("/ping", (req, res) => {
  res.send("Server awake");
});


/* -------------------- MONGODB CONNECTION -------------------- */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));


/* -------------------- BOOKING MODEL -------------------- */
const Booking = require("./models/Booking");


/* -------------------- EMAIL (GMAIL APP PASSWORD) -------------------- */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


/* =========================================================
   CREATE BOOKING  (MOST IMPORTANT ROUTE)
========================================================= */
app.post("/book", async (req, res) => {

  try {

    const { service, date, time, name, email, phone } = req.body;

    if (!service || !date || !time || !name || !email || !phone) {
      return res.json({ success:false, message:"Missing details" });
    }

    /* ---------- 1) SAVE BOOKING FIRST ---------- */
    const newBooking = new Booking({
      service,
      date,
      time,
      name,
      email,
      phone
    });

    await newBooking.save();
    console.log("✅ BOOKING STORED IN DATABASE");


    /* ---------- 2) TRY EMAIL (OPTIONAL) ---------- */
    try {

      const mailOptions = {
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
      };

      await transporter.sendMail(mailOptions);
      console.log("📧 Email Sent Successfully");

    } catch (mailError) {
      console.log("⚠ Email failed but booking saved:", mailError.message);
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


/* -------------------- SERVER START -------------------- */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
