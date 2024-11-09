import React, { useState, useEffect } from "react";
import styles from "../styles/Standardize.module.css";
import Papa from "papaparse";
import Multiselect from "multiselect-react-dropdown"; // Import the Multiselect component

const Standardize = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");
  const [description, setDescription] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [mappings, setMappings] = useState([{ before: [], after: "" }]);
  const [csvData, setCsvData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState([]);
  const [globalSelectedValues, setGlobalSelectedValues] = useState([]);

  const userId = localStorage.getItem("userId");

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

  const fetchDatasets = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/alldatasets/${userId}`
      );
      const data = await response.json();
      setDatasets(data.data);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  const fetchColumns = async (dataset) => {
    const csv = await parseCsvFile(dataset.file);
    setCsvData(csv);
    const columns = Object.keys(csv[0]);
    setColumns(columns);
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selectedColumn && csvData.length > 0) {
      const values = csvData.map((row) => row[selectedColumn]);
      const uniqueVals = [
        ...new Set(
          values.filter((value) => value !== undefined && value !== null)
        ),
      ]; // Exclude undefined and null values
      setUniqueValues(uniqueVals);
    } else {
      setUniqueValues([]);
    }
  }, [selectedColumn, csvData]);

  const handleAddMapping = () => {
    setMappings([...mappings, { before: [], after: "" }]);
  };

  const handleMappingChange = (index, field, value) => {
    const updatedMappings = [...mappings];
    updatedMappings[index][field] = value;
    setMappings(updatedMappings);
  };

  const handleSelectChange = (index, selectedValues) => {
    const updatedMappings = [...mappings];
    updatedMappings[index].before = selectedValues;
    setMappings(updatedMappings);

    // Update globalSelectedValues based on all mappings
    const updatedGlobalSelectedValues = new Set();
    updatedMappings.forEach((mapping) =>
      mapping.before.forEach((value) => updatedGlobalSelectedValues.add(value))
    );

    setGlobalSelectedValues([...updatedGlobalSelectedValues]);
  };

  const getFilteredValues = () => {
    return uniqueValues.filter(
      (value) => !globalSelectedValues.includes(value)
    );
  };

  const handleModalClose = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
    }, 300);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/file/standardize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataset: selectedDataset,
            column: selectedColumn,
            mappings: mappings,
            outputFileName: outputFileName,
            description: description,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert("Standardization mappings submitted successfully!");
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert("Failed to submit standardization mappings.");
    } finally {
      setIsModalOpen(false);
      setOutputFileName("");
      setDescription("");
    }
  };

  return (
    <div>
      {isModalOpen && (
        <div
          className={`${styles.modal} ${isModalClosing ? styles.closing : ""}`}
        >
          <div
            className={`${styles.descModalContent} ${
              isModalClosing ? styles.closing : ""
            }`}
          >
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
              <button className={styles.submitButton} onClick={handleSubmit}>
                Submit
              </button>
              <button
                className={styles.cancelButton}
                onClick={handleModalClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.standardizeContainer}>
        <h1 className={styles.title}>Standardize Data</h1>

        <div className={styles.formGroup}>
          <label>Select Dataset</label>
          <select
            value={selectedDataset}
            onChange={(e) => {
              const datasetName = e.target.value;
              setSelectedDataset(datasetName);
              const selectedDataset = datasets.find(
                (ds) => ds.name === datasetName
              );
              if (selectedDataset) fetchColumns(selectedDataset);
            }}
          >
            <option value="">Choose a Dataset</option>
            {datasets.map((dataset, index) => (
              <option key={index} value={dataset.name}>
                {dataset.name}
              </option>
            ))}
          </select>
        </div>

        {columns.length > 0 && (
          <div className={styles.formGroup}>
            <label>Select Column</label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
            >
              <option value="">Choose a Column</option>
              {columns.map((column, index) => (
                <option key={index} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedDataset && (
          <div className={styles.mappingsContainer}>
            <h2>Mappings</h2>
            {mappings.map((mapping, index) => (
              <div key={index} className={styles.mappingRow}>
                <div className={styles.multiSelect}>
                  {uniqueValues.length > 0 && (
                    <Multiselect
                      options={getFilteredValues()} // Pass the filtered values as options
                      selectedValues={mapping.before} // Pre-select already selected values
                      isObject={false} // Directly use values as options, not objects
                      onSelect={(selectedList) =>
                        handleSelectChange(index, selectedList)
                      }
                      onRemove={(selectedList) =>
                        handleSelectChange(index, selectedList)
                      }
                      placeholder="Select values"
                      style={{
                        chips: { background: "black", color: "white" },
                        searchBox: { border: "1px solid #ccc" },
                        searchWrapper: {
                          border: "1px solid #ccc",
                          backgroundColor: "#f5f5f5",
                        },
                        optionListContainer: { color: "black" },
                        optionContainer: { color: "black" },
                      }}
                    />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="After"
                  value={mapping.after}
                  onChange={(e) =>
                    handleMappingChange(index, "after", e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div className={styles.buttonGroup}>
          <button className={styles.addButton} onClick={handleAddMapping}>
            + Add More
          </button>
          <button
            className={styles.submitButton}
            onClick={() => setIsModalOpen(true)}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Standardize;
