// Concatenate.js
import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "../styles/Concatenate.css";
import Papa from "papaparse";

const Concatenate = () => {
  const [datasets, setDatasets] = useState([]);
  const [dataset1, setDataset1] = useState("");
  const [columns1, setColumns1] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [delimiter, setDelimiter] = useState(",");
  const [finalColumnName, setFinalColumnName] = useState("");

  const userId = localStorage.getItem("userId");

  // Fetch the list of datasets for the user
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

  // Fetch columns from a selected dataset

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

  const fetchColumn = async (dataset, setColumn) => {
    const csv = await parseCsvFile(dataset.file);
    const columns = Object.keys(csv[0]);
    setColumns1(columns);
  };

  useEffect(() => {
    fetchDatasets(); // Fetch datasets on component mount
  }, []);

  const handleDatasetChange = (e) => {
    const selectedDatasetName = e.target.value;
    const selectedDataset = datasets.find(
      (dataset) => dataset.name === selectedDatasetName
    );

    setDataset1(selectedDatasetName);

    if (selectedDataset) {
      fetchColumn(selectedDataset);
      setSelectedColumns([]); // Clear selected columns when dataset changes
    }
  };

  const handleColumnSelect = (column) => {
    if (!selectedColumns.includes(column)) {
      setSelectedColumns([...selectedColumns, column]);
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
            delimiter,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(`File created successfully! New file ID: ${data.newFileId}`);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert("An error occurred while concatenating columns.");
    }
  };

  return (
    <div className="concatenate-container">
      <div className="title">Concatenate Columns</div>
      <div className="form-group">
        <select value={dataset1} onChange={handleDatasetChange}>
          <option value="">Select Dataset</option>
          {datasets.map((dataset, index) => (
            <option key={index} value={dataset.name}>
              {dataset.name}
            </option>
          ))}
        </select>

        <select onChange={(e) => handleColumnSelect(e.target.value)}>
          <option value="">Select Columns</option>
          {columns1
            .filter((col) => !selectedColumns.includes(col))
            .map((col, index) => (
              <option key={index} value={col}>
                {col}
              </option>
            ))}
        </select>

        <div className="selected-columns">
          {selectedColumns.map((column, index) => (
            <div key={index} className="selected-column">
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

        <button onClick={handleSubmit} disabled={selectedColumns.length === 0}>
          Concatenate
        </button>
      </div>
    </div>
  );
};

export default Concatenate;
