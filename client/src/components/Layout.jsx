import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./Dashboard";
import Sidebar from "./Sidebar";
import UploadModal from "./UploadModal";
import DataTable from "../components/DataTable/DataTable";
import { MdKeyboardArrowLeft } from "react-icons/md";
import "../styles/Layout.css";
import Navbar from "./Navbar";
import Datasets from "./Datasets";
import { Route, Routes, useLocation } from "react-router-dom";
import History from "./History";
import Standardize from "./Standardize";
import Concatenate from "./Concatenate";
import Convert from "./Convert";
import ConvertBack from "./ConvertBack";
import Merge from "./Merge";
import Split from "./Split";

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
        `http://localhost:5000/api/file/datasets/${userId}`
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
    <div className="layout-container">
      <Sidebar
        datasets={datasets}
        onSelectDataset={handleSelectDataset}
        isLoading={isLoading}
      />
      <div className="main-content">
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
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
                  <History />
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
                    <div className="dataset-details-container">
                      <div className="dataset-details">
                        <div className="dataset-details-button">
                          <MdKeyboardArrowLeft />
                          <h3 onClick={handleClearSelection}>
                            Back to Dashboard
                          </h3>
                        </div>
                        {selectedDataset.type === "text/csv" ? (
                          <>
                            <h2>CSV Dataset Details</h2>
                            <div className="dataset-table">
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
