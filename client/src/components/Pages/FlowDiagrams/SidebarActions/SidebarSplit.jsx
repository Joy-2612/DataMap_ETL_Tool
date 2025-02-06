import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Papa from "papaparse";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import styles from "./SidebarSplit.module.css";

const SidebarSplit = ({ nodeId, nodes, setNodes }) => {
  const [datasets, setDatasets] = useState([]);
  const [dataset1, setDataset1] = useState(null);
  const [columns1, setColumns1] = useState([]);
  const [splits, setSplits] = useState([{ col: "", delimiter: "", numDelimiters: 1, columnNames: [""] }]);
  const [activeTab, setActiveTab] = useState("general");
  const [addressColumn, setAddressColumn] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userId = localStorage.getItem("userId");

  // Fetch datasets on mount
  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/file/alldatasets/${userId}`);
      const data = await response.json();
      setDatasets(data.data);
    } catch (error) {
      toast.error("Error fetching datasets.");
    }
  };

  const fetchColumnsAndData = async (dataset) => {
    const csv = await parseCsvFile(dataset.file);
    setColumns1(Object.keys(csv[0]));
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

  const handleDatasetSelect = async (dataset) => {
    setDataset1(dataset);
    await fetchColumnsAndData(dataset);
    setSplits([{ col: "", delimiter: "", numDelimiters: 1, columnNames: [""] }]);
  };

  const handleSplitChange = (index, field, value) => {
    const newSplits = [...splits];
    newSplits[index][field] = value;

    if (field === "numDelimiters") {
      const numCols = parseInt(value) + 1;
      const selectedColumn = newSplits[index].col;
      newSplits[index].columnNames = Array.from(
        { length: numCols },
        (_, i) => newSplits[index].columnNames[i] || `${selectedColumn}_${i + 1}`
      );
    }

    setSplits(newSplits);
  };

  const handleColumnNameChange = (splitIndex, nameIndex, value) => {
    const newSplits = [...splits];
    newSplits[splitIndex].columnNames[nameIndex] = value;
    setSplits(newSplits);
  };

  const addSplit = () => {
    setSplits([...splits, { col: "", delimiter: "", numDelimiters: 1, columnNames: [""] }]);
  };

  // Save split parameters to the selected node
  const handleSubmit = () => {
    if (!dataset1) {
      toast.error("Please select a dataset.");
      return;
    }

    const parameters = {
      datasetId: dataset1._id,
      datasetName: dataset1.name,
      splitType: activeTab,
      splits: activeTab === "general" ? splits : [],
      addressColumn: activeTab === "address" ? addressColumn : null,
    };

    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            parameters,
          },
        };
      }
      return node;
    });

    setNodes(updatedNodes);
    console.log("Split Parameters Saved:", parameters);
    toast.success("Split parameters saved successfully!");
  };

  return (
    <div className={styles.splitContainer}>
      {/* Tab Selector */}
      <div className={styles.tabSelector}>
        <button
          className={`${styles.tabButton} ${activeTab === "general" ? styles.active : ""}`}
          onClick={() => setActiveTab("general")}
        >
          General Split
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "address" ? styles.active : ""}`}
          onClick={() => setActiveTab("address")}
        >
          Address Split
        </button>
      </div>

      {/* Dataset Selector */}
      <div className={styles.datasetSelector}>
        <label>Select Dataset</label>
        <Dropdown
          datasets={datasets}
          selected={dataset1}
          onSelect={handleDatasetSelect}
          isOpen={isDropdownOpen}
          setIsOpen={setIsDropdownOpen}
        />
      </div>

      {/* General Split Form */}
      {dataset1 && activeTab === "general" && (
        <div>
          {splits.map((split, index) => (
            <div className={styles.splitRowContainer} key={index}>
              <label>Select Column</label>
              <div className={styles.splitRow}>
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
                  onChange={(e) => handleSplitChange(index, "delimiter", e.target.value)}
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
                  onChange={(e) => handleSplitChange(index, "numDelimiters", e.target.value)}
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
                    onChange={(e) => handleColumnNameChange(index, i, e.target.value)}
                  />
                ))}
              </div>
            </div>
          ))}
          <button className={styles.addButton} onClick={addSplit}>
            + Add More
          </button>
        </div>
      )}

      {/* Address Split Form */}
      {dataset1 && activeTab === "address" && (
        <div className={styles.addressSplitContainer}>
          <label>Select Address Column</label>
          <select value={addressColumn} onChange={(e) => setAddressColumn(e.target.value)}>
            <option value="">Select Column</option>
            {columns1.map((column, i) => (
              <option key={i} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Submit Button */}
      <div className={styles.buttonGroup}>
        <button className={styles.submitButton} onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default SidebarSplit;
