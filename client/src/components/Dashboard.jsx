import React, { useState } from "react";
import MultiStepForm from "./MultiStepForm"; // Import the MultiStepForm component
import "../styles/Dashboard.css";
import { FaCodeMerge } from "react-icons/fa6";
import { IoMdAddCircleOutline } from "react-icons/io";
import { PiApproximateEqualsBold } from "react-icons/pi";
import { MdKeyboardArrowLeft } from "react-icons/md";
import {FaArrowRightLong} from "react-icons/fa6";
import {BiTransfer,BiTransferAlt} from "react-icons/bi";
import { useNavigate } from 'react-router-dom';
import { MdOutlineVerticalSplit } from 'react-icons/md';


const Dashboard = ({ datasets }) => {
  const navigate = useNavigate();


  // Accept datasets as a prop
  const [isMapFormOpen, setMapFormOpen] = useState(false); // State for MultiStepForm

  const handleOpenMapForm = () => {
    setMapFormOpen(true);
  };

  const handleCloseMapForm = () => {
    setMapFormOpen(false);
  };

  // Navigate to the respective routes
  const handleNavigateToStandardize = () => {
    navigate("/home/standardize");
  };
  const handleNavigateToMerge = () => {
    navigate("/home/merge");
  };
  const handleNavigateToConcatenate = () => {
    navigate("/home/concatenate");
  };

  const handleNavigateToConvert = () => {
    navigate("/home/convert");
  };
  const handleNavigateToConvertBack = () => {
    navigate("/home/convertback");
  };
  const handleNavigateToSplit = () => {
    navigate("/home/split");
  };

  return (
    <div className="dashboard-container">
      <div className="feature-cards-container">
        <div className="feature-card card-blue" onClick={handleNavigateToMerge}>
          <div className="feature-icon">
            <FaCodeMerge />
          </div>
          <div className="feature-details">
            <h2>Merge</h2>
            <p>
              Merge two datasets based on a common column to create a new
              dataset
            </p>
          </div>
          <div className="continue">
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>

        <div
          className="feature-card card-green"
          onClick={handleNavigateToConcatenate}
        >
          <div className="feature-icon">
            <IoMdAddCircleOutline />
          </div>
          <div className="feature-details">
            <h2>Concatenate</h2>
            <p>
              Concatenate the columns of a dataset based on a delimiter to
              create a new column
            </p>
          </div>
          <div className="continue">
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>

        <div
          className="feature-card card-orange"
          onClick={handleNavigateToStandardize}
        >
          <div className="feature-icon">
            <PiApproximateEqualsBold />
          </div>
          <div className="feature-details">
            <h2>Standardize</h2>
            <p>
              Standardize the columns of a dataset based on a set of rules and
              mappings to ensure consistency
            </p>
          </div>
          <div className="continue">
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>

        {/* New Convert Dataset Feature Card */}
        <div
          className="feature-card card-purple"
          onClick={handleNavigateToConvert}
        >
          <div className="feature-icon">
            <BiTransfer />
          </div>
          <div className="feature-details">
            <h2>Convert To CSV</h2>
            <p>
              Easily transform datasets from formats like XML and JSON into CSV
            </p>
          </div>
          <div className="continue">
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>

      {/* // 5th convert back to xml or JSON */}
      <div
          className="feature-card card-red"
          onClick={handleNavigateToConvertBack}
        >
          <div className="feature-icon">
            <BiTransferAlt />
          </div>
          <div className="feature-details">
            <h2>Convert to XML or JSON</h2>
            <p>
              Easily transform datasets from CSV to XML or JSON            </p>
          </div>
          <div className="continue">
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>


        {/* // 6th convert back to xml or JSON */}
      <div
          className="feature-card card-pink"
          onClick={handleNavigateToSplit}
        >
          <div className="feature-icon">
            <MdOutlineVerticalSplit/>
          </div>
          <div className="feature-details">
            <h2>Split</h2>
            <p>
            Easily transform datasets from CSV to XML or JSON </p>
          </div>
          <div className="continue">
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>




      </div>
    </div>
  );
};

export default Dashboard;
