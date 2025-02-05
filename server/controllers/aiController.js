const { runChainOfThought } = require("../services/aiService");
const Chat = require("../models/Chat");

const askAI = async (req, res) => {
  try {
    console.log("Body : ", req.body);
    const { previousChats, prompt } = req.body;
    console.log("Prompt:", prompt);

    if (!prompt || typeof prompt !== "string") {
      return res
        .status(400)
        .json({ message: "Prompt is required and must be a string." });
    }

    // Set up the SSE headers.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      await runChainOfThought(prompt, previousChats, (eventType, data) => {
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

const saveChat = async (req, res) => {
  try {
    const { userId, messages } = req.body;

    // Save all messages along with any extra metadata (such as chain-of-thought flags).
    const newChat = new Chat({
      user: userId,
      messages: messages.map((msg) => ({
        text: msg.text,
        sender: msg.sender,
        isThought: msg.isThought || false,
        approved: msg.approved || false,
        ...(msg.datasetData && { datasetData: msg.datasetData }),
      })),
    });

    await newChat.save();
    res.status(201).json({ success: true, chat: newChat });
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  askAI,
  saveChat,
  getChats,
};
