// Layout.js
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import Dashboard from "./Dashboard";
import Sidebar from "./Sidebar";
import UploadModal from "./UploadModal";
import DataTable from "../components/DataTable/DataTable";
import { MdKeyboardArrowLeft } from "react-icons/md";
import "../styles/Layout.css";

const Layout = () => {
  const [datasets, setDatasets] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const userId = localStorage.getItem("userId");
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleAddDataset = () => {
    setModalOpen(true);
  };

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

      console.log("Fetched datasets:", data);
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
    console.log("Selected dataset:", dataset);
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
    console.log("Parsing CSV file:", text);
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        console.log("Parsed CSV data:", result.data);
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
        onAddDataset={handleAddDataset}
        datasets={datasets}
        onSelectDataset={handleSelectDataset}
        isLoading={isLoading}
      />
      <div className="main-content">
        {selectedDataset ? (
          <div className="dataset-details-container">
            <div className="dataset-details">
              <div className="dataset-details-button">
                <MdKeyboardArrowLeft />
                <h3 onClick={handleClearSelection}>Back to Dashboard</h3>
              </div>
              {selectedDataset.type === "text/csv" ? (
                <>
                  <h2>CSV Dataset Details</h2>
                  <div className="dataset-table">
                    {Array.isArray(csvData) && csvData.length > 0 ? (
                      <DataTable
                        title="CSV Data"
                        columns={Object.keys(csvData[0]).map((key) => ({
                          label: key,
                          key: key,
                        }))}
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
                    <strong>Size:</strong> {selectedDataset.size} bytes
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