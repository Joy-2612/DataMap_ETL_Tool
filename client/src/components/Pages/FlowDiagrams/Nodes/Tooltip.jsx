import React, { useState } from "react";
import ReactDOM from "react-dom";
import { MdDeleteForever } from "react-icons/md";
import { FaEye } from "react-icons/fa";
import { toast } from "sonner"; // Toast notifications
import Papa from "papaparse";
import DataTable from "../../../UI/DataTable/DataTable";
import { IoMdClose } from "react-icons/io";
import styles from "./Tooltip.module.css"; // Import the modular CSS

const Tooltip = ({ onDelete, id, data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCsvData, setSelectedCsvData] = useState([]);

  const handleView = async (dataset) => {
    // Peek the dataset only if an ID is present; otherwise, show a toast error.
    if (!dataset || !dataset._id) {
      toast.error("Node doesn't have a dataset");
      return;
    }

    try {
      console.log("Fetching dataset with ID:", dataset._id);

      const response = await fetch(
        `http://localhost:5000/api/file/dataset/${dataset._id}`
      );
      if (!response.ok) throw new Error("Failed to fetch file data");

      const fileData = await response.json();
      console.log("Received File Data:", fileData);

      if (dataset.type === "text/csv") {
        parseCsvFile(fileData);
      }

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching or parsing file data:", error);
      toast.error("Failed to load dataset");
    }
  };

  const parseCsvFile = (file) => {
    console.log("File", file.data.file.data);
    const uint8Array = new Uint8Array(file.data.file.data);
    const text = new TextDecoder("utf-8").decode(uint8Array);
    console.log("Parsing CSV Data...");
    console.log("CSV Data:", text);

    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: ({ data }) => {
        console.log("Parsed CSV Data:", data);
        setSelectedCsvData([...data]);
      },
      error: (error) => console.error("Error parsing CSV:", error),
    });
  };

  return (
    <div className={styles.tooltipContainer}>
      <button
        className={styles.deleteButton}
        title="Delete"
        onClick={() => {
          if (onDelete) {
            onDelete(id);
          } else {
            console.error("onDelete callback is not defined");
          }
        }}
      >
        <MdDeleteForever />
      </button>
      <button
        className={styles.peekButton}
        onClick={() => handleView(data)}
        title="Peek"
      >
        <FaEye />
      </button>

      {isModalOpen &&
        ReactDOM.createPortal(
          <div
            className={`${styles.modalOverlay} ${styles.modalOverlayVisible}`}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className={`${styles.modalContent} ${styles.modalContentVisible}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalTitle}>
                {data.name}
                <IoMdClose
                  className={styles.closeButton}
                  onClick={() => setIsModalOpen(false)}
                />
              </div>
              {selectedCsvData.length > 0 ? (
                <DataTable
                  title="CSV Data"
                  columns={Object.keys(selectedCsvData[0] || {}).map((key) => ({
                    label: key,
                    key: key,
                  }))}
                  data={selectedCsvData}
                  getRowId={(row, index) => index} // Use index if _id is not present
                />
              ) : (
                <p>No data available</p>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Tooltip;
