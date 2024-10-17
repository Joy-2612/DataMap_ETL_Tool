import React, { useState } from 'react';
import { toast, ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";
import { FaDownload } from 'react-icons/fa'; 

const Convert = () => {
  const [file, setFile] = useState(null); 
  const [convertedFile, setConvertedFile] = useState(null); 
  const [fileName, setFileName] = useState(""); 

  // Handler for file input change
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Function to convert the file
  const handleConvert = async () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target.result;
        const fileType = file.type === "application/json" ? "json" : "xml";

        try {
          const response = await fetch('http://localhost:5000/api/file/convert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileType, fileData: fileContent }),
          });

          if (!response.ok) {
            throw new Error('Failed to convert file');
          }

          const csvBlob = await response.blob();  // Convert the response to blob
          const url = window.URL.createObjectURL(csvBlob);  // Create a URL for the blob
          const originalFileName = file.name.split('.').slice(0, -1).join('.');  // Remove extension from original name
          const newFileName = `${originalFileName}_converted.csv`;

          // Set convertedFile and fileName in local state for display and download
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


  // Function to handle file download
  const handleDownload = () => {
    if (convertedFile) {
      const a = document.createElement('a'); 
      a.href = convertedFile; 
      a.download = fileName; 
      document.body.appendChild(a);
      a.click(); 
      a.remove(); 
    }
  };

  return (
    <div>
      { <h2>Convert JSON or XML to CSV</h2>}
      
      {(
        <>
          <input type="file" accept=".json, .xml" onChange={handleFileChange} />
          <button onClick={handleConvert}>Convert</button>
        </>
      )}
      
      <ToastContainer />

      {/* View Converted Files Section */}
      {convertedFile && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Converted File: {fileName}</h3>
          <button onClick={handleDownload} style={{ marginLeft: 'auto' }}>
            <FaDownload /> Download
          </button>
        </div>
      )}
    </div>
  );
};

export default Convert;
