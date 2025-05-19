const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const ticketController = require("../controllers/submitTicketController");

router.post("/submit", upload, ticketController.submitTicket);
//router.get("/getTickets", ticketController.getTickets);

module.exports = router;
