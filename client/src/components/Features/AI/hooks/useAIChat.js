import { useState, useEffect, useRef, useContext } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { UserContext } from "../../../../context/UserContext";

function useAIChat() {
  const { userId } = useContext(UserContext);

  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [activeChatId, setActiveChatId] = useState(null);
  const inputRef = useRef(null);
  const autoSaveTriggeredRef = useRef(false);

  // 1. Fetch user datasets once the userId is available
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

  // 2. Helper: Parse CSV file data from buffer
  const parseCsvFile = (fileBuffer) => {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(fileBuffer);
      const text = new TextDecoder("utf-8").decode(uint8Array);
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        complete: (result) => resolve(result.data),
        error: (error) => reject(error),
      });
    });
  };

  // 3. Helper: Fetch dataset by ID (handles CSV parsing if needed)
  const fetchDatasetById = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/dataset/${id}`
      );
      const data = await response.json();
      const dataset = data?.data;
      if (!dataset) return null;

      // If it's a CSV file, parse it
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

  // 4. Helper: Replace `@datasetName` references with `fileId:xxx`
  const replaceDatasetReferences = (text, datasets) => {
    let newText = text;
    const regex = /@(\S+)/g; // captures what follows '@'
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
  };

  // 5. SSE chunk processor: decide how to handle server-sent events
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

    // 5a. Chat session event
    if (eventType === "chatSession") {
      if (eventData && eventData.chatId) {
        setActiveChatId(eventData.chatId);
      }
      return;
    }

    // 5b. Bot "thought" event
    if (eventType === "thought") {
      if (eventData && typeof eventData.thought === "string") {
        setMessages((prev) => {
          const newMessages = [...prev];
          // Remove loading placeholder if it exists
          if (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].isLoading
          ) {
            newMessages.pop();
          }
          // Add the thought and another placeholder
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

    // 5c. Final "answer" event
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

        // Add final messages to state, then autosave the chat if not already done
        setMessages((prev) => {
          const newMessages = [...prev, ...parsedMessages];
          console.log("Final messages:", newMessages);
          if (!autoSaveTriggeredRef.current) {
            autoSaveTriggeredRef.current = true;
            autoSaveChat(newMessages);
          }
          return newMessages;
        });
      }
    }

    // 5d. "error" event
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
      // Show error message
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

  // 6. Convert any `fileId:xxx` references in the final text into actual dataset data or fallback text
  const handleFileIdsInBotResponse = async (text) => {
    const fileIdRegex = /.*?([a-f0-9]{24})/g;
    let match;
    let newMessages = [];
    let lastIndex = 0;

    while ((match = fileIdRegex.exec(text)) !== null) {
      const fileId = match[1];
      const start = match.index;
      const end = fileIdRegex.lastIndex;

      // Push text up to this point
      if (start > lastIndex) {
        newMessages.push({ text: text.slice(lastIndex, start), sender: "bot" });
      }

      // Attempt to fetch the dataset by ID
      const fetchedResult = await fetchDatasetById(fileId);
      if (fetchedResult) {
        if (fetchedResult.parsedData) {
          // It's parsed CSV data
          newMessages.push({
            sender: "bot",
            datasetData: fetchedResult.parsedData,
          });
        } else {
          // It's some other file or unknown
          newMessages.push({
            text: `(File attached: ${
              fetchedResult.dataset?.name || "Unknown"
            })`,
            sender: "bot",
          });
        }
      } else {
        // Could not load
        newMessages.push({
          text: `(Could not load file with ID: ${fileId})`,
          sender: "bot",
        });
      }

      lastIndex = end;
    }

    // Remainder text
    if (lastIndex < text.length) {
      newMessages.push({ text: text.slice(lastIndex), sender: "bot" });
    }
    return newMessages;
  };

  // 7. Automatically save chat to the backend
  const autoSaveChat = async (messagesToSave) => {
    console.log("Auto-saving chat...");
    try {
      const response = await fetch("http://localhost:5000/api/ai/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChatId,
          userId,
          messages: messagesToSave.filter((msg) => !msg.isLoading),
        }),
      });

      console.log("Auto-save response:", response);

      if (!response.ok) throw new Error("Failed to save chat");
      const data = await response.json();

      if (data.success) {
        toast.success("Chat saved successfully!");
        // ----------------------------------------------
        // ADDED: Dispatch a global event to refresh chats
        // ----------------------------------------------
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("refreshChats")); // <-- ADDED
        }
      }
    } catch (error) {
      console.error("Error saving chat:", error);
      toast.error("Failed to save chat");
    }
  };

  // 8. Handle changes in the prompt (detecting `@datasets` for dropdown)
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

  // 9. When a dataset is selected from the dropdown
  const handleDatasetClick = (dataset) => {
    const lastAtIndex = prompt.lastIndexOf("@");
    const beforeAtUser = prompt.slice(0, lastAtIndex + 1);
    const afterAtUser = prompt.slice(cursorPosition);
    const updatedPrompt = `${beforeAtUser}${dataset.name} ${afterAtUser}`;
    setPrompt(updatedPrompt);
    setShowDropdown(false);

    const newCursorPosition = beforeAtUser.length + dataset.name.length + 1;
    setCursorPosition(newCursorPosition);

    // Re-focus input and set cursor
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

  // 10. Send the prompt to the server (SSE)
  const handleSend = async () => {
    if (!prompt.trim()) return;

    // Reset auto-save trigger for new prompt
    autoSaveTriggeredRef.current = false;

    // Replace `@datasetName` references first
    const finalPrompt = replaceDatasetReferences(prompt, datasets);

    // Push user message
    setMessages((prev) => [...prev, { text: prompt, sender: "user" }]);

    // Add bot loading placeholder
    setMessages((prev) => [
      ...prev,
      { text: "", sender: "bot", isLoading: true },
    ]);

    // Reset prompt input
    setPrompt("");
    setShowDropdown(false);

    // SSE request
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

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE chunks separated by \n\n
        const parts = buffer.split("\n\n");
        for (let i = 0; i < parts.length - 1; i++) {
          await handleSSEChunk(parts[i]);
        }
        buffer = parts[parts.length - 1];
      }
      // Handle any leftover chunk
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

  // 11. Handle `Enter` -> send
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // 12. (Optional) Reject answer logic
  const handleReject = (messageIndex) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[messageIndex].rejected = true;
      return newMessages;
    });
    // ...
  };

  return {
    messages,
    setMessages,
    prompt,
    setPrompt,
    showDropdown,
    filteredDatasets,
    cursorPosition,
    inputRef,
    activeChatId,
    setActiveChatId,
    handlePromptChange,
    handleDatasetClick,
    handleSend,
    handleKeyDown,
    handleReject,
  };
}

export default useAIChat;
