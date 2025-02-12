import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../../context/UserContext";
import styles from "./RightSidebar.module.css";
import {
  TbLayoutSidebarLeftExpandFilled,
  TbLayoutSidebarLeftCollapseFilled,
} from "react-icons/tb";
import { FaTrash } from "react-icons/fa";

const ChatHistory = ({
  chats,
  onSelectChat,
  activeChatId,
  isCollapsed,
  setIsCollapsed,
  onDeleteChat,
}) => {
  return (
    <div className={styles.chatHistory}>
      <div
        className={`${isCollapsed ? styles.headerCollapsed : styles.header}`}
      >
        <button
          className={styles.toggleButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <TbLayoutSidebarLeftCollapseFilled />
          ) : (
            <TbLayoutSidebarLeftExpandFilled />
          )}
        </button>
        <div className={styles.headerContent}>
          <button
            className={`${styles.newChatButton} ${
              isCollapsed ? styles.collapsedButton : ""
            }`}
            onClick={() => onSelectChat([], null)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            {!isCollapsed && "New Chat"}
          </button>
        </div>
      </div>
      {!isCollapsed && (
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
                  {chat.title || "New conversation"}
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
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat._id);
                }}
                title="Delete Chat"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RightSidebar = ({ onSelectChat, activeChatId }) => {
  const { userId } = useContext(UserContext);
  const [chats, setChats] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const handleDeleteChat = async (chatId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/ai/chats/${chatId}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (data.success) {
        setChats((prevChats) =>
          prevChats.filter((chat) => chat._id !== chatId)
        );
      } else {
        console.error("Failed to delete chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      <ChatHistory
        chats={chats}
        onSelectChat={onSelectChat}
        activeChatId={activeChatId}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onDeleteChat={handleDeleteChat}
      />
    </div>
  );
};

export default RightSidebar;
