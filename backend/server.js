const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());

/* -------------------- CORS (IMPORTANT) -------------------- */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

/* -------------------- MongoDB -------------------- */
/* PASTE YOUR OWN CONNECTION STRING HERE */
mongoose.connect("mongodb+srv://devamankaishree_db_user:hARayX8OloPls08g@cluster0.tbftgtw.mongodb.net/bookings?appName=Cluster0")
.then(() => console.log("MongoDB Atlas Connected (ONLINE DATABASE)"))
.catch(err => console.log("MongoDB connection error:", err));

/* -------------------- Booking Model -------------------- */
const Booking = require("./models/Booking");

/* -------------------- EMAIL CONFIG (Owner mail) -------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "devamankaishree@gmail.com",        // your gmail
    pass: "weod zrbb gkas bcyk"               // your app password
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

    // 1️⃣ Save booking in MongoDB
    const booking = new Booking({
      service,
      date,
      time,
      name,
      email,
      phone
    });

    await booking.save();

    console.log("Booking saved to database");

    // 2️⃣ Send Email to Owner
    const mailOptions = {
      from: "devamankaishree@gmail.com",
      to: "devamankaishree@gmail.com",
      subject: "📚 New Booking - Smart Learning",
      text: `
New Booking Received!

Name: ${name}
Phone: ${phone}
Email: ${email}
Service: ${service}
Date: ${date}
Time: ${time}
      `
    };

    await transporter.sendMail(mailOptions);

    console.log("Owner email sent successfully");

    // 3️⃣ Send success response
    res.status(200).json({ message: "Booking confirmed & email sent!" });

  } catch (error) {
    console.error("BOOKING ERROR:", error);
    res.status(500).json({ message: "Booking failed" });
  }
});

/* =========================================================
   2) GET ALL BOOKINGS
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

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
