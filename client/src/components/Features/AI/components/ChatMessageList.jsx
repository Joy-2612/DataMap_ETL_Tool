import React, { useEffect, useRef } from "react";
import DataTable from "../../../UI/DataTable/DataTable";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { IoCloseSharp } from "react-icons/io5";
import styles from "./ChatMessageList.module.css";

function ChatMessageList({ messages, onReject }) {
  const chatBodyRef = useRef(null);

  // Auto-scroll when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.chatBody} ref={chatBodyRef}>
      {messages.map((msg, index) => {
        const isBot = msg.sender === "bot";
        const prevMessage = messages[index - 1];
        const showIcon =
          isBot && (!prevMessage || prevMessage.sender !== "bot");

        // BOT message with CSV
        if (isBot && msg.datasetData) {
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

        // BOT message still loading (Skeleton)
        if (isBot && msg.isLoading) {
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
                className={`${styles.messageBot} ${styles.messageBotLoading}`}
              >
                <Skeleton
                  count={3}
                  height="20px"
                  baseColor="#bfe5f2"
                  highlightColor="#f4cdfa"
                  width="100%"
                  style={{ marginBottom: "0.3rem" }}
                />
              </div>
            </div>
          );
        }

        // BOT normal / final text
        if (isBot) {
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

                {msg.isFinal && !msg.rejected && (
                  <div className={styles.rejectButtonContainer}>
                    <div
                      className={styles.rejectButton}
                      onClick={() => onReject(index)}
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
  );
}

export default ChatMessageList;
