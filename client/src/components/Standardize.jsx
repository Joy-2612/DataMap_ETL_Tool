import React, { useState, useEffect } from "react";
import "../styles/Standardize.css"; // Modern CSS styling
import Papa from "papaparse"; // Import the PapaParse library

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
        `http://localhost:5000/api/file/datasets/${userId}`
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
      const uniqueVals = [...new Set(values)];
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

  const handleSelectChange = (index, selectedValue) => {
    const updatedMappings = [...mappings];
    const currentMapping = updatedMappings[index];

    if (!currentMapping.before.includes(selectedValue)) {
      currentMapping.before.push(selectedValue);
      const updatedGlobalSelectedValues = new Set(globalSelectedValues);
      updatedMappings.forEach((mapping) =>
        mapping.before.forEach((value) =>
          updatedGlobalSelectedValues.add(value)
        )
      );
      setGlobalSelectedValues([...updatedGlobalSelectedValues]);
    }

    setMappings(updatedMappings);
  };

  const handleRemoveSelection = (index, valueToRemove) => {
    const updatedMappings = [...mappings];
    const currentMapping = updatedMappings[index];
    currentMapping.before = currentMapping.before.filter(
      (value) => value !== valueToRemove
    );

    const updatedGlobalSelectedValues = new Set();
    updatedMappings.forEach((mapping) =>
      mapping.before.forEach((value) => updatedGlobalSelectedValues.add(value))
    );
    setGlobalSelectedValues([...updatedGlobalSelectedValues]);

    setMappings(updatedMappings);
  };

  const getFilteredValues = () => {
    // Return only values that are not selected in any mapping
    return uniqueValues.filter(
      (value) => !globalSelectedValues.includes(value)
    );
  };

  const handleModalClose = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
    }, 300); // Animation duration should match CSS
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
    } finally {
      setIsModalOpen(false);
      setOutputFileName("");
      setDescription("");
    }
  };

  return (
    <div>
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
              <button className="submit-button" onClick={handleSubmit}>
                Submit
              </button>
              <button className="cancel-button" onClick={handleModalClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

        {selectedDataset && (
          <div className="mappings-container">
            <h2>Mappings</h2>
            {mappings.map((mapping, index) => (
              <div key={index} className="mapping-row">
                <div className="multi-select">
                  <div>
                    {uniqueValues.length > 0 && (
                      <select
                        onChange={(e) =>
                          handleSelectChange(index, e.target.value)
                        }
                        value=""
                      >
                        <option value="">Select a value</option>
                        {getFilteredValues().map((value, idx) => (
                          <option key={idx} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
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
                <div className="selected-values">
                  {mapping.before.map((value, idx) => (
                    <span
                      key={idx}
                      className="selected-value"
                      onClick={() => handleRemoveSelection(index, value)}
                    >
                      {value} &times;
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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
