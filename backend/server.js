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

/* -------------------- CORS -------------------- */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

/* -------------------- MongoDB -------------------- */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Atlas Connected"))
.catch(err => console.log("Mongo Error:", err));

/* -------------------- Booking Model -------------------- */
const Booking = require("./models/Booking");

/* -------------------- EMAIL CONFIG -------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* =========================================================
   CREATE BOOKING  (FIXED VERSION)
========================================================= */
app.post("/book", async (req, res) => {
  try {

    const { service, date, time, name, email, phone } = req.body;

    if (!service || !date || !time || !name || !email || !phone) {
      return res.json({ success: false, message: "Missing details" });
    }

    // 1️⃣ SAVE BOOKING FIRST (MOST IMPORTANT)
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

    // 2️⃣ IMMEDIATELY SEND SUCCESS TO WEBSITE
    // (so user never sees failure)
    res.json({ success: true });

    // 3️⃣ TRY EMAIL (BUT DO NOT BREAK BOOKING)
    try {

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Smart Learning Booking Confirmed",
        text: `Your booking is confirmed!

Service: ${service}
Date: ${date}
Time: ${time}

Thank you for choosing Smart Learning.`
      };

      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully");

    } catch (mailError) {
      // THIS IS THE MAIN FIX
      // Gmail blocked on Render → we IGNORE it
      console.log("Email failed but booking kept:", mailError.message);
    }

  } catch (error) {
    console.log("BOOKING ERROR:", error);
    res.json({ success: false, message: "Booking failed" });
  }
});

/* =========================================================
   GET BOOKINGS
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
   UPDATE BOOKING
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
   DELETE BOOKING
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

/* -------------------- HOME -------------------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
