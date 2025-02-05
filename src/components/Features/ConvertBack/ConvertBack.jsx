import React, { useState } from "react";
import Papa from "papaparse";
import { FaDownload, FaArrowLeft } from "react-icons/fa";
import { toast } from "sonner";
import styles from "./ConvertBack.module.css";
const xmlFormatter = require("xml-formatter");

const ConvertBack = () => {
  const [file, setFile] = useState(null);
  const [convertedFile, setConvertedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [convertTo, setConvertTo] = useState("json");
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [customFileName, setCustomFileName] = useState("");

  const jsonToXml = (json) => {
    let xml = "";
    const convert = (obj, rootElement, indent = "") => {
      if (Array.isArray(obj)) {
        obj.forEach((item) => {
          xml += `${indent}<${rootElement}>\n`;
          convert(item, rootElement, indent + "  ");
          xml += `${indent}</${rootElement}>\n`;
        });
      } else if (typeof obj === "object") {
        for (const [key, value] of Object.entries(obj)) {
          xml += `${indent}<${key}>\n`;
          convert(value, key, indent + "  ");
          xml += `${indent}</${key}>\n`;
        }
      } else {
        xml += `${indent}${obj}\n`;
      }
    };

    xml += "<root>\n";
    convert(json, "item");
    xml += "</root>";
    return xml;
  };

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
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleConvert = async () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target.result;
        const originalFileName = file.name.split(".").slice(0, -1).join(".");
        try {
          const parsedData = Papa.parse(fileContent, { header: true }).data;
          let formattedData;

          if (convertTo === "xml") {
            formattedData = parsedData.map((item) => {
              const formattedItem = {};
              for (const key in item) {
                if (item.hasOwnProperty(key)) {
                  const newKey = key.replace(/ /g, "_");
                  formattedItem[newKey] = item[key];
                }
              }
              return formattedItem;
            });
          } else {
            formattedData = parsedData;
          }

          if (convertTo === "json") {
            setPreviewData(JSON.stringify(formattedData, null, 2));
          } else if (convertTo === "xml") {
            const xmlData = jsonToXml(formattedData);
            const prettyXml = xmlFormatter(xmlData);
            setPreviewData(prettyXml);
          }

          const finalFileName = customFileName
            ? `${customFileName}.${convertTo}`
            : `${originalFileName}_converted.${convertTo}`;

          const convertedBlob = new Blob(
            [
              convertTo === "json"
                ? JSON.stringify(formattedData, null, 2)
                : xmlFormatter(jsonToXml(formattedData)),
            ],
            {
              type:
                convertTo === "json" ? "application/json" : "application/xml",
            }
          );

          const url = window.URL.createObjectURL(convertedBlob);
          setConvertedFile(url);
          setFileName(finalFileName);
          setShowPreview(true);
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
    <div className={styles.convertContainer}>
      {!showPreview ? (
        <>
          <div className={styles.title}>Convert CSV to JSON or XML</div>
          <div
            className={`${styles.dropzone} ${
              isDragging ? styles.dragging : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fileInput").click()}
          >
            <p className={styles.dropzoneText}>
              Drag and drop a CSV file here, or click to select one
            </p>
            {file && <p className={styles.fileName}>Selected {file.name}</p>}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="fileInput"
            />
          </div>

          <div className={styles.dropdownContainer}>
            <label htmlFor="convertTo">Convert To: </label>
            <select
              id="convertTo"
              value={convertTo}
              onChange={(e) => setConvertTo(e.target.value)}
            >
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
          </div>

          {file && (
            <div className={styles.fileNameInput}>
              <label htmlFor="customFileName">Custom File Name: </label>
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

          <button className={styles.convertButton} onClick={handleConvert}>
            Convert
          </button>
        </>
      ) : (
        <div className={styles.previewSection}>
          <div className={styles.buttonContainer}>
            <button
              className={styles.backButton}
              onClick={() => setShowPreview(false)}
            >
              <FaArrowLeft /> Back
            </button>
            <div className={styles.previewHeader}>
              <h2>Preview of Converted File</h2>
              <span className={styles.fileNameDisplay}>
                <i>{fileName}</i>
              </span>
            </div>
            <button className={styles.downloadButton} onClick={handleDownload}>
              <FaDownload /> Download
            </button>
          </div>
          {previewData && <pre className={styles.preview}>{previewData}</pre>}
        </div>
      )}
    </div>
  );
};

export default ConvertBack;
