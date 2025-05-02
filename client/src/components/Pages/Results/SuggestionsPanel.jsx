import React from "react";
import { FaChevronDown } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import ThoughtBubble from "./ThoughtBubble";
import SkeletonLoader from "./SkeletonLoader";
import styles from "./SuggestionsPanel.module.css";

const SuggestionsPanel = ({
  suggestions,
  thoughts,
  isSuggestionsLoading,
  isGenerating,
  areThoughtsCollapsed,
  setAreThoughtsCollapsed,
  onClose,
}) => {
  const cleanValue = (val) => {
    if (typeof val === "string") {
      // Remove wrapping quotes if they exist
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      // Remove escaped quotes
      val = val.replace(/\\"/g, '"');
      // Try to parse and format JSON if applicable
      try {
        const parsed = JSON.parse(val);
        if (typeof parsed === "object") {
          return (
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(parsed, null, 2)}
            </pre>
          );
        }
      } catch (e) {
        // Not valid JSON, return the cleaned string
      }
      return val;
    } else if (typeof val === "object") {
      // Format objects as pretty-printed JSON
      return (
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }
    return val;
  };

  return (
    <div className={styles.suggestionsPanel}>
      <div className={styles.panelHeader} onClick={onClose}>
        <h3 className={styles.suggestionsTitle}>
          {isGenerating ? "Analysis Progress" : "Suggestions"}
        </h3>
        <IoMdClose className={styles.closePanelButton} />
      </div>
      <div className={styles.panelContent}>
        <div className={styles.thoughtsSection}>
          <div
            className={styles.thoughtsHeader}
            onClick={() => setAreThoughtsCollapsed(!areThoughtsCollapsed)}
          >
            <h4>Thoughts</h4>
            <FaChevronDown
              className={`${styles.chevron} ${
                areThoughtsCollapsed ? styles.chevronCollapsed : ""
              }`}
            />
          </div>
          {!areThoughtsCollapsed && (
            <div className={styles.thoughtsContainer}>
              {thoughts.map((thought, index) => (
                <ThoughtBubble key={index} thought={thought} index={index} />
              ))}
              {isSuggestionsLoading &&
                Array(2)
                  .fill()
                  .map((_, i) => <SkeletonLoader key={i} />)}
            </div>
          )}
        </div>
        {suggestions.length > 0 && (
          <div className={styles.suggestionsGrid}>
            {suggestions.map((suggestion, index) => (
              <div className={styles.suggestionCard} key={index}>
                <span className={styles.cardIndex}>
                  <img
                    src="https://static.vecteezy.com/system/resources/previews/049/889/441/non_2x/generate-ai-abstract-symbol-artificial-intelligence-colorful-stars-icon-vector.jpg"
                    alt="AI Icon"
                    className={styles.aiIcon}
                  />
                  Suggestion {index + 1}
                </span>
                <div className={styles.cardHeader}>
                  <h4>{suggestion.title}</h4>
                </div>
                <p className={styles.cardDescription}>
                  {suggestion.description}
                </p>
                {suggestion.action && (
                  <div className={styles.cardAction}>
                    <span className={styles.actionBadge}>
                      Recommended Action
                    </span>
                    <p className={styles.actionName}>
                      {suggestion.action.name}
                    </p>
                    {suggestion.action.parameters && (
                      <div className={styles.parametersSection}>
                        <div className={styles.parametersLabel}>Parameters</div>
                        <div className={styles.parametersGrid}>
                          {Object.entries(suggestion.action.parameters).map(
                            ([key, value], paramIdx) => (
                              <div
                                key={paramIdx}
                                className={styles.parameterItem}
                              >
                                {typeof value === "object" ? (
                                  <>
                                    <span className={styles.paramName}>
                                      {value.name}:
                                    </span>
                                    <span className={styles.paramValue}>
                                      {cleanValue(value.value)}
                                    </span>
                                  </>
                                ) : (
                                  <span className={styles.paramValue}>
                                    {cleanValue(value)}
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestionsPanel;
