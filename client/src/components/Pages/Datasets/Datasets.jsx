// /src/components/Datasets/Datasets.js
import React, { useEffect, useState } from "react";
import DatasetTable from "./DatasetTable";
import DatasetModal from "./DatasetModal";
import UploadModal from "../../UI/UploadModal/UploadModal";
import styles from "./Datasets.module.css";
import { toast } from "sonner";

const Datasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

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
      setDatasets(data.data);
    } catch (error) {
      console.error("Error fetching datasets: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (datasetId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/dataset/${datasetId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        toast.success("Dataset deleted successfully!");
        fetchDatasets();
      } else {
        const result = await response.json();
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting dataset: ", error);
      alert("Failed to delete dataset.");
    }
  };

  const handleView = (dataset) => {
    setSelectedDataset(dataset);
  };

  const closeModal = () => {
    setSelectedDataset(null);
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

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const renameDataset = async (id, newName) => {
    // await axios.patch(`/api/dataset/${id}/rename`, { newName });
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/dataset/${id}/rename`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newName }),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to rename dataset");
      }
    } catch (error) {
      console.error("Error renaming dataset: ", error);
      toast.error("Failed to rename dataset.");
    }
    // refresh or optimistically update local state:
    setDatasets((prev) =>
      prev.map((d) => (d._id === id ? { ...d, name: newName } : d))
    );
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
      <DatasetTable
        datasets={datasets}
        isLoading={isLoading}
        searchTerm={searchTerm}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onView={handleView}
        onDelete={handleDelete}
        onRename={renameDataset}
      />
      {selectedDataset && (
        <DatasetModal dataset={selectedDataset} onClose={closeModal} />
      )}
    </div>
  );
};

export default Datasets;
