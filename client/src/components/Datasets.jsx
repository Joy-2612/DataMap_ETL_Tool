import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "../styles/Datasets.css"; // Import the CSS styles
import DataTable from "../components/DataTable/DataTable";
import UploadModal from "./UploadModal";
import { FaEye } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
const Datasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false); // For CSV viewing modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // For UploadModal

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCsvData, setSelectedCsvData] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchDatasets();
  }, []);

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

  // Handle viewing CSV data
  const handleView = async (dataset) => {
    setSelectedDataset(dataset);
    if (dataset.type === "text/csv") {
      // Fetch and parse the CSV file
      await parseCsvFile(dataset.file);
    }
    setIsModalOpen(true);
    setModalVisible(false);

    // Delay adding 'show' class to start animation
    setTimeout(() => {
      setModalVisible(true);
    }, 10);
  };

  const parseCsvFile = async (file) => {
    const uint8Array = new Uint8Array(file.data);
    const text = new TextDecoder("utf-8").decode(uint8Array);
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        setSelectedCsvData(result.data);
      },
      error: (error) => {
        console.error("Error parsing CSV: ", error);
      },
    });
  };

  const handleDelete = async (datasetId) => {
    try {
      await fetch(`http://localhost:5000/api/file/dataset/${datasetId}`, {
        method: "DELETE",
      });
      fetchDatasets(); // Refresh datasets after deletion
    } catch (error) {
      console.error("Error deleting dataset: ", error);
    }
  };

  // Handle closing the CSV viewing modal
  const handleCloseModal = () => {
    setModalVisible(false);
    // Wait for the animation to finish before hiding the modal
    setTimeout(() => {
      setIsModalOpen(false);
      setSelectedCsvData([]);
    }, 300); // Match this duration with the CSS transition time (0.3s)
  };

  // Handle opening the UploadModal
  const handleUploadModalOpen = () => {
    setIsUploadModalOpen(true);
  };

  // Handle closing the UploadModal
  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
  };

  // Handle successful upload
  const handleUploadSuccess = () => {
    fetchDatasets(); // Refresh datasets after upload
    setIsUploadModalOpen(false);
  };

  return (
    <div className="datasets-container">
      <div className="datasets-title">
        Your Datasets
        <button className="add-dataset-btn" onClick={handleUploadModalOpen}>
          + Add Dataset
        </button>
      </div>
      {/* UploadModal */}
      <UploadModal
        show={isUploadModalOpen}
        onClose={handleUploadModalClose}
        onUpload={handleUploadSuccess}
        userId={userId}
      />
      {isLoading ? (
        <p>Loading datasets...</p>
      ) : (
        <table className="datasets-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Size (bytes)</th>
              <th>Type</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {datasets.length > 0 ? (
              datasets.map((dataset, index) => (
                <tr key={index}>
                  <td>{dataset.name}</td>
                  <td>{dataset.size}</td>
                  <td>{dataset.type}</td>
                  <td>{new Date(dataset.createdAt).toLocaleString()}</td>
                  <td>
                    <FaEye
                      className="view-button"
                      onClick={() => handleView(dataset)}
                    />
                    <MdDelete
                      className="delete-button"
                      onClick={() => handleDelete(dataset.id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No datasets available</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {/* Modal for viewing CSV */}
      {isModalOpen && (
        <div
          className={`modal-overlay ${modalVisible ? "show" : ""}`}
          onClick={handleCloseModal}
        >
          <div
            className={`modal-content ${modalVisible ? "show" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="csv-modal-title">
              {selectedDataset.name}
              <IoMdClose
                className="close-modal-button"
                onClick={handleCloseModal}
              />
            </div>

            {selectedCsvData.length > 0 ? (
              <DataTable
                title="CSV Data"
                columns={Object.keys(selectedCsvData[0]).map((key) => ({
                  label: key,
                  key: key,
                }))}
                data={selectedCsvData}
                getRowId={(row, index) => index}
              />
            ) : (
              <p>No data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Datasets;
