// /src/components/Datasets/DatasetModal.js
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { IoMdClose } from "react-icons/io";
import { MdKeyboardArrowRight } from "react-icons/md";
import DataTable from "../../UI/DataTable/DataTable";
import SuggestionsPanel from "./SuggestionsPanel";
import styles from "./DatasetModal.module.css";
import { toast } from "sonner";

const DatasetModal = ({ dataset, onClose }) => {
  const [selectedCsvData, setSelectedCsvData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [areThoughtsCollapsed, setAreThoughtsCollapsed] = useState(false);

  useEffect(() => {
    if (dataset.type === "text/csv") {
      parseCsvFile(dataset.file);
    }
    setTimeout(() => {
      setModalVisible(true);
    }, 10);
  }, [dataset]);

  const parseCsvFile = async (file) => {
    const uint8Array = new Uint8Array(file.data);
    const text = new TextDecoder("utf-8").decode(uint8Array);
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        setSelectedCsvData(result.data);
      },
      error: (error) => {
        console.error("Error parsing CSV: ", error);
      },
    });
  };

  const handleGenerateSuggestions = async () => {
    setSuggestions([]);
    setThoughts([]);
    setIsGenerating(true);
    setAreThoughtsCollapsed(false);
    setIsSuggestionsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: dataset._id }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.startsWith("event: ")) {
            const eventType = part.replace("event: ", "");
            const dataLine = parts[parts.indexOf(part) + 1];
            if (dataLine?.startsWith("data: ")) {
              const data = JSON.parse(dataLine.replace("data: ", ""));
              switch (eventType) {
                case "thought":
                  setThoughts((prev) => [...prev, data.thought]);
                  break;
                case "suggestions":
                  setSuggestions(data.suggestions);
                  setAreThoughtsCollapsed(true);
                  setIsSuggestionsLoading(false);
                  break;
                case "error":
                  toast.error(data.error);
                  setIsSuggestionsLoading(false);
                  break;
                default:
                  break;
              }
            }
          }
        }
      }
    } catch (error) {
      toast.error("Failed to fetch suggestions");
      setIsSuggestionsLoading(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSuggestions = () => {
    if (isSuggestionsCollapsed) {
      if (suggestions.length === 0) {
        handleGenerateSuggestions();
      }
      setIsSuggestionsCollapsed(false);
    } else {
      setIsSuggestionsCollapsed(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      onClose();
      setSelectedCsvData([]);
    }, 300);
  };

  return (
    <div
      className={`${styles.modalOverlay} ${
        modalVisible ? styles.modalOverlayVisible : ""
      }`}
    >
      <div
        className={`${styles.modalContent} ${
          modalVisible ? styles.modalContentVisible : ""
        }`}
      >
        <div className={styles.modalTitle}>
          <div className={styles.modalHeader}>{dataset.name}</div>
          <IoMdClose className={styles.closeButton} onClick={closeModal} />
        </div>
        <div
          className={`${styles.modalContentWrapper} ${
            isSuggestionsCollapsed ? styles.fullWidth : ""
          }`}
        >
          <div className={styles.dataTableContainer}>
            {selectedCsvData.length > 0 ? (
              <DataTable
                title="CSV Data"
                columns={Object.keys(selectedCsvData[0]).map((key) => ({
                  label: key,
                  key,
                }))}
                data={selectedCsvData}
                getRowId={(row, index) => index}
              />
            ) : (
              <p>No data available</p>
            )}
          </div>
          {!isSuggestionsCollapsed && (
            <SuggestionsPanel
              suggestions={suggestions}
              thoughts={thoughts}
              isSuggestionsLoading={isSuggestionsLoading}
              isGenerating={isGenerating}
              areThoughtsCollapsed={areThoughtsCollapsed}
              setAreThoughtsCollapsed={setAreThoughtsCollapsed}
              onClose={() => setIsSuggestionsCollapsed(true)}
            />
          )}
        </div>
        {isSuggestionsCollapsed && (
          <div className={styles.collapsedTrigger} onClick={toggleSuggestions}>
            <img
              src="https://static.vecteezy.com/system/resources/previews/049/889/441/non_2x/generate-ai-abstract-symbol-artificial-intelligence-colorful-stars-icon-vector.jpg"
              alt="AI Icon"
              className={styles.aiIcon}
            />
            <span>AI Suggestions</span>
            <MdKeyboardArrowRight />
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetModal;
