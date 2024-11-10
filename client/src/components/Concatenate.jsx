import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { toast } from "sonner";
import Papa from "papaparse";
import Dropdown from "../components/Dropdown/Dropdown";
import DataTable from "../components/DataTable/DataTable";
import styles from "../styles/Concatenate.module.css";

const Concatenate = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");
  const [description, setDescription] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [dataset1, setDataset1] = useState(null);
  const [columns1, setColumns1] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [currentSelection, setCurrentSelection] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [finalColumnName, setFinalColumnName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedCsvData, setSelectedCsvData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [newFileId, setNewFileId] = useState(null); // For previewing result

  // NEW STATE VARIABLES FOR DROPDOWN OPEN STATE
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/file/alldatasets/${userId}`
        );
        const data = await response.json();
        setDatasets(data.data);
      } catch (error) {
        console.error("Error fetching datasets: ", error);
      }
    };
    fetchDatasets();
  }, [userId]);

  const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(file.data);
      const text = new TextDecoder("utf-8").decode(uint8Array);

      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        complete: (result) => {
          resolve(result.data);
        },
        error: (error) => {
          console.error("Error parsing CSV: ", error);
          reject(error);
        },
      });
    });
  };

  const fetchColumn = async (dataset) => {
    const csv = await parseCsvFile(dataset.file);
    const columns = Object.keys(csv[0]);
    setColumns1(columns);
  };

  // Triggered only by dataset selection dropdown, not by "View" button click
  const handleDatasetSelect = async (dataset) => {
    setDataset1(dataset);
    fetchColumn(dataset);
    setSelectedColumns([]);
    setCurrentSelection("");
    setIsDropdownOpen(false); // Close the dropdown after selection
  };

  // Triggered by the "View" button click within the dropdown
  const handleCsvView = async (dataset) => {
    const selectedDataset = datasets.find((d) => d.name === dataset.name);
    if (selectedDataset) {
      const csvData = await parseCsvFile(selectedDataset.file);
      setSelectedCsvData(csvData);
      setIsCsvModalOpen(true);
      setTimeout(() => setModalVisible(true), 10);
    }
  };

  const handleColumnSelect = (e) => {
    const column = e.target.value;
    if (column && !selectedColumns.includes(column)) {
      setSelectedColumns([...selectedColumns, column]);
      setCurrentSelection("");
    }
  };

  const handleColumnRemove = (column) => {
    setSelectedColumns(selectedColumns.filter((c) => c !== column));
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const response = await fetch(
        "http://localhost:5000/api/file/concatenate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataset: dataset1.name,
            columns: selectedColumns,
            finalColumnName,
            outputFileName,
            delimiter,
            description,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `File created successfully! New file ID: ${data.newFileId}`
        );
        setNewFileId(data.newFileId); // Store the newFileId
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error("An error occurred while concatenating columns.");
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
      setOutputFileName("");
      setDescription("");
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setIsCsvModalOpen(false);
      setSelectedCsvData([]);
    }, 300);
  };

  const handlePreview = async () => {
    try {
      // Fetch the dataset using the newFileId
      const response = await fetch(
        `http://localhost:5000/api/file/dataset/${newFileId}`
      );
      const data = await response.json();
      if (response.ok) {
        // Parse the CSV data
        const csvData = await parseCsvFile(data.data.file);
        setSelectedCsvData(csvData);
        setIsCsvModalOpen(true);
        setTimeout(() => setModalVisible(true), 10);
      } else {
        toast.error(`Error fetching dataset: ${data.message}`);
      }
    } catch (error) {
      toast.error("An error occurred while fetching the dataset.");
    }
  };

  return (
    <div className={styles.concatenateContainer}>
      <div className={styles.title}>Concatenate Columns</div>
      <div className={styles.formGroup}>
        <div className={styles.labelContainer}>
          {dataset1 && <label>Dataset</label>}
          <Dropdown
            datasets={datasets}
            selected={dataset1}
            onSelect={handleDatasetSelect} // Only handles selection
            onView={handleCsvView} // Separate handler for viewing CSV
            isOpen={isDropdownOpen} // Use the new state variables
            setIsOpen={setIsDropdownOpen} // Use the new state variables
          />
        </div>
        <select value={currentSelection} onChange={handleColumnSelect}>
          <option value="">Select Columns</option>
          {columns1
            .filter((col) => !selectedColumns.includes(col))
            .map((col, index) => (
              <option key={index} value={col}>
                {col}
              </option>
            ))}
        </select>
        <div className={styles.labelContainer}>
          {selectedColumns.length >= 1 && <label>Selected Columns :</label>}
          <div className={styles.selectedColumns}>
            {selectedColumns.map((column, index) => (
              <div key={index} className={styles.selectedColumn}>
                {column}
                <FaTimes onClick={() => handleColumnRemove(column)} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.labelContainer}>
          <label>Delimiter</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="|">Pipe (|)</option>
            <option value=" ">Space</option>
          </select>
        </div>
        <div className={styles.labelContainer}>
          {finalColumnName && <label>Final Column Name</label>}
          <input
            type="text"
            value={finalColumnName}
            onChange={(e) => setFinalColumnName(e.target.value)}
            placeholder="Final Column Name"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={selectedColumns.length === 0 || isLoading}
        >
          {isLoading ? <span className={styles.loader}></span> : "Concatenate"}
        </button>
        {newFileId && (
          <button onClick={handlePreview} className={styles.previewButton}>
            Preview Result
          </button>
        )}
      </div>

      {/* Output File Details Modal */}
      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className={styles.descModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTitle}>
              Enter Output File Details
              <IoMdClose
                className={styles.closeButton}
                onClick={() => setIsModalOpen(false)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Output File Name</label>
              <input
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className={`${styles.buttonGroup} ${styles.modalButtons}`}>
              <button
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? <span className={styles.loader}></span> : "Submit"}
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Data Modal */}
      {isCsvModalOpen && (
        <div
          className={`${styles.modalOverlay} ${
            modalVisible ? styles.modalOverlayVisible : ""
          }`}
          onClick={handleCloseModal}
        >
          <div
            className={`${styles.modalContent} ${
              modalVisible ? styles.modalContentVisible : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTitle}>
              CSV Data
              <IoMdClose
                className={styles.closeButton}
                onClick={handleCloseModal}
              />
            </div>

            {selectedCsvData.length > 0 ? (
              <DataTable
                title="CSV Data"
                columns={Object.keys(selectedCsvData[0]).map((key) => ({
                  label: key,
                  key: key,
                }))}
                data={selectedCsvData}
                getRowId={(row, index) => index}
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

export default Concatenate;
