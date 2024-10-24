import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "../styles/Datasets.css"; // Import the CSS styles
import DataTable from "../components/DataTable/DataTable";
import { FaEye } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

const History = () => {
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        `http://localhost:5000/api/file/results/${userId}`
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
    console.log("Deleting dataset with ID:", datasetId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/dataset/${datasetId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Dataset deleted successfully!");
        fetchDatasets(); // Refresh the dataset list
      } else {
        const result = await response.json();
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting dataset: ", error);
      alert("Failed to delete dataset.");
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    // Wait for the animation to finish before hiding the modal
    setTimeout(() => {
      setIsModalOpen(false);
      setSelectedCsvData([]);
    }, 300); // Match this duration with the CSS transition time (0.3s)
  };

  const exportAsCsv = async (dataset) => {
    await parseCsvFile(dataset.file);
    const csvData = Papa.unparse(selectedCsvData);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${dataset.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAsPdf = async (dataset) => {
    const doc = new jsPDF();
    console.log("dataset : ", dataset);
    await parseCsvFile(dataset.file);

    doc.text(dataset.name, 10, 10);
    doc.autoTable({
      head: [Object.keys(selectedCsvData[0] || {})],
      body: selectedCsvData.map((row) => Object.values(row)),
    });
    doc.save(`${dataset.name}.pdf`);
  };

  return (
    <div className="datasets-container">
      <h2 className="datasets-title">Your Datasets</h2>
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
              <th>Export</th>
            </tr>
          </thead>
          <tbody>
            {datasets.length > 0 ? (
              datasets.map((dataset, index) => (
                <tr key={index}>
                  <td>
                    {dataset.name}
                    <div className="dataset-description">
                      {dataset.description}
                    </div>
                  </td>
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
                      onClick={() => handleDelete(dataset._id)}
                    />
                  </td>
                  <td>
                    <button
                      className="export-csv-btn"
                      onClick={() => exportAsCsv(dataset)}
                    >
                      CSV
                    </button>
                    <button
                      className="export-pdf-btn"
                      onClick={() => exportAsPdf(dataset)}
                    >
                      PDF
                    </button>
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

export default History;
