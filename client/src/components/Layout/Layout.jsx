import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "../Pages/Dashboard/Dashboard";
import Sidebar from "./Sidebar/Sidebar";
import UploadModal from "../UI/UploadModal/UploadModal";
import DataTable from "../UI/DataTable/DataTable";
import { MdKeyboardArrowLeft } from "react-icons/md";
import styles from "./Layout.module.css";
import Navbar from "./Navbar/Navbar";
import Datasets from "../Pages/Datasets/Datasets";
import FlowDiagrams from "../Pages/FlowDiagrams/FlowDiagrams";
import { Route, Routes, useLocation } from "react-router-dom";
import Results from "../Pages/Results/Results";
import Standardize from "../Features/Standardize/Standardize";
import Concatenate from "../Features/Concatenate/Concatenate";
import Convert from "../Features/Convert/Convert";
import ConvertBack from "../Features/ConvertBack/ConvertBack";
import Merge from "../Features/Merge/Merge";
import Split from "../Features/Split/Split";
import AI from "../Features/AI/AI";

const Layout = () => {
  const [datasets, setDatasets] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const userId = localStorage.getItem("userId");
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleCloseModal = () => {
    fetchDatasets();
    setModalOpen(false);
  };

  const fetchDatasets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/alldatasets/${userId}`
      );
      const data = await response.json();
      setDatasets(data.data);
    } catch (error) {
      console.error("Error fetching datasets: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDataset = (file) => {
    fetchDatasets();
  };

  const handleSelectDataset = (dataset) => {
    setSelectedDataset(dataset);
    if (dataset.type === "text/csv") {
      parseCsvFile(dataset.file);
    } else {
      setCsvData([]);
    }
  };

  const parseCsvFile = async (file) => {
    const uint8Array = new Uint8Array(file.data);
    const text = new TextDecoder("utf-8").decode(uint8Array);
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        setCsvData(result.data);
      },
      error: (error) => {
        console.error("Error parsing CSV: ", error);
      },
    });
  };

  const handleClearSelection = () => {
    setSelectedDataset(null);
    setCsvData([]);
  };

  return (
    <div className={styles.container}>
      <Sidebar
        datasets={datasets}
        onSelectDataset={handleSelectDataset}
        isLoading={isLoading}
      />
      <div className={styles.mainContent}>
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/ai"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <AI />
                </motion.div>
              }
            />
            <Route
              path="/datasets"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Datasets />
                </motion.div>
              }
            />
            <Route
              path="/history"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Results />
                </motion.div>
              }
            />
            <Route
              path="/flow-diagrams"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <FlowDiagrams/>
                </motion.div>
              }
            />
            <Route
              path="/standardize"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Standardize />
                </motion.div>
              }
            />
            <Route
              path="/concatenate"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Concatenate />
                </motion.div>
              }
            />
            <Route
              path="/convert"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Convert />
                </motion.div>
              }
            />
            <Route
              path="/convertback"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ConvertBack />
                </motion.div>
              }
            />
            <Route
              path="/split"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Split />
                </motion.div>
              }
            />
            <Route
              path="/merge"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Merge />
                </motion.div>
              }
            />
            <Route
              path="/dashboard"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {selectedDataset ? (
                    <div className={styles.datasetDetailsContainer}>
                      <div className={styles.datasetDetails}>
                        <div className={styles.datasetDetailsButton}>
                          <MdKeyboardArrowLeft />
                          <h3 onClick={handleClearSelection}>
                            Back to Dashboard
                          </h3>
                        </div>
                        {selectedDataset.type === "text/csv" ? (
                          <>
                            <h2>CSV Dataset Details</h2>
                            <div className={styles.datasetTable}>
                              {Array.isArray(csvData) && csvData.length > 0 ? (
                                <DataTable
                                  title="CSV Data"
                                  columns={Object.keys(csvData[0]).map(
                                    (key) => ({
                                      label: key,
                                      key: key,
                                    })
                                  )}
                                  data={csvData}
                                  getRowId={(row, index) => index}
                                />
                              ) : (
                                <p>No data available in the CSV.</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <h2>Dataset Details</h2>
                            <p>
                              <strong>Name:</strong> {selectedDataset.name}
                            </p>
                            <p>
                              <strong>Size:</strong> {selectedDataset.size}{" "}
                              bytes
                            </p>
                            <p>
                              <strong>Type:</strong> {selectedDataset.type}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Dashboard datasets={datasets} />
                  )}
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
      <UploadModal
        show={isModalOpen}
        onClose={handleCloseModal}
        onUpload={handleUploadDataset}
        userId={userId}
      />
    </div>
  );
};

export default Layout;
