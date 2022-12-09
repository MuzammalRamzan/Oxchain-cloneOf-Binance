const mongoose = require("mongoose");

const AnnouncementsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: Number, required: false, default: 1 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Announcements", AnnouncementsSchema);
