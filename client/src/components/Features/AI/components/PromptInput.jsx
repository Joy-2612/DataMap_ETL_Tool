import React, { useEffect, useState } from "react";
import { FaArrowUp, FaDatabase, FaChevronRight } from "react-icons/fa";
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
  const [inputWidth, setInputWidth] = useState(0);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && showDropdown && filteredDatasets.length > 0) {
      e.preventDefault();
      onDatasetClick(filteredDatasets[0]);
    } else {
      onKeyDown(e);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, [inputRef]);

  return (
    <div className={styles.inputWrapper}>
      <input
        ref={inputRef}
        className={styles.promptInput}
        type="text"
        value={prompt}
        placeholder="Type your prompt here..."
        onChange={onPromptChange}
        onKeyDown={handleKeyDown}
      />
      {showDropdown && (
        <div
          className={styles.dropdown}
          style={{
            width: `${inputWidth - 20}px`,
            left: "10px",
          }}
        >
          <div className={styles.dropdownHeader}>
            <FaDatabase className={styles.dbIcon} />
            <span>Available Datasets</span>
            <span className={styles.resultsCount}>
              {filteredDatasets.length} results
            </span>
          </div>
          <div className={styles.dropdownList}>
            {filteredDatasets.map((dataset, idx) => (
              <div
                key={idx}
                className={styles.dropdownItem}
                onClick={() => onDatasetClick(dataset)}
              >
                <div className={styles.datasetContent}>
                  <span className={styles.datasetName}>
                    <FaChevronRight className={styles.datasetIcon} />
                    {dataset.name}
                  </span>
                  {dataset.description && (
                    <span className={styles.datasetDescription}>
                      {dataset.description}
                    </span>
                  )}
                </div>
                {dataset.version && (
                  <span className={styles.datasetVersion}>
                    v{dataset.version}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <button className={styles.sendButton} onClick={onSend}>
        <FaArrowUp />
      </button>
    </div>
  );
}

export default PromptInput;
