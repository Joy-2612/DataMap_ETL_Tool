import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import "../styles/Merge.css";

const Merge = ({ fetchColumn }) => {
  const [datasets, setDatasets] = useState([]); // Store datasets
  const [dataset1, setDataset1] = useState("");
  const [dataset2, setDataset2] = useState("");
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true); // Track API fetching status

  // Fetch datasets from the API when the component mounts
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/file/datasets");
        const data = await response.json();

        if (response.ok) {
          setDatasets(data.data); // Assuming `data.data` contains the list of datasets
        } else {
          alert(`Error fetching datasets: ${data.message}`);
        }
      } catch (error) {
        console.error("Error fetching datasets:", error);
        toast.error("An error occurred while fetching datasets.");
      } finally {
        setIsFetching(false); // Stop fetching indicator
      }
    };

    fetchDatasets();
  }, []);

  // Reset columns when datasets change
  useEffect(() => {
    if (!dataset1) setColumns1([]);
    if (!dataset2) setColumns2([]);
  }, [dataset1, dataset2]);

  const handleSubmit = async () => {
    try {
      setIsLoading(true); // Start loading indicator

      const response = await fetch("http://localhost:5000/api/file/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset1,
          dataset2,
          column1: columns1[0], // Assuming only one column is selected for now
          column2: columns2[0],
        }),
      });

      const data = await response.json();
      setIsLoading(false); // Stop loading

      if (response.ok) {
        alert(`Datasets merged successfully! New file ID: ${data.newFileId}`);
        // Reset state after successful merge
        setDataset1("");
        setDataset2("");
        setColumns1([]);
        setColumns2([]);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      setIsLoading(false); // Stop loading on error
      alert("An error occurred while merging datasets.");
    }
  };

  // Filter out already selected datasets
  const availableDatasets = datasets.filter(
    (dataset) => dataset.name !== dataset1 && dataset.name !== dataset2
  );

  if (isFetching) {
    return <div>Loading datasets...</div>; // Show a loading indicator while fetching datasets
  }

  return (
    <div className="merge-container">
      <h2>Merge Datasets</h2>
      <div className="form-group">
        <select
          value={dataset1}
          onChange={(e) => {
            const selectedDataset = e.target.value;
            setDataset1(selectedDataset);
            fetchColumn(selectedDataset, setColumns1); // Fetch columns for dataset 1
          }}
        >
          <option value="">Select Dataset 1</option>
          {datasets.map((dataset, index) => (
            <option key={index} value={dataset.name}>
              {dataset.name}
            </option>
          ))}
        </select>

        <select
          value={dataset2}
          onChange={(e) => {
            const selectedDataset = e.target.value;
            setDataset2(selectedDataset);
            fetchColumn(selectedDataset, setColumns2); // Fetch columns for dataset 2
          }}
        >
          <option value="">Select Dataset 2</option>
          {availableDatasets.map((dataset, index) => (
            <option key={index} value={dataset.name}>
              {dataset.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          disabled={
            !dataset1 ||
            !dataset2 ||
            columns1.length === 0 ||
            columns2.length === 0 ||
            isLoading
          }
        >
          {isLoading ? "Merging..." : "Merge"}
        </button>
      </div>
    </div>
  );
};

export default Merge;
