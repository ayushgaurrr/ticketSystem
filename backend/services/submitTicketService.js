const Ticket = require('../models/submitTicketModel');
 
exports.createTicket = async (data) => {
  if (!data.name || !data.email || !data.orgId || !data.platformId || !data.subject || !data.description) {
    throw new Error('Missing required fields');
  }
  return await Ticket.create(data);
};