// server/routes/aiRoutes.js

const express = require("express");
const { askAI } = require("../controllers/aiController");

const router = express.Router();

/**
 * POST /ai/ask
 * Body: { prompt: "Standardize file:<ObjectID>" }
 */
router.post("/ask", askAI);

module.exports = router;
