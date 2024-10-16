// Merge.js
import React, { useState } from "react";
import "../styles/Merge.css";

const Merge = ({ datasets, fetchColumn }) => {
  const [dataset1, setDataset1] = useState("");
  const [dataset2, setDataset2] = useState("");
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]);

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/file/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset1,
          dataset2,
          column1: columns1[0],
          column2: columns2[0],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Datasets merged successfully! New file ID: ${data.newFileId}`);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert("An error occurred while merging datasets.");
    }
  };

  return (
    <div className="merge-container">
      <h2>Merge Datasets</h2>
      <div className="form-group">
        <select
          value={dataset1}
          onChange={(e) => {
            setDataset1(e.target.value);
            fetchColumn(e.target.value, setColumns1);
          }}
        >
          <option value="">Select Dataset 1</option>
          {datasets?.map((dataset, index) => (
            <option key={index} value={dataset.name}>
              {dataset.name}
            </option>
          ))}
        </select>

        <select
          value={dataset2}
          onChange={(e) => {
            setDataset2(e.target.value);
            fetchColumn(e.target.value, setColumns2);
          }}
        >
          <option value="">Select Dataset 2</option>
          {datasets?.map((dataset, index) => (
            <option key={index} value={dataset.name}>
              {dataset.name}
            </option>
          ))}
        </select>

        <button onClick={handleSubmit} disabled={!dataset1 || !dataset2}>
          Merge
        </button>
      </div>
    </div>
  );
};

export default Merge;
