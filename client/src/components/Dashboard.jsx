import React, { useState } from "react";
import styles from "../styles/Dashboard.module.css";
import { FaCodeMerge } from "react-icons/fa6";
import { IoMdAddCircleOutline } from "react-icons/io";
import { PiApproximateEqualsBold } from "react-icons/pi";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { FaArrowRightLong } from "react-icons/fa6";
import { BiTransfer, BiTransferAlt } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { MdOutlineVerticalSplit } from "react-icons/md";

const Dashboard = ({ datasets }) => {
  const navigate = useNavigate();
  const [isMapFormOpen, setMapFormOpen] = useState(false);

  const handleOpenMapForm = () => {
    setMapFormOpen(true);
  };

  const handleCloseMapForm = () => {
    setMapFormOpen(false);
  };

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
    <div className={styles.container}>
      <div className={styles.featureCardsContainer}>
        <div
          className={`${styles.featureCard} ${styles.cardBlue}`}
          onClick={handleNavigateToMerge}
        >
          <div className={styles.featureIcon}>
            <FaCodeMerge />
          </div>
          <div className={styles.featureDetails}>
            <h2>Merge</h2>
            <p>
              Merge two datasets based on a common column to create a new
              dataset
            </p>
          </div>
          <div className={styles.continue}>
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>

        <div
          className={`${styles.featureCard} ${styles.cardGreen}`}
          onClick={handleNavigateToConcatenate}
        >
          <div className={styles.featureIcon}>
            <IoMdAddCircleOutline />
          </div>
          <div className={styles.featureDetails}>
            <h2>Concatenate</h2>
            <p>
              Concatenate the columns of a dataset based on a delimiter to
              create a new column
            </p>
          </div>
          <div className={styles.continue}>
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>

        <div
          className={`${styles.featureCard} ${styles.cardOrange}`}
          onClick={handleNavigateToStandardize}
        >
          <div className={styles.featureIcon}>
            <PiApproximateEqualsBold />
          </div>
          <div className={styles.featureDetails}>
            <h2>Standardize</h2>
            <p>
              Standardize the columns of a dataset based on a set of rules and
              mappings to ensure consistency
            </p>
          </div>
          <div className={styles.continue}>
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>

        <div
          className={`${styles.featureCard} ${styles.cardPurple}`}
          onClick={handleNavigateToConvert}
        >
          <div className={styles.featureIcon}>
            <BiTransfer />
          </div>
          <div className={styles.featureDetails}>
            <h2>Convert To CSV</h2>
            <p>
              Easily transform datasets from formats like XML and JSON into CSV
            </p>
          </div>
          <div className={styles.continue}>
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>

        <div
          className={`${styles.featureCard} ${styles.cardRed}`}
          onClick={handleNavigateToConvertBack}
        >
          <div className={styles.featureIcon}>
            <BiTransferAlt />
          </div>
          <div className={styles.featureDetails}>
            <h2>Convert to XML or JSON</h2>
            <p>Easily transform datasets from CSV to XML or JSON</p>
          </div>
          <div className={styles.continue}>
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>

        <div
          className={`${styles.featureCard} ${styles.cardPink}`}
          onClick={handleNavigateToSplit}
        >
          <div className={styles.featureIcon}>
            <MdOutlineVerticalSplit />
          </div>
          <div className={styles.featureDetails}>
            <h2>Split</h2>
            <p>Split the columns of a dataset based on a delimiter</p>
          </div>
          <div className={styles.continue}>
            <h3>Continue</h3>
            <FaArrowRightLong />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
