// models/Chat.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  text: String,
  sender: String,
  datasetData: mongoose.Schema.Types.Mixed,
  isThought: Boolean,
  isFinal: Boolean,
  approved: Boolean,
  rejected: Boolean,
});

const chatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Chat", chatSchema);
