// Dashboard.js
import React, { useState } from "react";
import MultiStepForm from "./MultiStepForm"; // Import the MultiStepForm component
import "../styles/Dashboard.css";
import { FaCodeMerge } from "react-icons/fa6";
import { MdKeyboardArrowLeft } from "react-icons/md";

const Dashboard = ({ datasets }) => {
  // Accept datasets as a prop
  const [isMapFormOpen, setMapFormOpen] = useState(false); // State for MultiStepForm

  const handleOpenMapForm = () => {
    setMapFormOpen(true);
  };

  const handleCloseMapForm = () => {
    setMapFormOpen(false);
  };

  return isMapFormOpen ? (
    <div className="dashboard">
      <div className="dataset-details-button">
        <MdKeyboardArrowLeft />
        <h3 onClick={handleCloseMapForm}>Back to Dashboard</h3>
      </div>
      <MultiStepForm datasets={datasets} onClose={handleCloseMapForm} />
    </div>
  ) : (
    <div className="dashboard-container">
      <h1>Welcome to the Dashboard</h1>
      {/* Add Map Dataset button */}
      <div className="actions-container" onClick={handleOpenMapForm}>
        <div className="action">
          <div className="action-icon">
            <FaCodeMerge />
          </div>
          <div className="action-details">
            <h2>Map Dataset</h2>
            <p>Combine two datasets based on a common column</p>
          </div>
        </div>
      </div>

      {/* Render MultiStepForm conditionally */}
    </div>
  );
};

export default Dashboard;
