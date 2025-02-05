import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { IoMdClose } from "react-icons/io";
import { toast } from "sonner";
import DataTable from "../../../UI/DataTable/DataTable";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import styles from "./SidebarMerge.module.css";

const SidebarMerge = () => {
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");
  const [description, setDescription] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [dataset1, setDataset1] = useState(null);
  const [dataset2, setDataset2] = useState(null);
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]);
  const [selectedColumn1, setSelectedColumn1] = useState("");
  const [selectedColumn2, setSelectedColumn2] = useState("");
  const [selectedCsvData, setSelectedCsvData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Separate states for each dropdown's visibility
  const [isDropdown1Open, setIsDropdown1Open] = useState(false);
  const [isDropdown2Open, setIsDropdown2Open] = useState(false);

  // Modal states for output file details
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDetailsModalClosing, setIsDetailsModalClosing] = useState(false);

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
        complete: (result) => resolve(result.data),
        error: (error) => {
          console.error("Error parsing CSV: ", error);
          reject(error);
        },
      });
    });
  };

  const fetchColumns = async (dataset, setColumns) => {
    try {
      const selectedDataset = datasets.find((d) => d.name === dataset);
      if (selectedDataset) {
        const csvData = await parseCsvFile(selectedDataset.file);
        const columns = Object.keys(csvData[0]);
        setColumns(columns);
      }
    } catch (error) {
      console.error("Error fetching columns: ", error);
    }
  };

  const handleCsvView = async (dataset) => {
    const selectedDataset = datasets.find((d) => d.name === dataset.name);
    if (selectedDataset) {
      const csvData = await parseCsvFile(selectedDataset.file);
      setSelectedCsvData(csvData);
      setIsCsvModalOpen(true);
      setTimeout(() => setModalVisible(true), 10); // Trigger animation
    }
  };

  const handleDetailsSubmit = async () => {
    if (!selectedColumn1 || !selectedColumn2) {
      toast.error("Please select columns from both datasets.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5000/api/file/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset1: dataset1?._id,
          dataset2: dataset2?._id,
          column1: selectedColumn1,
          column2: selectedColumn2,
          outputFileName,
          description,
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        toast.success(
          `Datasets merged successfully! New file ID: ${data.newFileId}`
        );
        setDataset1(null);
        setDataset2(null);
        setColumns1([]);
        setColumns2([]);
        setOutputFileName("");
        setDescription("");
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("An error occurred while merging datasets.");
    } finally {
      closeDetailsModal();
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setIsCsvModalOpen(false);
      setSelectedCsvData([]);
    }, 300);
  };

  const openDetailsModal = () => {
    console.log("Opening details modal"); // Debugging step
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalClosing(true);
    setTimeout(() => {
      setIsDetailsModalOpen(false);
      setIsDetailsModalClosing(false);
    }, 300);
  };

  return (
    <div className={styles.mergeContainer}>
      <div className={styles.formGroup}>
        <div className={styles.datasetAndColumnInput}>
          <div className={styles.mergeInput}>
            <Dropdown
              datasets={datasets}
              selected={dataset1}
              onSelect={(dataset) => {
                setDataset1(dataset);
                fetchColumns(dataset.name, setColumns1);
                setIsDropdown1Open(false);
              }}
              onView={handleCsvView}
              isOpen={isDropdown1Open}
              setIsOpen={setIsDropdown1Open}
            />
          </div>
          <select
            value={selectedColumn1}
            onChange={(e) => setSelectedColumn1(e.target.value)}
          >
            <option value="">Select Column from Dataset 1</option>
            {columns1.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
        <hr className={styles.linebreak}/>
        <div className={styles.datasetAndColumnInput}>
          <div className={styles.mergeInput}>
            <Dropdown
              datasets={datasets.filter((d) => d.name !== dataset1?.name)}
              selected={dataset2}
              onSelect={(dataset) => {
                setDataset2(dataset);
                fetchColumns(dataset.name, setColumns2);
                setIsDropdown2Open(false);
              }}
              onView={handleCsvView}
              isOpen={isDropdown2Open}
              setIsOpen={setIsDropdown2Open}
            />
          </div>

          <select
            value={selectedColumn2}
            onChange={(e) => setSelectedColumn2(e.target.value)}
          >
            <option value="">Select Column from Dataset 2</option>
            {columns2.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openDetailsModal}
          disabled={
            !dataset1 ||
            !dataset2 ||
            !selectedColumn1 ||
            !selectedColumn2 ||
            isLoading
          }
        >
          {isLoading ? "Merging..." : "Merge"}
        </button>
      </div>

      {isDetailsModalOpen && (
        <div
          className={`${styles.descModalOverlay} ${styles.descModalOverlayVisible}`}
        >
          <div
            className={`${styles.descModalContent} ${styles.descModalContentVisible}`}
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
              <label>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className={`${styles.buttonGroup} ${styles.modalButtons}`}>
              <button
                className={styles.submitButton}
                onClick={handleDetailsSubmit}
              >
                Submit
              </button>
              <button
                className={styles.cancelButton}
                onClick={closeDetailsModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

export default SidebarMerge;
