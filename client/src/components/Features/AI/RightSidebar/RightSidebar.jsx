import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../../context/UserContext";
import styles from "./RightSidebar.module.css";

const ChatHistory = ({ chats, onSelectChat, activeChatId }) => {
  return (
    <div className={styles.chatHistory}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            className={styles.newChatButton}
            onClick={() => onSelectChat([], null)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            New Chat
          </button>
        </div>
      </div>
      <div className={styles.chatList}>
        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`${styles.chatItem} ${
              activeChatId === chat._id ? styles.activeChat : ""
            }`}
            onClick={() => onSelectChat(chat.messages, chat._id)}
          >
            <div className={styles.chatContent}>
              <div className={styles.chatPreview}>
                {chat.messages[0]?.text || "New conversation"}
              </div>
              <div className={styles.chatMeta}>
                <span className={styles.chatDate}>
                  {new Date(chat.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {chat.unread && <span className={styles.unreadBadge}></span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RightSidebar = ({ onSelectChat }) => {
  const { userId } = useContext(UserContext);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/ai/chats/${userId}`
        );
        const data = await response.json();
        if (data.success) {
          setChats(data.chats);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    if (userId) fetchChats();
  }, [userId]);

  return (
    <div className={styles.sidebar}>
      <ChatHistory chats={chats} onSelectChat={onSelectChat} />
    </div>
  );
};

export default RightSidebar;
