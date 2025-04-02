import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import styles from "./Datasets.module.css";
import DataTable from "../../UI/DataTable/DataTable";
import UploadModal from "../../UI/UploadModal/UploadModal";
import { FaEye, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Datasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCsvData, setSelectedCsvData] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    filterAndSortDatasets();
  }, [searchTerm, datasets, sortBy, sortOrder]);

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

  const filterAndSortDatasets = () => {
    let filtered = datasets.filter(
      (dataset) =>
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dataset.description &&
          dataset.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortBy) {
      filtered.sort((a, b) => {
        let valueA, valueB;
        switch (sortBy) {
          case "date":
            valueA = new Date(a.createdAt);
            valueB = new Date(b.createdAt);
            break;
          case "size":
            valueA = a.size;
            valueB = b.size;
            break;
          default:
            valueA = a[sortBy]?.toLowerCase();
            valueB = b[sortBy]?.toLowerCase();
        }

        if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
        if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredDatasets(filtered);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <FaSort />;
    return sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  const handleView = async (dataset) => {
    setSelectedDataset(dataset);
    if (dataset.type === "text/csv") {
      await parseCsvFile(dataset.file);
    }
    setIsModalOpen(true);
    setModalVisible(false);

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
        console.log("Parsed CSV data:", result.data);
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
    setTimeout(() => {
      setIsModalOpen(false);
      setSelectedCsvData([]);
    }, 300);
  };

  const handleUploadModalOpen = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
  };

  const handleUploadSuccess = () => {
    fetchDatasets();
    setIsUploadModalOpen(false);
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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          Your Datasets
          <button
            className={styles.addDatasetButton}
            onClick={handleUploadModalOpen}
          >
            + Add Dataset
          </button>
        </div>
        <div className={styles.searchContainer}>
          <FaSearch />
          <input
            type="text"
            placeholder="Search datasets..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <UploadModal
        show={isUploadModalOpen}
        onClose={handleUploadModalClose}
        onUpload={handleUploadSuccess}
        userId={userId}
      />

      {isLoading ? (
        <p>Loading datasets...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("name")}
              >
                Name {getSortIcon("name")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("size")}
              >
                Size (bytes) {getSortIcon("size")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("type")}
              >
                Type {getSortIcon("type")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("date")}
              >
                Date Created {getSortIcon("date")}
              </th>
              <th className={styles.tableHeader}>Actions</th>
              <th className={styles.tableHeader}>Export</th>
            </tr>
          </thead>
          <tbody>
            {filteredDatasets?.length > 0 ? (
              filteredDatasets?.map((dataset, index) => (
                <tr key={index} className={styles.tableRow}>
                  <td className={styles.tableData}>
                    <div className={styles.datasetName}>{dataset.name}</div>
                    {dataset.description && (
                      <div className={styles.datasetDescription}>
                        {dataset.description}
                      </div>
                    )}
                  </td>
                  <td className={styles.tableData}>{dataset.size}</td>
                  <td className={styles.tableData}>{dataset.type}</td>
                  <td className={styles.tableData}>
                    {new Date(dataset.createdAt).toLocaleString()}
                  </td>
                  <td className={styles.tableData}>
                    <FaEye
                      className={`${styles.iconButton} ${styles.viewButton}`}
                      onClick={() => handleView(dataset)}
                    />
                    <MdDelete
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                      onClick={() => handleDelete(dataset._id)}
                    />
                  </td>
                  <td className={styles.tableData}>
                    <button
                      className={`${styles.exportButton} ${styles.exportCsv}`}
                      onClick={() => exportAsCsv(dataset)}
                    >
                      CSV
                    </button>
                    <button
                      className={`${styles.exportButton} ${styles.exportPdf}`}
                      onClick={() => exportAsPdf(dataset)}
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles.tableData}>
                  No datasets available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <div
          className={`${styles.modalOverlay} ${
            modalVisible ? styles.modalOverlayVisible : ""
          }`}
          onClick={handleCloseModal}
        >
          <div
            className={`${styles.modalContent} ${
              modalVisible ? styles.modalContentVisible : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTitle}>
              {selectedDataset.name}
              <IoMdClose
                className={styles.closeButton}
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
