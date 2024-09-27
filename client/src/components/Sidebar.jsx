// Sidebar.js
import React from "react";
import "../styles/Sidebar.css";

const Sidebar = ({ onAddDataset, datasets, onSelectDataset, isLoading }) => {
  console.log("Rendering Sidebar with datasets:", datasets);
  return (
    <div className="sidebar">
      <button className="add-dataset-btn" onClick={onAddDataset}>
        + Add Dataset
      </button>
      <p>Your Datasets</p>
      {isLoading ? (
        <p>Loading datasets...</p>
      ) : datasets && datasets.length > 0 ? (
        datasets.map((dataset, index) => (
          <div
            className="dataset"
            key={index}
            onClick={() => onSelectDataset(dataset)}
          >
            <p className="dataset-name">{dataset.name}</p>
            <p className="dataset-bytes">{dataset.size} bytes</p>
          </div>
        ))
      ) : (
        <p>No datasets uploaded yet.</p>
      )}
    </div>
  );
};

export default Sidebar;
