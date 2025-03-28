import React from "react";
import useAIChat from "./hooks/useAIChat.js";
import ChatMessageList from "./components/ChatMessageList";
import PromptInput from "./components/PromptInput";
import RightSidebar from "./RightSidebar/RightSidebar"; // as before
import styles from "./AI.module.css";

const AI = () => {
  const {
    messages,
    prompt,
    showDropdown,
    filteredDatasets,
    cursorPosition,
    inputRef,
    activeChatId,
    setActiveChatId,
    setMessages,
    handlePromptChange,
    handleDatasetClick,
    handleSend,
    handleKeyDown,
    handleReject,
  } = useAIChat();

  return (
    <div className={styles.mainContainer}>
      <div className={styles.chatContainer}>
        {/* Chat Header */}
        {messages.length === 0 ? (
          <div className={styles.noChats}>
            <div className={styles.chatHeaderNoChats}>AI Agent</div>
            <h3>How can I help you today?</h3>
          </div>
        ) : (
          <>
            <div className={styles.chatHeader}>AI Agent</div>
            <ChatMessageList messages={messages} onReject={handleReject} />
          </>
        )}

        {/* Prompt Input */}
        <div
          className={
            messages.length > 0 ? styles.chatFooter : styles.noChatsFooter
          }
        >
          <PromptInput
            prompt={prompt}
            onPromptChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            onSend={handleSend}
            inputRef={inputRef}
            showDropdown={showDropdown}
            filteredDatasets={filteredDatasets}
            onDatasetClick={handleDatasetClick}
            cursorPosition={cursorPosition}
          />
        </div>
      </div>

      {/* Right Sidebar (chat history, etc.) */}
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
