const ticketService = require('../services/submitTicketService');
    
exports.submitTicket = async (req, res) => {
  try {
    const attachments = req.files?.map((file) => file.path) || [];
    const ticket = await ticketService.createTicket({
      ...req.body,
      attachments,
    });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const tickets = await ticketService.getTickets();
    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
