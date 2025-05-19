require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const ticketRoutes = require("./routes/submitTicketRoute");
const app = express();

connectDB();
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/tickets", ticketRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
