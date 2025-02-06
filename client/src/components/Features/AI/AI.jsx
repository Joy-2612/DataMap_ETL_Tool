import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../../../context/UserContext";
import { FaArrowUp } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import Skeleton from "react-loading-skeleton";
import Papa from "papaparse";
import DataTable from "../../UI/DataTable/DataTable";
import "react-loading-skeleton/dist/skeleton.css";
import styles from "./AI.module.css";
import RightSidebar from "./RightSidebar/RightSidebar";
import { toast } from "sonner";
import "react-toastify/dist/ReactToastify.css";

const AI = () => {
  const { userId } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [activeChatId, setActiveChatId] = useState(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Fetch user datasets
  useEffect(() => {
    if (userId) {
      const fetchDatasets = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/file/alldatasets/${userId}`
          );
          const data = await response.json();
          if (data && data.data) {
            setDatasets(data.data);
            console.log("Fetched datasets:", data.data);
          }
        } catch (error) {
          console.error("Error fetching datasets: ", error);
        }
      };
      fetchDatasets();
    }
  }, [userId]);

  // Always scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle prompt changes (for dataset mentions with '@')
  const handlePromptChange = (e) => {
    const value = e.target.value;
    setPrompt(value);
    const cursorIndex = e.target.selectionStart;
    setCursorPosition(cursorIndex);

    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex >= 0 && cursorIndex > lastAtIndex) {
      const query = value.slice(lastAtIndex + 1, cursorIndex).toLowerCase();
      const filtered = datasets.filter((dataset) =>
        dataset.name.toLowerCase().includes(query)
      );
      setFilteredDatasets(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  // When user picks a dataset from the dropdown
  const handleDatasetClick = (dataset) => {
    const lastAtIndex = prompt.lastIndexOf("@");
    const beforeAtUser = prompt.slice(0, lastAtIndex + 1);
    const afterAtUser = prompt.slice(cursorPosition);
    const updatedPrompt = `${beforeAtUser}${dataset.name} ${afterAtUser}`;
    setPrompt(updatedPrompt);
    setShowDropdown(false);

    const newCursorPosition = beforeAtUser.length + dataset.name.length + 1;
    setCursorPosition(newCursorPosition);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(
          newCursorPosition,
          newCursorPosition
        );
      }
    }, 0);
  };

  // Parse CSV file data from the buffer
  const parseCsvFile = (fileBuffer) => {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(fileBuffer);
      const text = new TextDecoder("utf-8").decode(uint8Array);
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        complete: (result) => {
          resolve(result.data);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  };

  // Fetch dataset by ID
  const fetchDatasetById = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/dataset/${id}`
      );
      const data = await response.json();
      const dataset = data?.data;
      if (!dataset) return null;
      if (dataset.type === "text/csv") {
        const parsedData = await parseCsvFile(dataset.file.data);
        return { dataset, parsedData };
      }
      return { dataset };
    } catch (error) {
      console.error("Error fetching dataset: ", error);
      return null;
    }
  };

  // Handle fileId references in the bot's response
  const handleFileIdsInBotResponse = async (text) => {
    const fileIdRegex = /fileId.*?([a-f0-9]{24})/g;
    let match;
    let newMessages = [];
    let lastIndex = 0;

    while ((match = fileIdRegex.exec(text)) !== null) {
      const fileId = match[1];
      const start = match.index;
      const end = fileIdRegex.lastIndex;

      if (start > lastIndex) {
        newMessages.push({ text: text.slice(lastIndex, start), sender: "bot" });
      }

      const fetchedResult = await fetchDatasetById(fileId);
      if (fetchedResult) {
        if (fetchedResult.parsedData) {
          newMessages.push({
            sender: "bot",
            datasetData: fetchedResult.parsedData,
          });
        } else {
          newMessages.push({
            text: `(File attached: ${
              fetchedResult.dataset?.name || "Unknown"
            })`,
            sender: "bot",
          });
        }
      } else {
        newMessages.push({
          text: `(Could not load file with ID: ${fileId})`,
          sender: "bot",
        });
      }

      lastIndex = end;
    }

    if (lastIndex < text.length) {
      newMessages.push({ text: text.slice(lastIndex), sender: "bot" });
    }
    return newMessages;
  };

  // Automatically save chat to the server
  const autoSaveChat = async (messagesToSave) => {
    try {
      // We only save once the final response is done
      const response = await fetch("http://localhost:5000/api/ai/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: messagesToSave.filter((msg) => !msg.isLoading),
        }),
      });

      if (!response.ok) throw new Error("Failed to save chat");
      const data = await response.json();

      if (data.success) {
        toast.success("Chat saved successfully!");
      }
    } catch (error) {
      console.error("Error saving chat:", error);
      toast.error("Failed to save chat");
    }
  };

  // Process each chunk of SSE
  const handleSSEChunk = async (chunk) => {
    const lines = chunk.split("\n");
    let eventType = null;
    let eventData = null;

    lines.forEach((line) => {
      if (line.startsWith("event:")) {
        eventType = line.replace("event:", "").trim();
      } else if (line.startsWith("data:")) {
        try {
          eventData = JSON.parse(line.replace("data:", "").trim());
        } catch (e) {
          console.error("Failed to parse SSE data JSON:", e);
        }
      }
    });

    if (!eventType) return;

    // If the server sends a chatSession event, set active chat ID
    if (eventType === "chatSession") {
      if (eventData && eventData.chatId) {
        setActiveChatId(eventData.chatId);
      }
      return;
    }

    // If the server sends a "thought" event
    if (eventType === "thought") {
      if (eventData && typeof eventData.thought === "string") {
        setMessages((prev) => {
          const newMessages = [...prev];
          if (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].isLoading
          ) {
            newMessages.pop();
          }
          newMessages.push({
            text: eventData.thought,
            sender: "bot",
            isLoading: false,
            isThought: true,
          });
          newMessages.push({ text: "", sender: "bot", isLoading: true });
          return newMessages;
        });
      }
    }

    // If the server sends the final "answer" event
    else if (eventType === "answer") {
      // Remove loading placeholder
      setMessages((prev) => {
        const newMessages = [...prev];
        if (
          newMessages.length > 0 &&
          newMessages[newMessages.length - 1].isLoading
        ) {
          newMessages.pop();
        }
        return newMessages;
      });

      if (eventData && typeof eventData.answer === "string") {
        const parsedMessages = await handleFileIdsInBotResponse(
          eventData.answer
        );

        // Mark the last text message in parsedMessages as final
        if (parsedMessages.length > 0) {
          for (let i = parsedMessages.length - 1; i >= 0; i--) {
            if (parsedMessages[i].text) {
              parsedMessages[i].isFinal = true;
              break;
            }
          }
        }

        // Add the final messages to state, then automatically save the chat
        setMessages((prev) => {
          const newMessages = [...prev, ...parsedMessages];
          autoSaveChat(newMessages); // <--- auto-save once final answer is set
          return newMessages;
        });
      }
    }

    // If there's an "error" event
    else if (eventType === "error") {
      // Remove loading placeholder if it exists
      setMessages((prev) => {
        const newMessages = [...prev];
        if (
          newMessages.length > 0 &&
          newMessages[newMessages.length - 1].isLoading
        ) {
          newMessages.pop();
        }
        return newMessages;
      });

      // Display error
      setMessages((prev) => [
        ...prev,
        {
          text: "Something went wrong. Please try again.",
          sender: "bot",
          isLoading: false,
        },
      ]);
      console.error("SSE error event:", eventData);
    }
  };

  // Replace dataset references with fileId references
  function replaceDatasetReferences(text, datasets) {
    let newText = text;
    const regex = /@(\S+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const datasetName = match[1];
      const foundDataset = datasets.find(
        (ds) => ds.name.toLowerCase() === datasetName.toLowerCase()
      );
      if (foundDataset) {
        newText = newText.replace(
          `@${datasetName}`,
          `fileId:${foundDataset._id}`
        );
      }
    }
    return newText;
  }

  // Send prompt to server (SSE streaming)
  const handleSend = async () => {
    if (!prompt.trim()) return;

    // Replace any @datasetName with fileId:...
    const finalPrompt = replaceDatasetReferences(prompt, datasets);

    // User's message
    setMessages((prev) => [
      ...prev,
      { text: prompt, sender: "user", isLoading: false },
    ]);

    // Bot's loading placeholder
    setMessages((prev) => [
      ...prev,
      { text: "", sender: "bot", isLoading: true },
    ]);

    // Reset prompt
    setPrompt("");
    setShowDropdown(false);

    try {
      const response = await fetch("http://localhost:5000/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          prompt: finalPrompt,
          chatId: activeChatId,
        }),
      });

      if (!response.body) {
        throw new Error("No response body from the SSE endpoint.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        for (let i = 0; i < parts.length - 1; i++) {
          await handleSSEChunk(parts[i]);
        }
        buffer = parts[parts.length - 1];
      }
      if (buffer.trim().length > 0) {
        await handleSSEChunk(buffer);
      }
    } catch (error) {
      console.error("Error sending prompt with SSE:", error);

      // Remove loading placeholder
      setMessages((prev) => {
        const newMessages = [...prev];
        if (
          newMessages.length > 0 &&
          newMessages[newMessages.length - 1].isLoading
        ) {
          newMessages.pop();
        }
        return newMessages;
      });

      // Show error message
      setMessages((prev) => [
        ...prev,
        {
          text: "Something went wrong while streaming. Please try again.",
          sender: "bot",
        },
      ]);
    }
  };

  // Send on Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Reject the answer (keep the logic as is)
  const handleReject = (messageIndex) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[messageIndex].rejected = true;
      return newMessages;
    });
    // Focus input with rejection prompt
    setPrompt("rejection prompt: ");
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(
          "rejection prompt: ".length,
          "rejection prompt: ".length
        );
      }
    }, 0);
  };

  // Simple wrapper for skeleton layout
  function Box({ children }) {
    return (
      <div style={{ lineHeight: 1.5, margin: "0rem", marginBottom: "0.2rem" }}>
        {children}
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <div className={styles.chatContainer}>
        {messages.length === 0 && (
          <div className={styles.noChats}>
            <div className={styles.chatHeaderNoChats}>AI Agent</div>
            <h3>How can I help you today?</h3>
          </div>
        )}

        {messages.length > 0 && (
          <>
            <div className={styles.chatHeader}>AI Agent</div>
            <div className={styles.chatBody} ref={chatBodyRef}>
              {messages.map((msg, index) => {
                const isBotMessage = msg.sender === "bot";
                const prevMessage = messages[index - 1];
                const showIcon =
                  isBotMessage &&
                  (!prevMessage || prevMessage.sender !== "bot");

                // BOT messages displaying CSV data
                if (isBotMessage) {
                  if (msg.datasetData) {
                    return (
                      <div className={styles.messageBotContainer} key={index}>
                        {showIcon ? (
                          <img
                            src="https://static.vecteezy.com/system/resources/previews/049/889/441/non_2x/generate-ai-abstract-symbol-artificial-intelligence-colorful-stars-icon-vector.jpg"
                            alt="AI Icon"
                            className={styles.aiIcon}
                          />
                        ) : (
                          <div className={styles.aiIcon} />
                        )}
                        <div className={styles.messageBot}>
                          <DataTable
                            title="CSV Data"
                            columns={
                              msg.datasetData.length > 0
                                ? Object.keys(msg.datasetData[0]).map(
                                    (key) => ({
                                      label: key,
                                      key: key,
                                    })
                                  )
                                : []
                            }
                            data={msg.datasetData}
                            getRowId={(row, i) => i}
                          />
                        </div>
                      </div>
                    );
                  }

                  // BOT messages still loading (skeleton)
                  if (msg.isLoading) {
                    return (
                      <div className={styles.messageBotContainer} key={index}>
                        {showIcon ? (
                          <img
                            src="https://static.vecteezy.com/system/resources/previews/049/889/441/non_2x/generate-ai-abstract-symbol-artificial-intelligence-colorful-stars-icon-vector.jpg"
                            alt="AI Icon"
                            className={styles.aiIcon}
                          />
                        ) : (
                          <div className={styles.aiIcon} />
                        )}
                        <div
                          className={`${styles.messageBot} ${
                            msg.isLoading ? styles.messageBotLoading : ""
                          }`}
                        >
                          <Skeleton
                            count={3}
                            height="20px"
                            baseColor="#bfe5f2"
                            highlightColor="#f4cdfa"
                            width="100%"
                            wrapper={Box}
                            style={{ marginBottom: "0.3rem" }}
                          />
                        </div>
                      </div>
                    );
                  }

                  // BOT final or normal text messages
                  return (
                    <div className={styles.messageBotContainer} key={index}>
                      {showIcon ? (
                        <img
                          src="https://static.vecteezy.com/system/resources/previews/049/889/441/non_2x/generate-ai-abstract-symbol-artificial-intelligence-colorful-stars-icon-vector.jpg"
                          alt="AI Icon"
                          className={styles.aiIcon}
                        />
                      ) : (
                        <div className={styles.aiIcon} />
                      )}

                      <div
                        className={styles.messageBot}
                        style={{
                          fontStyle: msg.isThought ? "italic" : "normal",
                          opacity: msg.isThought ? 0.7 : 1,
                        }}
                      >
                        {msg.text}
                        {/* Show only the Reject button for the final message */}
                        {msg.isFinal && !msg.rejected && (
                          <div className={styles.rejectButtonContainer}>
                            <div
                              className={styles.rejectButton}
                              onClick={() => handleReject(index)}
                            >
                              <IoCloseSharp />
                              Reject
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // USER messages
                return (
                  <div className={styles.messageUser} key={index}>
                    {msg.text}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Prompt input and dropdown */}
        <div
          className={
            messages.length > 0 ? styles.chatFooter : styles.noChatsFooter
          }
        >
          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              className={
                prompt.startsWith("rejection prompt:")
                  ? `${styles.promptInput} ${styles.rejected}`
                  : styles.promptInput
              }
              type="text"
              value={prompt}
              placeholder="Type your prompt here..."
              onChange={handlePromptChange}
              onKeyDown={handleKeyDown}
            />
            {showDropdown && (
              <div
                className={styles.dropdown}
                style={{ left: `${cursorPosition * 7}px` }}
              >
                {filteredDatasets.map((dataset, index) => (
                  <div
                    key={index}
                    className={styles.dropdownItem}
                    onClick={() => handleDatasetClick(dataset)}
                  >
                    {dataset.name}
                  </div>
                ))}
              </div>
            )}
            <button className={styles.sendButton} onClick={handleSend}>
              <FaArrowUp />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar with chat history */}
      <RightSidebar
        onSelectChat={(msgs, id) => {
          setMessages(msgs);
          setActiveChatId(id || null);
        }}
      />
    </div>
  );
};

export default AI;
