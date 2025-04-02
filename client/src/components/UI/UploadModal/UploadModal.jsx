import React, { useState } from "react";
import styles from "./UploadModal.module.css";
import { toast } from "sonner";
import { AiOutlineClose, AiOutlineDelete } from "react-icons/ai";
import { PiFilesFill } from "react-icons/pi";

const UploadModal = ({ show, onClose, onUpload, userId }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length > 0) {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("userId", userId);

      try {
        const response = await fetch("http://localhost:5000/api/file/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          toast.success(`${selectedFiles.length} files uploaded successfully`);
          onUpload(selectedFiles);
          setSelectedFiles([]);
          onClose();
        } else {
          const data = await response.json();
          toast.error(data.message || "Failed to upload files");
        }
      } catch (error) {
        toast.error("An error occurred during file upload");
        console.error("File upload error:", error);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
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
            Drag and drop your CSV files here, or click to select files
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className={styles.fileInput}
            multiple
          />
        </div>

        <div className={styles.fileList}>
          {selectedFiles.map((file, index) => (
            <div key={index} className={styles.fileItem}>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>
                {(file.size / 1024).toFixed(2)} KB
              </span>
              <button
                className={styles.deleteButton}
                onClick={() => removeFile(index)}
              >
                <AiOutlineDelete />
              </button>
            </div>
          ))}
        </div>

        <button
          className={styles.uploadButton}
          onClick={handleUpload}
          disabled={!selectedFiles.length}
        >
          Upload {selectedFiles.length} File{selectedFiles.length !== 1 && "s"}
        </button>
      </div>
    </div>
  );
};

export default UploadModal;
