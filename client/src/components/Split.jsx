import React, { useState, useEffect } from "react";
import DataTable from "../components/DataTable/DataTable";
import Papa from "papaparse";
import { toast } from "sonner";
import "../styles/Split.css"; // Import your CSS
import { IoMdClose } from "react-icons/io";

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
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [addressColumn, setAddressColumn] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");
  const [description, setDescription] = useState("");
  const [isModalClosing, setIsModalClosing] = useState(false);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/datasets/${userId}`
      );
      const data = await response.json();
      setDatasets(data.data);
    } catch (error) {
      setError("Error fetching datasets. Please try again.");
    }
  };

  const fetchColumnAndData = async (dataset) => {
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

  const handleDatasetChange = async (e) => {
    const selectedDatasetName = e.target.value;
    const selectedDataset = datasets.find(
      (dataset) => dataset.name === selectedDatasetName
    );

    setDataset1(selectedDataset);

    if (selectedDataset) {
      await fetchColumnAndData(selectedDataset);
    } else {
      setColumns1([]);
      setCsvData([]);
    }

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
      console.log("newDataset", newDataset);

      if (newDataset.data && newDataset.data.file) {
        const csv = await parseCsvFile(newDataset.data.file);
        setPreviewData(csv);
      } else {
        toast.error("Invalid data format in the fetched dataset.");
        return;
      }

      toast.success(message);
      setConversionCompleted(true);
      handleModalClose(); // Close modal after success
    } catch (error) {
      console.error("Error splitting columns:", error);
      toast.error(
        error.message || "An error occurred while splitting the columns."
      );
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
      setPreviewData([]);
    }, 300);
  };

  const renderGeneralSplit = () => (
    <>
      {splits.map((split, index) => (
        <div className="split-row-container" key={index}>
          <label>Select Column</label>
          <div className="split-row">
            <select
              value={split.col}
              onChange={(e) => handleSplitChange(index, "col", e.target.value)}
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
          {split && (
            <>
              <label>Enter Column Names :</label>
              <div className="split-columns-input">
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
            </>
          )}
        </div>
      ))}

      <button className="convert-button" onClick={() => setIsModalOpen(true)}>
        Convert
      </button>

      {conversionCompleted && (
        <div className="completion-message">
          <p>Conversion completed successfully!</p>
          <button
            className="preview-button"
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
    </>
  );

  const renderAddressSplit = () => (
    <div className="address-split-container">
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
      <button className="convert-button" onClick={() => setIsModalOpen(true)}>
        Split Address
      </button>

      {conversionCompleted && (
        <div className="completion-message">
          <p>Conversion completed successfully!</p>
          <button
            className="preview-button"
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
    </div>
  );

  return (
    <div className="split-container">
      <h2>Split Columns</h2>
      <div className="tab-selector">
        <button
          className={`tab-button ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          General Split
        </button>
        <button
          className={`tab-button ${activeTab === "address" ? "active" : ""}`}
          onClick={() => setActiveTab("address")}
        >
          Address Split
        </button>
      </div>

      <div className="dataset-selector">
        <label>Select Dataset</label>
        <select
          className="dataset-selector-select"
          value={dataset1?.name || ""}
          onChange={handleDatasetChange}
        >
          <option value="">Choose a Dataset</option>
          {datasets.map((dataset, index) => (
            <option key={index} value={dataset.name}>
              {dataset.name}
            </option>
          ))}
        </select>
      </div>

      {dataset1 &&
        (activeTab === "general" ? renderGeneralSplit() : renderAddressSplit())}

      {isModalOpen && (
        <div className={`modal ${isModalClosing ? "closing" : ""}`}>
          <div
            className={`desc-modal-content ${isModalClosing ? "closing" : ""}`}
          >
            <h2>Enter Output File Details</h2>
            <div className="form-group">
              <label>Output File Name</label>
              <input
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="button-group modal-buttons">
              <button className="submit-button" onClick={handleSplit}>
                Submit
              </button>
              <button className="cancel-button" onClick={handleModalClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewModalOpen && (
        <div
          className={`modal-overlay ${modalVisible ? "show" : ""}`}
          onClick={handlePreviewModalClose}
        >
          <div
            className={`modal-content ${modalVisible ? "show" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="csv-modal-title">
              CSV Data Preview
              <IoMdClose
                className="close-modal-button"
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

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Split;
