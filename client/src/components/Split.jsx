import React, { useState, useEffect } from "react";
import DataTable from "../components/DataTable/DataTable";
import Papa from "papaparse";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Split = () => {
  const [datasets, setDatasets] = useState([]);
  const [dataset1, setDataset1] = useState(null);
  const [columns1, setColumns1] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [splits, setSplits] = useState([
    { col: "", delimiter: "", numDelimiters: 1, columnNames: [] },
  ]);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem("userId");

  // Fetch datasets
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

  // Parse CSV file
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
          reject(error);
        },
      });
    });
  };

  // Fetch columns and data
  const fetchColumnAndData = async (dataset) => {
    const csv = await parseCsvFile(dataset.file);
    const columns = Object.keys(csv[0]);
    setColumns1(columns);
    setCsvData(csv);
  };

  // Fetch datasets on mount
  useEffect(() => {
    fetchDatasets();
  }, []);

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

    // Reset splits
    setSplits([{ col: "", delimiter: "", numDelimiters: 1, columnNames: [] }]);
  };

  const handleSplit = async () => {
    try {
      const newPreviewData = csvData.map((row) => {
        const newRow = {};

        splits.forEach((split) => {
          const { col, delimiter, numDelimiters, columnNames } = split;

          if (row[col]) {
            const parts = row[col].split(delimiter);
            const splitParts = parts.slice(0, numDelimiters + 1);
            const remainingPart = parts
              .slice(numDelimiters + 1)
              .join(delimiter);

            // Copy existing columns except the split column
            Object.keys(row).forEach((key) => {
              if (key !== col) {
                newRow[key] = row[key];
              }
            });

            // Assign split parts to new column names
            splitParts.forEach((part, i) => {
              newRow[columnNames[i]] = part;
            });
          }
        });

        return newRow;
      });

      setPreviewData(newPreviewData);
      setShowPreview(true);
      toast.success("Table generated successfully!");
    } catch (error) {
      setError("Error splitting columns. Please try again.");
      toast.error("Failed to generate table.");
    }
  };

  const addSplit = () => {
    setSplits([
      ...splits,
      { col: "", delimiter: "", numDelimiters: 1, columnNames: [] },
    ]);
  };

  const handleSplitChange = (index, field, value) => {
    const newSplits = [...splits];
    newSplits[index][field] = value;

    if (field === "numDelimiters") {
      const selectedColumn = newSplits[index].col;
      const newColumnNames = Array.from(
        { length: parseInt(value) + 1 },
        (_, i) => `${selectedColumn}_${i + 1}`
      );
      newSplits[index].columnNames = newColumnNames;
    }

    setSplits(newSplits);
  };

  const isSplitButtonEnabled = () => {
    return splits.some(
      (split) => split.col || split.delimiter || split.numDelimiters > 0
    );
  };

  // Download CSV function
  const downloadCsv = () => {
    const csv = Papa.unparse(previewData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "split_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>Split Columns</h2>

      {error && (
        <div style={{ color: "red", textAlign: "center" }}>{error}</div>
      )}

      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <label>Select Dataset</label>
        <select
          value={dataset1?.name || ""}
          onChange={handleDatasetChange}
          style={{ marginLeft: "10px" }}
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
        splits.map((split, index) => (
          <div
            key={index}
            style={{ textAlign: "center", marginBottom: "20px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <select
                value={split.col}
                onChange={(e) => {
                  handleSplitChange(index, "col", e.target.value);
                  const newSplits = [...splits];
                  const newColumnNames = Array.from(
                    { length: split.numDelimiters + 1 },
                    (_, i) => `${e.target.value}_${i + 1}`
                  );
                  newSplits[index].columnNames = newColumnNames;
                  setSplits(newSplits);
                }}
                style={{ marginRight: "10px" }}
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
                style={{ marginRight: "10px" }}
              >
                <option value="">Select Delimiter</option>
                <option value=" ">Space</option>
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>Select number of delimiters to be split:</label>
              <input
                type="number"
                min="1"
                value={split.numDelimiters}
                onChange={(e) =>
                  handleSplitChange(index, "numDelimiters", e.target.value)
                }
                style={{ marginLeft: "10px" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "10px",
              }}
            >
              {Array.from(
                { length: parseInt(split.numDelimiters) + 1 },
                (_, i) => (
                  <div key={i} style={{ marginRight: "10px" }}>
                    <label>{`Column Name ${i + 1}:`}</label>
                    <input
                      type="text"
                      value={split.columnNames[i] || ""}
                      onChange={(e) => {
                        const newSplits = [...splits];
                        newSplits[index].columnNames[i] = e.target.value;
                        setSplits(newSplits);
                      }}
                      style={{ width: "100px" }}
                    />
                  </div>
                )
              )}
            </div>

            <button onClick={addSplit}>+</button>
          </div>
        ))}

      <br />

      <button onClick={handleSplit} disabled={!isSplitButtonEnabled()}>
        Convert
      </button>

      {showPreview && (
        <DataTable
          className="csv-data-table"
          title="Split Data Preview"
          columns={Object.keys(previewData[0] || {}).map((key) => ({
            label: key,
            key,
          }))}
          data={previewData}
          getRowId={(row, index) => index}
        />
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={true}
      />
    </div>
  );
};

export default Split;
