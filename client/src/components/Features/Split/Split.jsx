import React, { useState, useEffect } from "react";
import DataTable from "../../UI/DataTable/DataTable";
import Papa from "papaparse";
import { toast } from "sonner";
import Dropdown from "../../UI/Dropdown/Dropdown";
import { IoMdClose } from "react-icons/io";
import styles from "./Split.module.css";

const Split = () => {
  const [datasets, setDatasets] = useState([]);
  const [dataset1, setDataset1] = useState(null);
  const [columns1, setColumns1] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [splits, setSplits] = useState([
    { col: "", delimiter: "", numDelimiters: 1, columnNames: [""] },
  ]);
  const [previewData, setPreviewData] = useState([]);
  const [conversionCompleted, setConversionCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [addressColumn, setAddressColumn] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewDataset, setViewDataset] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/alldatasets/${userId}`
      );
      const data = await response.json();
      setDatasets(data.data);
    } catch (error) {
      toast.error("Error fetching datasets. Please try again.");
    }
  };

  const fetchColumnsAndData = async (dataset) => {
    const csv = await parseCsvFile(dataset.file);
    const columns = Object.keys(csv[0]);
    setColumns1(columns);
    setCsvData(csv);
  };

  const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(file.data);
      const text = new TextDecoder("utf-8").decode(uint8Array);

      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        complete: (result) => resolve(result.data),
        error: (error) => reject(error),
      });
    });
  };

  const handleViewDataset = async (dataset) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/file/dataset/${dataset._id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch the dataset.");
      }

      const data = await response.json();
      if (data.data && data.data.file) {
        const csv = await parseCsvFile(data.data.file);
        setViewDataset(csv);
        setIsViewModalOpen(true);
        setModalVisible(true); // Ensure modal is visible
      } else {
        toast.error("Invalid data format in the fetched dataset.");
      }
    } catch (error) {
      console.error("Error fetching dataset:", error);
      toast.error("An error occurred while fetching the dataset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatasetSelect = async (dataset) => {
    setDataset1(dataset);
    await fetchColumnsAndData(dataset);
    setSplits([
      { col: "", delimiter: "", numDelimiters: 1, columnNames: [""] },
    ]);
    setConversionCompleted(false);
  };

  const handleSplitChange = (index, field, value) => {
    const newSplits = [...splits];
    newSplits[index][field] = value;

    if (field === "numDelimiters") {
      const numCols = parseInt(value) + 1;
      const selectedColumn = newSplits[index].col;
      const newColumnNames = Array.from(
        { length: numCols },
        (_, i) =>
          newSplits[index].columnNames[i] || `${selectedColumn}_${i + 1}`
      );
      newSplits[index].columnNames = newColumnNames;
    }

    setSplits(newSplits);
  };

  const handleColumnNameChange = (splitIndex, nameIndex, value) => {
    const newSplits = [...splits];
    newSplits[splitIndex].columnNames[nameIndex] = value;
    setSplits(newSplits);
  };

  const addSplit = () => {
    setSplits([
      ...splits,
      { col: "", delimiter: "", numDelimiters: 1, columnNames: [""] },
    ]);
  };

  const handleSplit = async () => {
    if (!dataset1) {
      toast.error("Please select a dataset.");
      return;
    }

    try {
      setIsLoading(true);
      let response;

      if (activeTab === "general") {
        response = await fetch("http://localhost:5000/api/file/split", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: dataset1._id,
            splits,
            description: description,
            outputFileName: outputFileName,
          }),
        });
      } else {
        response = await fetch("http://localhost:5000/api/file/splitAddress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: dataset1._id,
            addressName: addressColumn,
            description: description,
            outputFileName: outputFileName,
          }),
        });
      }

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to split columns.");
      }

      const { newFileId, message } = await response.json();

      const newDatasetResponse = await fetch(
        `http://localhost:5000/api/file/dataset/${newFileId}`
      );

      if (!newDatasetResponse.ok) {
        throw new Error("Failed to fetch the new dataset.");
      }

      const newDataset = await newDatasetResponse.json();

      if (newDataset.data && newDataset.data.file) {
        const csv = await parseCsvFile(newDataset.data.file);
        setPreviewData(csv);
      } else {
        toast.error("Invalid data format in the fetched dataset.");
        return;
      }

      toast.success(message);
      setConversionCompleted(true);
      handleModalClose();
    } catch (error) {
      console.error("Error splitting columns:", error);
      toast.error(
        error.message || "An error occurred while splitting the columns."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
    }, 300);
  };

  const handlePreviewModalClose = () => {
    setModalVisible(false);
    setTimeout(() => {
      setIsPreviewModalOpen(false);
    }, 300);
  };

  return (
    <div className={styles.splitContainer}>
      <h2>Split Columns</h2>

      <div className={styles.tabSelector}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "general" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("general")}
        >
          General Split
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "address" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("address")}
        >
          Address Split
        </button>
      </div>

      <div className={styles.datasetSelector}>
        <label>Select Dataset</label>
        <Dropdown
          datasets={datasets}
          selected={dataset1}
          onSelect={handleDatasetSelect}
          onView={handleViewDataset} // Pass handleViewDataset here
          isOpen={isDropdownOpen}
          setIsOpen={setIsDropdownOpen}
        />
      </div>

      {dataset1 &&
        (activeTab === "general" ? (
          <div>
            {splits.map((split, index) => (
              <div className={styles.splitRowContainer} key={index}>
                <label>Select Column</label>
                <div className={styles.splitRow}>
                  <select
                    value={split.col}
                    onChange={(e) =>
                      handleSplitChange(index, "col", e.target.value)
                    }
                  >
                    <option value="">Select Column</option>
                    {columns1.map((column, i) => (
                      <option key={i} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>

                  <select
                    value={split.delimiter}
                    onChange={(e) =>
                      handleSplitChange(index, "delimiter", e.target.value)
                    }
                  >
                    <option value="">Select Delimiter</option>
                    <option value=" ">Space</option>
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value="|">Pipe (|)</option>
                  </select>

                  <input
                    type="number"
                    min="0"
                    value={split.numDelimiters}
                    onChange={(e) =>
                      handleSplitChange(index, "numDelimiters", e.target.value)
                    }
                  />
                </div>
                <label>Enter Column Names:</label>
                <div className={styles.splitColumnsInput}>
                  {split.columnNames.map((name, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Column ${i + 1} Name`}
                      value={name}
                      onChange={(e) =>
                        handleColumnNameChange(index, i, e.target.value)
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
            <button
              className={styles.convertButton}
              onClick={() => setIsModalOpen(true)}
            >
              Convert
            </button>
          </div>
        ) : (
          <div className={styles.addressSplitContainer}>
            <label>Select Address Column</label>
            <select
              value={addressColumn}
              onChange={(e) => setAddressColumn(e.target.value)}
            >
              <option value="">Select Column</option>
              {columns1.map((column, i) => (
                <option key={i} value={column}>
                  {column}
                </option>
              ))}
            </select>
            <button
              className={styles.convertButton}
              onClick={() => setIsModalOpen(true)}
            >
              Split Address
            </button>
          </div>
        ))}

      {conversionCompleted && (
        <div className={styles.completionMessage}>
          <p>Conversion completed successfully!</p>
          <button
            className={styles.previewButton}
            onClick={() => {
              setIsPreviewModalOpen(true);
              setModalVisible(false);
              setTimeout(() => setModalVisible(true), 10);
            }}
          >
            Show Preview
          </button>
        </div>
      )}
      {isViewModalOpen && (
        <div
          className={`${styles.modalOverlay} ${
            modalVisible ? styles.modalOverlayVisible : ""
          }`}
          onClick={() => {
            setIsViewModalOpen(false);
            setModalVisible(false);
          }}
        >
          <div
            className={`${styles.modalContent} ${
              modalVisible ? styles.modalContentVisible : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.csvModalTitle}>
              Dataset Preview
              <IoMdClose
                className={styles.closeModalButton}
                onClick={() => {
                  setIsViewModalOpen(false);
                  setModalVisible(false);
                }}
              />
            </div>

            {viewDataset && viewDataset.length > 0 ? (
              <DataTable
                title="Dataset Preview"
                columns={Object.keys(viewDataset[0]).map((key) => ({
                  label: key,
                  key: key,
                }))}
                data={viewDataset}
                getRowId={(row, index) => index}
              />
            ) : (
              <p>No data available</p>
            )}
          </div>
        </div>
      )}
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
              <label>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className={`${styles.buttonGroup} ${styles.modalButtons}`}>
              <button
                className={styles.submitButton}
                onClick={handleSplit}
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

      {isPreviewModalOpen && (
        <div
          className={`${styles.modalOverlay} ${
            modalVisible ? styles.modalOverlayVisible : ""
          }`}
          onClick={handlePreviewModalClose}
        >
          <div
            className={`${styles.modalContent} ${
              modalVisible ? styles.modalContentVisible : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.csvModalTitle}>
              CSV Data Preview
              <IoMdClose
                className={styles.closeModalButton}
                onClick={handlePreviewModalClose}
              />
            </div>

            {previewData.length > 0 ? (
              <DataTable
                title="CSV Data Preview"
                columns={Object.keys(previewData[0]).map((key) => ({
                  label: key,
                  key: key,
                }))}
                data={previewData}
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

export default Split;
