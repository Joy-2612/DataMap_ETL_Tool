import React, { useState, useEffect } from "react";
import "../styles/Merge.css";
import Papa from "papaparse";

const Merge = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");
  const [description, setDescription] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [dataset1, setDataset1] = useState(null);
  const [dataset2, setDataset2] = useState(null);
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]);
  const [selectedColumn1, setSelectedColumn1] = useState("");
  const [selectedColumn2, setSelectedColumn2] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const userId = localStorage.getItem("userId");

  // Fetch datasets when the component mounts
  useEffect(() => {
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

    fetchDatasets();
  }, []);

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

  const handleDataset1Change = (e) => {
    const selectedDataset = e.target.value;
    setDataset1(selectedDataset);
    setColumns1([]); // Reset columns on dataset change
    fetchColumns(selectedDataset, setColumns1);
  };

  const handleDataset2Change = (e) => {
    const selectedDataset = e.target.value;
    setDataset2(selectedDataset);
    setColumns2([]); // Reset columns on dataset change
    fetchColumns(selectedDataset, setColumns2);
  };

  const handleSubmit = async () => {
    if (!selectedColumn1 || !selectedColumn2) {
      alert("Please select columns from both datasets.");
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
          dataset1,
          dataset2,
          column1: selectedColumn1,
          column2: selectedColumn2,
          outputFileName: outputFileName,
          description: description,
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        alert(`Datasets merged successfully! New file ID: ${data.newFileId}`);
        setDataset1(null);
        setDataset2(null);
        setColumns1([]);
        setColumns2([]);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      setIsLoading(false);
      alert("An error occurred while merging datasets.");
    }
  };

  return (
    <div>
      {isModalOpen && (
        <div className="modal">
          <div className="desc-modal-content">
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

      <div className="merge-container">
        <h2>Merge Datasets</h2>
        <div className="form-group">
          <div className="merge-input">
            <select value={dataset1 || ""} onChange={handleDataset1Change}>
              <option value="">Select Dataset 1</option>
              {datasets.map((dataset, index) => (
                <option key={index} value={dataset.name}>
                  {dataset.name}
                </option>
              ))}
            </select>

            {columns1.length > 0 && (
              <select
                value={selectedColumn1}
                onChange={(e) => setSelectedColumn1(e.target.value)}
              >
                <option value="">Select Column from Dataset 1</option>
                {columns1.map((col, index) => (
                  <option key={index} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="merge-input">
            <select value={dataset2 || ""} onChange={handleDataset2Change}>
              <option value="">Select Dataset 2</option>
              {datasets
                .filter((dataset) => dataset.name !== dataset1)
                .map((dataset, index) => (
                  <option key={index} value={dataset.name}>
                    {dataset.name}
                  </option>
                ))}
            </select>

            {columns2.length > 0 && (
              <select
                value={selectedColumn2}
                onChange={(e) => setSelectedColumn2(e.target.value)}
              >
                <option value="">Select Column from Dataset 2</option>
                {columns2.map((col, index) => (
                  <option key={index} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
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
      </div>
    </div>
  );
};

export default Merge;
