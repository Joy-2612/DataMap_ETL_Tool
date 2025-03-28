// controllers/aiController.js
const { runChainOfThought, getTitle } = require("../services/aiService");
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

    // Send chatSession SSE event so the frontend has the new chatId
    res.write(
      `event: chatSession\ndata: ${JSON.stringify({
        chatId: chatSession._id,
      })}\n\n`
    );

    // Add user message to history and save immediately
    chatSession.messages.push(createMessage(prompt, "user"));
    await chatSession.save();

    // Prepare proper chat history (exclude system messages)
    const chatHistory = chatSession.messages
      .filter((msg) => msg.sender !== "system")
      .map((msg) => ({
        sender: msg.sender,
        text: msg.text,
        isThought: msg.isThought,
      }));

    // Create a local promise chain to serialize saves
    let lastSavePromise = Promise.resolve();

    // Process with Gemini (chain-of-thought steps will be sent via SSE)
    await runChainOfThought(prompt, chatHistory, async (eventType, data) => {
      handleSSEEvent(eventType, data, res, chatSession);
      // Chain save calls sequentially to avoid parallel saves
      lastSavePromise = lastSavePromise.then(() => chatSession.save());
      await lastSavePromise;
    });

    // Ensure all pending saves complete
    await lastSavePromise;
    await chatSession.save();
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
  // If an existing chat is provided, return it.
  if (chatId) {
    const existingChat = await Chat.findById(chatId);
    if (existingChat) return existingChat;
  }

  // Otherwise, create a new chat.
  const newChat = new Chat({
    user: userId,
    messages: [],
  });
  await newChat.save(); // Persist the new chat session
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

// Updated saveChat: now it expects a chatId and updates the existing document instead of creating a new one.
const saveChat = async (req, res) => {
  console.log("Save Chats is called...!!");
  try {
    const { chatId, userId, messages } = req.body;

    console.log("ChatId:", chatId);
    console.log("UserId:", userId);
    console.log("Messages:", messages);

    if (!chatId) {
      //this means that this is a new chat, so create a chat and save it

      const title = await getTitle(messages);

      newChat = new Chat({
        user: userId,
        title,
        messages: messages.map((msg) => ({
          text: msg.text,
          sender: msg.sender,
          isThought: msg.isThought || false,
          approved: msg.approved || false,
          ...(msg.datasetData && { datasetData: msg.datasetData }),
        })),
      });
      await newChat.save();
      return res.status(200).json({ success: true, chat: newChat });
    }

    console.log("Fine..!");

    const title = await getTitle(messages);
    console.log("Title:", title);

    // Update the existing chat session with the new title and messages.
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        title,
        messages: messages.map((msg) => ({
          text: msg.text,
          sender: msg.sender,
          isThought: msg.isThought || false,
          approved: msg.approved || false,
          ...(msg.datasetData && { datasetData: msg.datasetData }),
        })),
      },
      { new: true }
    );

    console.log("Updated Chat:", updatedChat);
    if (!updatedChat) {
      return res.status(404).json({ success: false, error: "Chat not found" });
    }
    res.status(200).json({ success: true, chat: updatedChat });
  } catch (error) {
    console.log("Error saving chat:", error);
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

const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const deletedChat = await Chat.findByIdAndDelete(chatId);
    if (!deletedChat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }
    res.json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

let lastSavePromise = Promise.resolve();

function handleSSEEvent(eventType, data, res, chatSession) {
  // Send SSE event to the client
  res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);

  // Append to chat session messages based on event type
  if (eventType === "thought") {
    chatSession.messages.push(createMessage(data.thought, "bot", true));
  } else if (eventType === "answer") {
    chatSession.messages.push(createMessage(data.answer, "bot"));
  } else if (eventType === "observation") {
    chatSession.messages.push(createMessage(data.observation, "bot"));
  }
}

module.exports = {
  askAI,
  saveChat,
  getChats,
  deleteChat,
};
