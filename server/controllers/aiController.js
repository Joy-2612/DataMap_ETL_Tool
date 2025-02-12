// controllers/aiController.js
const { runChainOfThought } = require("../services/aiService");
const Chat = require("../models/Chat");

const askAI = async (req, res) => {
  try {
    const { prompt, userId, chatId } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Invalid prompt" });
    }

    // SSE setup
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Retrieve or create chat session
    let chatSession = await manageChatSession(userId, chatId);
    if (!chatSession) {
      return res
        .status(500)
        .json({ error: "Failed to initialize chat session" });
    }

    // Add user message to history
    chatSession.messages.push(createMessage(prompt, "user"));
    await chatSession.save();

    // Prepare proper chat history
    const chatHistory = chatSession.messages
      .filter((msg) => msg.sender !== "system")
      .map((msg) => ({
        sender: msg.sender,
        text: msg.text,
        isThought: msg.isThought,
      }));

    // Process with Gemini
    await runChainOfThought(prompt, chatHistory, async (eventType, data) => {
      handleSSEEvent(eventType, data, res, chatSession);
    });

    res.end();
  } catch (error) {
    console.error("AskAI error:", error);
    if (res.headersSent) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`
      );
      res.end();
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

async function manageChatSession(userId, chatId) {
  if (chatId) {
    const existingChat = await Chat.findById(chatId);
    if (existingChat) return existingChat;
  }

  const newChat = new Chat({
    user: userId,
    messages: [createMessage("System initialized", "system")],
  });
  await newChat.save();
  return newChat;
}

function createMessage(text, sender, isThought = false) {
  return {
    text,
    sender,
    isThought,
    timestamp: new Date(),
  };
}

const saveChat = async (req, res) => {
  try {
    const { userId, messages } = req.body;
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

let lastSavePromise = Promise.resolve();

function handleSSEEvent(eventType, data, res, chatSession) {
  // Send SSE event
  res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);

  // Save to database
  if (eventType === "thought") {
    chatSession.messages.push(createMessage(data.thought, "bot", true));
  } else if (eventType === "answer") {
    chatSession.messages.push(createMessage(data.answer, "bot"));
  } else if (eventType === "observation") {
    chatSession.messages.push(createMessage(data.observation, "bot"));
  }

  // Save asynchronously
  lastSavePromise = lastSavePromise
    .then(() => chatSession.save())
    .catch(console.error);
}

module.exports = {
  askAI,
  saveChat,
  getChats,
};
