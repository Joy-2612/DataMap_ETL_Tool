import React, { useState } from "react";
import Papa from "papaparse";
import DataTable from "../components/DataTable/DataTable";
import { FaDownload } from "react-icons/fa";
import { toast } from "sonner";
import styles from "../styles/Convert.module.css";

const Convert = () => {
  const [file, setFile] = useState(null);
  const [convertedFile, setConvertedFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [customFileName, setCustomFileName] = useState("");
  const userId = localStorage.getItem("userId");
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    } else {
      toast.warn("Please drop a valid file.");
    }
  };

  const handleConvert = async () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target.result;
        const fileType = file.type === "application/json" ? "json" : "xml";
        const originalFileName = file.name.split(".").slice(0, -1).join(".");

        try {
          const response = await fetch(
            "http://localhost:5000/api/file/convert",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileType,
                fileData: fileContent,
                userId,
                originalFileName,
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to convert file");
          }

          const csvBlob = await response.blob();
          const text = await csvBlob.text();

          Papa.parse(text, {
            header: true,
            dynamicTyping: true,
            complete: (result) => {
              setCsvData(result.data);
            },
            error: () => {
              toast.error("Error parsing the converted CSV.");
            },
          });

          const url = window.URL.createObjectURL(csvBlob);
          const newFileName = customFileName
            ? `${customFileName}.csv`
            : `${originalFileName}_converted.csv`;

          setConvertedFile(url);
          setFileName(newFileName);
          toast.success("File converted successfully!");
        } catch (error) {
          toast.error("Conversion failed: " + error.message);
        }
      };
      reader.readAsText(file);
    } else {
      toast.warn("Please select a file first.");
    }
  };

  const handleBack = () => {
    setCsvData([]);
  };

  const handleDownload = () => {
    if (convertedFile) {
      const a = document.createElement("a");
      a.href = convertedFile;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      toast.warn("No converted file available for download.");
    }
  };

  return (
    <div className={styles.container}>
      {!csvData.length > 0 && (
        <>
          <div className={styles.title}>Convert JSON or XML to CSV</div>
          <div
            className={`${styles.dropzone} ${
              isDragging ? styles.dropzoneDragging : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fileInput").click()}
          >
            <p className={styles.dropzoneText}>
              Drag and drop a file here, or click to select one
            </p>
            {file && <p className={styles.fileName}>Selected {file.name}</p>}
            <input
              type="file"
              accept=".json, .xml"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: "none" }}
              id="fileInput"
            />
          </div>
          {file && (
            <div className={styles.fileNameInput}>
              <label htmlFor="customFileName">
                Enter a custom name for the converted file:
              </label>
              <input
                type="text"
                id="customFileName"
                className={styles.customFileNameInput}
                placeholder={`${file.name.split(".")[0]}_converted`}
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
              />
            </div>
          )}
          <button
            className={`${styles.convertButton} ${styles.convertButtonHover}`}
            onClick={handleConvert}
          >
            Convert
          </button>
        </>
      )}

      {csvData.length > 0 && (
        <div className={styles.csvDataContainer}>
          <div className={styles.csvDataHeader}>
            <div className={styles.back} onClick={handleBack}>
              Back
            </div>
            <div>
              Preview of Converted CSV -{" "}
              <span className={styles.fileName}>
                <i>{fileName}</i>
              </span>
            </div>

            <button onClick={handleDownload}>
              <FaDownload /> Download
            </button>
          </div>
          <DataTable
            className={styles.csvDataTable}
            title="Converted CSV Data"
            columns={Object.keys(csvData[0] || {}).map((key) => ({
              label: key,
              key: key,
            }))}
            data={csvData}
            getRowId={(row, index) => index}
          />
        </div>
      )}
    </div>
  );
};

export default Convert;
