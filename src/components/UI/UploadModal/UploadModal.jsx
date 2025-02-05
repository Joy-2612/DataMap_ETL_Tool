import React, { useState } from "react";
import styles from "./UploadModal.module.css";
import { toast } from "sonner";
import { AiOutlineClose } from "react-icons/ai";
import { PiFilesFill } from "react-icons/pi";

const UploadModal = ({ show, onClose, onUpload, userId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userId", userId);

      try {
        const response = await fetch("http://localhost:5000/api/file/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          toast.success("File uploaded successfully");
          onUpload(selectedFile);
          setSelectedFile(null);
          onClose();
        } else {
          const data = await response.json();
          toast.error(data.message || "Failed to upload file");
        }
      } catch (error) {
        toast.error("An error occurred during file upload");
        console.error("File upload error:", error);
      }
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <button className={styles.closeButton} onClick={onClose}>
          <AiOutlineClose size={20} />
        </button>

        <h2 className={styles.title}>Upload Dataset</h2>

        <div
          className={`${styles.dragDropArea} ${
            dragActive ? styles.activeDrag : ""
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <p className={styles.fileIcon}>
            <PiFilesFill />
          </p>
          <p className={styles.dragDropText}>
            Drag and drop your CSV file here, or click to select a file
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          {selectedFile && <p>Selected file: {selectedFile.name}</p>}
        </div>

        <button
          className={styles.uploadButton}
          onClick={handleUpload}
          disabled={!selectedFile}
        >
          Upload
        </button>
      </div>
    </div>
  );
};

export default UploadModal;
