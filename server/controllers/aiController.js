const { runChainOfThought } = require("../services/aiService");

const askAI = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res
        .status(400)
        .json({ message: "Prompt is required and must be a string." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      await runChainOfThought(prompt, (eventType, data) => {
        res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
      });
    } catch (chainError) {
      console.error("Chain of Thought Error:", chainError);
      res.write(
        `event: error\ndata: ${JSON.stringify({
          error: chainError.message,
        })}\n\n`
      );
    } finally {
      res.end();
    }
  } catch (error) {
    console.error("Uncaught Error in askAI:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  askAI,
};
