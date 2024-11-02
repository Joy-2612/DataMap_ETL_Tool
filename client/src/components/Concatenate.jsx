import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "sonner";
import styles from "../styles/Concatenate.module.css";
import Papa from "papaparse";

const Concatenate = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");
  const [description, setDescription] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [dataset1, setDataset1] = useState("");
  const [columns1, setColumns1] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [currentSelection, setCurrentSelection] = useState(""); // Track current selection
  const [delimiter, setDelimiter] = useState(",");
  const [finalColumnName, setFinalColumnName] = useState("");

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/file/datasets/${userId}`
        );
        const data = await response.json();
        setDatasets(data.data);
      } catch (error) {
        console.error("Error fetching datasets: ", error);
      }
    };

    fetchDatasets(); // Fetch datasets on component mount
  }, []);

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

  const handleDatasetChange = (e) => {
    const selectedDatasetName = e.target.value;
    const selectedDataset = datasets.find(
      (dataset) => dataset.name === selectedDatasetName
    );

    setDataset1(selectedDatasetName);

    if (selectedDataset) {
      fetchColumn(selectedDataset);
      setSelectedColumns([]); // Clear selected columns when dataset changes
      setCurrentSelection(""); // Reset current selection
    }
  };

  const handleColumnSelect = (e) => {
    const column = e.target.value;
    if (column && !selectedColumns.includes(column)) {
      setSelectedColumns([...selectedColumns, column]);
      setCurrentSelection(""); // Clear current selection to reset the dropdown
    }
  };

  const handleColumnRemove = (column) => {
    setSelectedColumns(selectedColumns.filter((c) => c !== column));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/file/concatenate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataset: dataset1,
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
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error("An error occurred while concatenating columns.");
    }
  };

  return (
    <div>
      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.descModalContent}>
            <h2>Enter Output File Details</h2>
            <div className={styles.formGroup}>
              <label>Output File Name</label>
              <input
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className={`${styles.buttonGroup} ${styles.modalButtons}`}>
              <button
                className={styles.submitButton}
                onClick={() => {
                  handleSubmit();
                  setIsModalOpen(false);
                  setOutputFileName("");
                  setDescription("");
                }}
              >
                Submit
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
      <div className={styles.concatenateContainer}>
        <div className={styles.title}>Concatenate Columns</div>
        <div className={styles.formGroup}>
          <select value={dataset1} onChange={handleDatasetChange}>
            <option value="">Select Dataset</option>
            {datasets.map((dataset, index) => (
              <option key={index} value={dataset.name}>
                {dataset.name}
              </option>
            ))}
          </select>

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

          <div className={styles.selectedColumns}>
            {selectedColumns.map((column, index) => (
              <div key={index} className={styles.selectedColumn}>
                {column}
                <FaTimes onClick={() => handleColumnRemove(column)} />
              </div>
            ))}
          </div>

          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="|">Pipe (|)</option>
            <option value=" ">Space</option>
          </select>

          <input
            type="text"
            value={finalColumnName}
            onChange={(e) => setFinalColumnName(e.target.value)}
            placeholder="Final Column Name"
          />

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={selectedColumns.length === 0}
          >
            Concatenate
          </button>
        </div>
      </div>
    </div>
  );
};

export default Concatenate;
