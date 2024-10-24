import React, { useState, useEffect } from "react";
import "../styles/Standardize.css"; // Modern CSS styling
import Papa from "papaparse"; // Import the PapaParse library

const Standardize = () => {
  // State variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");
  const [description, setDescription] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [mappings, setMappings] = useState([{ before: "", after: "" }]);
  const [csvData, setCsvData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState([]);

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
      const uniqueVals = [...new Set(values)];
      setUniqueValues(uniqueVals);
    } else {
      setUniqueValues([]);
    }
  }, [selectedColumn, csvData]);

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
            outputFileName: outputFileName,
            description: description,
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
    <div>
      {/* Modal for Output File Name and Description */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content-standardize">
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
              <button
                className="submit-button"
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
                className="cancel-button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
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
              <select
                value={mapping.before}
                onChange={(e) =>
                  handleMappingChange(index, "before", e.target.value)
                }
              >
                <option value="">Select a value</option>
                {uniqueValues.map((value, idx) => (
                  <option key={idx} value={value}>
                    {value}
                  </option>
                ))}
              </select>
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
          <button
            className="submit-button"
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
