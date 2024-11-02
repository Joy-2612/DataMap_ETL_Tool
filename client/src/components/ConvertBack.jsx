import React, { useState } from "react";
import Papa from "papaparse";
import { FaDownload, FaArrowLeft } from "react-icons/fa";
import { toast } from "sonner";
import "../styles/ConvertBack.css";
const xmlFormatter = require("xml-formatter");

const ConvertBack = () => {
  const [file, setFile] = useState(null);
  const [convertedFile, setConvertedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [convertTo, setConvertTo] = useState("json"); // Default conversion format
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false); // Added to toggle views
  const [customFileName, setCustomFileName] = useState(""); // Custom filename state

  // JSON to XML conversion function with indentation
  const jsonToXml = (json) => {
    let xml = "";

    const convert = (obj, rootElement, indent = "") => {
      if (Array.isArray(obj)) {
        obj.forEach((item) => {
          xml += `${indent}<${rootElement}>\n`;
          convert(item, rootElement, indent + "  "); // Increase indentation for nested elements
          xml += `${indent}</${rootElement}>\n`;
        });
      } else if (typeof obj === "object") {
        for (const [key, value] of Object.entries(obj)) {
          xml += `${indent}<${key}>\n`;
          convert(value, key, indent + "  "); // Increase indentation for nested elements
          xml += `${indent}</${key}>\n`;
        }
      } else {
        xml += `${indent}${obj}\n`; // Add the value with current indentation
      }
    };

    xml += "<root>\n"; // Start the root element
    convert(json, "item"); // Use a generic 'item' for the main elements
    xml += "</root>"; // Close the root element
    return xml;
  };

  // Handler for drag and drop
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
          // Parse CSV
          const parsedData = Papa.parse(fileContent, { header: true }).data;

          // Format the data for XML conversion only
          let formattedData;

          if (convertTo === "xml") {
            // Replace spaces in keys with underscores for XML conversion
            formattedData = parsedData.map((item) => {
              const formattedItem = {};
              for (const key in item) {
                if (item.hasOwnProperty(key)) {
                  const newKey = key.replace(/ /g, "_"); // Replace spaces with underscores
                  formattedItem[newKey] = item[key];
                }
              }
              return formattedItem;
            });
          } else {
            // For JSON conversion, use the parsed data as is
            formattedData = parsedData;
          }

          if (convertTo === "json") {
            setPreviewData(JSON.stringify(formattedData, null, 2)); // Prettified JSON
          } else if (convertTo === "xml") {
            const xmlData = jsonToXml(formattedData);
            const prettyXml = xmlFormatter(xmlData); // Prettify the XML
            setPreviewData(prettyXml); // Set the prettified XML for preview
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

          setShowPreview(true); // Show preview section
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
    <div className="convert-container">
      {!showPreview ? (
        <>
          <div className="title">Convert CSV to JSON or XML</div>
          <div
            className={`dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fileInput").click()}
          >
            <p>Drag and drop a CSV file here, or click to select one</p>
            {file && <p className="file-name">Selected {file.name}</p>}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="fileInput"
            />
          </div>

          <div className="dropdown-container">
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

          {/* Custom filename input displayed only when file is selected */}
          {file && (
            <div className="file-name-input">
              <label htmlFor="customFileName">Custom File Name: </label>
              <input
                type="text"
                id="customFileName"
                placeholder={`${file.name.split(".")[0]}_converted`}
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
              />
            </div>
          )}

          <button className="convert-button" onClick={handleConvert}>
            Convert
          </button>
        </>
      ) : (
        <div className="preview-section">
          <div className="button-container">
            <button
              className="back-button"
              onClick={() => setShowPreview(false)}
            >
              <FaArrowLeft /> Back
            </button>
            <div className="preview-header">
              <h2>Preview of Converted File</h2>
              <span id="file-name">
                <i>{fileName}</i>
              </span>
            </div>
            <button className="download-button" onClick={handleDownload}>
              <FaDownload /> Download
            </button>
          </div>
          {previewData && <pre className="preview">{previewData}</pre>}
        </div>
      )}
    </div>
  );
};

export default ConvertBack;
