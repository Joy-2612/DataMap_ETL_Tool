// controllers/aiController.js
const { runChainOfThought } = require("../services/aiService");
const Chat = require("../models/Chat");

const askAI = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { prompt, userId, chatId } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res
        .status(400)
        .json({ message: "Prompt is required and must be a string." });
    }

    // IMPORTANT: Set SSE headers immediately
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Retrieve or create the chat session
    let chatSession;
    if (chatId) {
      chatSession = await Chat.findById(chatId);
      if (!chatSession) {
        chatSession = new Chat({ user: userId, messages: [] });
        await chatSession.save();
        res.write(
          `event: chatSession\ndata: ${JSON.stringify({
            chatId: chatSession._id,
          })}\n\n`
        );
      }
    } else {
      chatSession = new Chat({ user: userId, messages: [] });
      await chatSession.save();
      res.write(
        `event: chatSession\ndata: ${JSON.stringify({
          chatId: chatSession._id,
        })}\n\n`
      );
    }

    // Append the new user prompt to the chat session and save
    chatSession.messages.push({
      text: prompt,
      sender: "user",
      isThought: false,
    });
    await chatSession.save();

    // Build the conversation history string from all saved messages
    const previousChatsString = chatSession.messages
      .map((m) =>
        m.sender === "user" ? `User: ${m.text}` : `Assistant: ${m.text}`
      )
      .join("\n");

    console.log("Previous Chats:", previousChatsString);

    // Run the chain-of-thought and stream updates
    await runChainOfThought(
      prompt,
      previousChatsString,
      async (eventType, data) => {
        // Send each SSE update to the client
        res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);

        // Determine the new message to append based on the event type

        let newMessage;
        if (eventType === "thought") {
          let thought = data.thought;
          if (typeof thought === "object") {
            // If we know the actual field is "response":
            thought = thought.response || JSON.stringify(thought);
          }
          newMessage = {
            text: thought,
            sender: "bot",
            isThought: true,
          };
        } else if (eventType === "observation") {
          newMessage = {
            text: data.observation,
            sender: "bot",
            isThought: false,
          };
        } else if (eventType === "answer") {
          let answer = data.answer;
          if (typeof answer === "object") {
            // If the LLM gave you { response: "some string" }:
            answer = answer.response || JSON.stringify(answer);
          }
          newMessage = {
            text: answer,
            sender: "bot",
            isThought: false,
          };
        } else if (eventType === "error") {
          newMessage = {
            text: data.error,
            sender: "bot",
            isThought: false,
          };
        }

        if (newMessage) {
          // Update the in-memory chat session and then update the DB atomically.
          chatSession.messages.push(newMessage);
          await Chat.updateOne(
            { _id: chatSession._id },
            { $push: { messages: newMessage } }
          );
        }
      }
    );

    res.end();
  } catch (error) {
    console.error("Uncaught Error in askAI:", error);
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

module.exports = {
  askAI,
  saveChat,
  getChats,
};
