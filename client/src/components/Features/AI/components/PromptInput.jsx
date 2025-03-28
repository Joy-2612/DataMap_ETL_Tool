import React from "react";
import { FaArrowUp } from "react-icons/fa";
import styles from "./PromptInput.module.css";

function PromptInput({
  prompt,
  onPromptChange,
  onKeyDown,
  onSend,
  inputRef,
  showDropdown,
  filteredDatasets,
  onDatasetClick,
  cursorPosition,
}) {
  return (
    <div className={styles.inputWrapper}>
      <input
        ref={inputRef}
        className={styles.promptInput}
        type="text"
        value={prompt}
        placeholder="Type your prompt here..."
        onChange={onPromptChange}
        onKeyDown={onKeyDown}
      />
      {showDropdown && (
        <div
          className={styles.dropdown}
          style={{ left: `${cursorPosition * 7}px` }}
        >
          {filteredDatasets.map((dataset, idx) => (
            <div
              key={idx}
              className={styles.dropdownItem}
              onClick={() => onDatasetClick(dataset)}
            >
              {dataset.name}
            </div>
          ))}
        </div>
      )}
      <button className={styles.sendButton} onClick={onSend}>
        <FaArrowUp />
      </button>
    </div>
  );
}

export default PromptInput;
