import React, { useState, useEffect } from "react";
import styles from "../styles/Standardize.module.css";
import Papa from "papaparse";
import { toast } from "sonner";
import Multiselect from "multiselect-react-dropdown";
import Dropdown from "../components/Dropdown/Dropdown";
import DataTable from "../components/DataTable/DataTable";
import { IoMdClose } from "react-icons/io";

const Standardize = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [mappings, setMappings] = useState([{ before: [], after: "" }]);
  const [csvData, setCsvData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState([]);
  const [globalSelectedValues, setGlobalSelectedValues] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedCsvData, setSelectedCsvData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [newFileId, setNewFileId] = useState(null);

  const userId = localStorage.getItem("userId");

  const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(file.data);
      const text = new TextDecoder("utf-8").decode(uint8Array);

      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        complete: (result) => resolve(result.data),
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
  }, [userId]);

  useEffect(() => {
    if (selectedColumn && csvData.length > 0) {
      const values = csvData.map((row) => row[selectedColumn]);
      const uniqueVals = [
        ...new Set(
          values.filter((value) => value !== undefined && value !== null)
        ),
      ];
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
      setIsLoading(true);
      const response = await fetch(
        "http://localhost:5000/api/file/standardize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataset: selectedDataset?.name,
            column: selectedColumn,
            mappings: mappings,
            outputFileName: outputFileName,
            description: description,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        toast.success("Standardization mappings submitted successfully!");
        setNewFileId(result.newFileId);
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (error) {
      toast.error("Failed to submit standardization mappings.");
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
      setOutputFileName("");
      setDescription("");
    }
  };

  const handleCsvView = async (dataset) => {
    const selectedDataset = datasets.find((d) => d.name === dataset.name);
    if (selectedDataset) {
      const csvData = await parseCsvFile(selectedDataset.file);
      setSelectedCsvData(csvData);
      setIsCsvModalOpen(true);
      setTimeout(() => setModalVisible(true), 10);
    }
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

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setIsCsvModalOpen(false);
      setSelectedCsvData([]);
    }, 300);
  };

  return (
    <div>
      {isModalOpen && (
        <div
          className={`${styles.modalOverlay} ${
            isModalClosing ? styles.closing : ""
          }`}
          onClick={handleModalClose}
        >
          <div
            className={`${styles.descModalContent} ${
              isModalClosing ? styles.closing : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTitle}>
              Enter Output File Details
              <IoMdClose
                className={styles.closeButton}
                onClick={handleModalClose}
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
          <Dropdown
            datasets={datasets}
            selected={selectedDataset}
            onSelect={(dataset) => {
              setSelectedDataset(dataset);
              fetchColumns(dataset);
              setIsDropdownOpen(false);
            }}
            onView={handleCsvView}
            isOpen={isDropdownOpen}
            setIsOpen={setIsDropdownOpen}
          />
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
                      options={getFilteredValues()}
                      selectedValues={mapping.before}
                      isObject={false}
                      onSelect={(selectedList) =>
                        handleSelectChange(index, selectedList)
                      }
                      onRemove={(selectedList) =>
                        handleSelectChange(index, selectedList)
                      }
                      placeholder="Select values"
                      style={{
                        color: "black",
                        chips: { background: "black", color: "white" },
                        searchBox: { border: "1px solid #ccc" },
                        searchWrapper: {
                          border: "1px solid #ccc",
                          backgroundColor: "#f5f5f5",
                        },
                        optionListContainer: { color: "black" },
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
        {newFileId && (
          <button onClick={handlePreview} className={styles.previewButton}>
            Preview Result
          </button>
        )}
      </div>

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

export default Standardize;
