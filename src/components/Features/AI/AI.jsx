import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../../../context/UserContext";
import { FaArrowUp, FaCheck } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import Skeleton from "react-loading-skeleton";
import Papa from "papaparse";
import DataTable from "../../UI/DataTable/DataTable";
import "react-loading-skeleton/dist/skeleton.css";
import styles from "./AI.module.css";

// Import toastify
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
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

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

  useEffect(() => {
    // Always scroll to bottom when messages change
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePromptChange = (e) => {
    const value = e.target.value;
    setPrompt(value);

    const cursorIndex = e.target.selectionStart;
    setCursorPosition(cursorIndex);

    // Filtering logic for dropdown
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

  const handleDatasetClick = (dataset) => {
    const lastAtIndex = prompt.lastIndexOf("@");
    const beforeAtUser = prompt.slice(0, lastAtIndex + 1); // include "@"
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

  const handleFileIdsInBotResponse = async (text) => {
    const fileIdRegex = /fileId:([\w\d]+)/g;
    let match;
    let newMessages = [];
    let lastIndex = 0;

    while ((match = fileIdRegex.exec(text)) !== null) {
      const fileId = match[1];
      const start = match.index;
      const end = fileIdRegex.lastIndex;

      // text before fileId:
      if (start > lastIndex) {
        newMessages.push({ text: text.slice(lastIndex, start), sender: "bot" });
      }

      // fetch dataset:
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

  /**
   * Handle one SSE "chunk" (corresponding to a single event block).
   */
  const handleSSEChunk = async (chunk) => {
    // Each chunk could contain multiple lines: ["event: thought", "data: {...}", ...]
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

    if (!eventType) return; // Ignore if there's no valid "event" line

    if (eventType === "thought") {
      // 1. Remove the skeleton if it exists at the end
      // 2. Add the new 'thought' message
      // 3. Re-add a skeleton at the end
      if (eventData && typeof eventData.thought === "string") {
        setMessages((prev) => {
          const newMessages = [...prev];
          // Remove trailing skeleton if present
          if (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].isLoading
          ) {
            newMessages.pop();
          }

          // Add the new "thought"
          newMessages.push({
            text: eventData.thought,
            sender: "bot",
            isLoading: false,
            isThought: true,
          });

          // Re-add skeleton after the thought
          newMessages.push({
            text: "",
            sender: "bot",
            isLoading: true,
          });
          return newMessages;
        });
      }
    } else if (eventType === "answer") {
      // The final answer from the AI
      // 1. Remove the skeleton
      // 2. Parse the final answer for any fileIds
      // 3. Append the final answer messages
      setMessages((prev) => {
        const newMessages = [...prev];
        // Remove any trailing skeleton
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
        // Mark the last text portion as the final AI message
        if (parsedMessages.length > 0) {
          for (let i = parsedMessages.length - 1; i >= 0; i--) {
            if (parsedMessages[i].text) {
              parsedMessages[i].isFinal = true; // This is our final answer
              break;
            }
          }
        }
        setMessages((prev) => [...prev, ...parsedMessages]);
      }
    } else if (eventType === "error") {
      // Remove the skeleton, show an error
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

  /**
   * Main function to send the user's prompt to your SSE endpoint
   * and handle incremental "thought" + final "answer".
   */
  const handleSend = async () => {
    if (!prompt.trim()) return;

    // Convert all @datasetName references to fileId:xxx
    let finalPrompt = prompt;
    const regex = /@(\S+)/g;
    let match;
    while ((match = regex.exec(prompt)) !== null) {
      const datasetName = match[1];
      const foundDataset = datasets.find(
        (ds) => ds.name.toLowerCase() === datasetName.toLowerCase()
      );
      if (foundDataset) {
        finalPrompt = finalPrompt.replace(
          `@${datasetName}`,
          `fileId:${foundDataset._id}`
        );
      }
    }

    // Add user's message
    setMessages((prev) => [
      ...prev,
      { text: prompt, sender: "user", isLoading: false },
    ]);

    // Add an initial skeleton at the end
    setMessages((prev) => [
      ...prev,
      { text: "", sender: "bot", isLoading: true },
    ]);

    // Clear prompt
    setPrompt("");
    setShowDropdown(false);

    try {
      const response = await fetch("http://localhost:5000/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      if (!response.body) {
        throw new Error("No response body from the SSE endpoint.");
      }

      // Read the response via a reader to handle SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // SSE messages are separated by double newlines (\n\n)
        const parts = buffer.split("\n\n");

        // Process all but the last part (which might be incomplete)
        for (let i = 0; i < parts.length - 1; i++) {
          await handleSSEChunk(parts[i]);
        }
        buffer = parts[parts.length - 1];
      }
      // Process any leftover
      if (buffer.trim().length > 0) {
        await handleSSEChunk(buffer);
      }
    } catch (error) {
      console.error("Error sending prompt with SSE:", error);
      // Remove the loading skeleton if present
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
      setMessages((prev) => [
        ...prev,
        {
          text: "Something went wrong while streaming. Please try again.",
          sender: "bot",
        },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Approve the final answer
  const handleApprove = async (messageIndex) => {
    // OPTIONAL: Save to DB
    // await fetch("http://localhost:5000/api/ai/save", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ content: messages[messageIndex].text }),
    // });

    // Mark as approved to hide the buttons
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[messageIndex].approved = true;
      return newMessages;
    });

    toast.success("File saved in the database.");
  };

  // Reject the final answer
  const handleReject = (messageIndex) => {
    // Mark as rejected to hide the buttons
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[messageIndex].rejected = true;
      return newMessages;
    });

    // Set the prompt to "rejection prompt: " and focus
    setPrompt("rejection prompt: ");
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Place cursor at end of new prompt
        inputRef.current.setSelectionRange(
          "rejection prompt: ".length,
          "rejection prompt: ".length
        );
      }
    }, 0);
  };

  // A small wrapper for Skeleton lines
  function Box({ children }) {
    return (
      <div
        style={{
          lineHeight: 1.5,
          margin: "0rem",
          marginBottom: "0.2rem",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>AI Agent</div>

      <div className={styles.chatBody} ref={chatBodyRef}>
        {messages.map((msg, index) => {
          // Determine if we should show the icon:
          const isBotMessage = msg.sender === "bot";
          const prevMessage = messages[index - 1];
          const showIcon =
            isBotMessage && (!prevMessage || prevMessage.sender !== "bot");

          if (isBotMessage) {
            // If it's a CSV dataset message:
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
                          ? Object.keys(msg.datasetData[0]).map((key) => ({
                              label: key,
                              key: key,
                            }))
                          : []
                      }
                      data={msg.datasetData}
                      getRowId={(row, i) => i}
                    />
                  </div>
                </div>
              );
            }

            // Skeleton or loading messages
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

            // Normal (non-loading) bot messages (includes partial "thought" + final answer)
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

                  {/* If this is a final answer (not a "thought"), show Approve/Reject if not already handled */}
                  {msg.isFinal && !msg.approved && !msg.rejected && (
                    <div className={styles.approveRejectButtons}>
                      <div
                        className={styles.approveButton}
                        onClick={() => handleApprove(index)}
                      >
                        <FaCheck />
                        Approve
                      </div>
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

          // User messages
          return (
            <div className={styles.messageUser} key={index}>
              {msg.text}
            </div>
          );
        })}
      </div>

      <div className={styles.chatFooter}>
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
  );
};

export default AI;
