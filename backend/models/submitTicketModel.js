const mongoose = require('mongoose');
 
const ticketSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  orgId: { type: String, required: true },
  platformId: { type: String, required: true },
  type: { type: String, enum: ['Bugs'], required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  subject: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, minlength: 50 },
  attachments: [{ type: String }],
}, { timestamps: true });
 
module.exports = mongoose.model('Ticket', ticketSchema);