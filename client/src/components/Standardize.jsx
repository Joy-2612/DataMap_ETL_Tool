import React, { useState, useEffect } from "react";
import "../styles/Standardize.css"; // Modern CSS styling
import Papa from "papaparse"; // Import the PapaParse library

const Standardize = () => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [mappings, setMappings] = useState([{ before: "", after: "" }]);

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

  // Fetch datasets from the backend
  const fetchDatasets = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/datasets/${userId}`
      );
      const data = await response.json();
      setDatasets(data.data);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  // Fetch columns for the selected dataset
  const fetchColumns = async (dataset) => {
    const csv = await parseCsvFile(dataset.file);
    const columns = Object.keys(csv[0]);
    setColumns(columns);
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleAddMapping = () => {
    setMappings([...mappings, { before: "", after: "" }]);
  };

  const handleMappingChange = (index, field, value) => {
    const updatedMappings = [...mappings];
    updatedMappings[index][field] = value;
    setMappings(updatedMappings);
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
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert("Standardization mappings submitted successfully!");
        console.log("Response:", result);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error submitting mappings:", error);
      alert("Failed to submit standardization mappings.");
    }
  };

  return (
    <div className="standardize-container">
      <h1 className="title">Standardize Data</h1>

      <div className="form-group">
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
        <div className="form-group">
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

      <div className="mappings-container">
        <h2>Mappings</h2>
        {mappings.map((mapping, index) => (
          <div key={index} className="mapping-row">
            <input
              type="text"
              placeholder="Before"
              value={mapping.before}
              onChange={(e) =>
                handleMappingChange(index, "before", e.target.value)
              }
            />
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

      <div className="button-group">
        <button className="add-button" onClick={handleAddMapping}>
          + Add More
        </button>
        <button className="submit-button" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default Standardize;
