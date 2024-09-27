import React, { useState } from "react";
import "../styles/UploadModal.css";
import { toast } from "sonner";
import { AiOutlineClose } from "react-icons/ai"; // Import the close icon
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
      formData.append("userId", userId); // Append userId to the form data
      console.log("formData", formData);
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
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Close button with icon */}
        <button className="close-button" onClick={onClose}>
          <AiOutlineClose size={20} />
        </button>

        <h2>Upload Dataset</h2>

        {/* Drag-and-Drop Area */}
        <div
          className={`drag-drop-area ${dragActive ? "active" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <p className="file-icon">
            <PiFilesFill />
          </p>
          <p>Drag and drop your CSV file here, or click to select a file</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="file-input"
          />
          {selectedFile && <p>Selected file: {selectedFile.name}</p>}
        </div>

        <button
          className="upload-button"
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
