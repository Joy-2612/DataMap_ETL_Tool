import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../../../context/UserContext";
import styles from "./AI.module.css";

const AI = () => {
  const { userId } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null); // Reference to the input field

  useEffect(() => {
    if (userId) {
      const fetchDatasets = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/file/alldatasets/${userId}`
          );
          const data = await response.json();
          setDatasets(data.data);
          console.log("Fetched datasets:", data.data);
        } catch (error) {
          console.error("Error fetching datasets: ", error);
        }
      };

      fetchDatasets();
    }
  }, [userId]);

  const handlePromptChange = (e) => {
    const value = e.target.value;
    setPrompt(value);

    const cursorIndex = e.target.selectionStart;
    setCursorPosition(cursorIndex);

    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex >= 0 && cursorIndex > lastAtIndex) {
      const query = value.slice(lastAtIndex + 1, cursorIndex).toLowerCase();
      setFilteredDatasets(
        datasets.filter((dataset) => dataset.name.toLowerCase().includes(query))
      );
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleDatasetClick = (dataset) => {
    const lastAtIndex = prompt.lastIndexOf("@");
    const beforeAt = prompt.slice(0, lastAtIndex + 1);
    const afterAt = prompt.slice(cursorPosition);
    const updatedPrompt = `${beforeAt}${dataset.name} ${afterAt}`;
    setPrompt(updatedPrompt);
    setShowDropdown(false);
    setCursorPosition(beforeAt.length + dataset.name.length + 1);
  };

  const handleSend = () => {
    if (!prompt.trim()) return;

    setMessages((prev) => [...prev, { text: prompt, sender: "user" }]);
    setPrompt("");
    setShowDropdown(false);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "Hello from AI", sender: "bot" },
      ]);
    }, 500);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>AI Chat</div>
      <div className={styles.chatBody}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.sender === "user" ? styles.messageUser : styles.messageBot
            }
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className={styles.chatFooter}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            className={styles.promptInput}
            type="text"
            value={prompt}
            placeholder="Type your prompt here..."
            onChange={handlePromptChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
          />
          {showDropdown && (
            <div
              className={styles.dropdown}
              style={{ left: `${inputRef.current.selectionStart * 7}px` }}
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
        </div>
        <button className={styles.sendButton} onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default AI;
