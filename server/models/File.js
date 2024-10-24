// server/models/File.js
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  data: { type: Buffer, required: true },
  description: { type: String, required: false },
  contentType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  result: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User model
});

module.exports = mongoose.model("File", fileSchema);
