// server/routes/aiRoutes.js

const express = require("express");
const { askAI, saveChat, getChats } = require("../controllers/aiController");

const router = express.Router();

/**
 * POST /ai/ask
 * Body: { prompt: "Standardize file:<ObjectID>" }
 */
router.post("/ask", askAI);
router.post("/chats", saveChat);
router.get("/chats/:userId", getChats);

module.exports = router;
