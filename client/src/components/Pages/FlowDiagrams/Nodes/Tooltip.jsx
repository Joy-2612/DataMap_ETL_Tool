import React, { useState } from "react";
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
    try {
      console.log("Fetching dataset with ID:", dataset?._id);

      const response = await fetch(
        `http://localhost:5000/api/file/dataset/${dataset._id}`
      );
      if (!response.ok) throw new Error("Failed to fetch file data");

      const fileData = await response.text(); // Change to `.text()` instead of `.arrayBuffer()`
      console.log("Received File Data:", fileData); // Log the received data

      if (dataset.type === "text/csv") {
        parseCsvFile(fileData);
      }

      setIsModalOpen(true);
      toast.info(`Peeking dataset with ID: ${dataset._id}`);
    } catch (error) {
      console.error("Error fetching or parsing file data:", error);
      toast.error("Failed to load dataset");
    }
  };

  const parseCsvFile = (text) => {
    console.log("Parsing CSV Data...");
  
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: ({ data }) => {
        console.log("Parsed CSV Data:", data);
        
        // Ensure React re-renders
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
        onClick={() => onDelete(id)}
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

      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className={styles.modalContent}
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
                  key:key,
                }))}
                data={selectedCsvData}
                getRowId={(row, index) =>  index} // Ensure `_id` exists
              />
            ) : (
              <p>No data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
