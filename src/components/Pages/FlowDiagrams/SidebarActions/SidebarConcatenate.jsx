import React, { useState,useEffect} from "react";
import { FaTimes } from "react-icons/fa";
import Papa from "papaparse";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import styles from "./SidebarConcatenate.module.css";


const SidebarConcatenate = () =>{
   const [datasets, setDatasets] = useState([]);
     const [dataset1, setDataset1] = useState(null);
     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
     const [currentSelection, setCurrentSelection] = useState("");
     const [selectedColumns, setSelectedColumns] = useState([]);
     const [delimiter, setDelimiter] = useState(",");
     const [finalColumnName, setFinalColumnName] = useState("");
    
      const [columns1, setColumns1] = useState([]);
       const [isLoading, setIsLoading] = useState(false);
       const userId = localStorage.getItem("userId");


       useEffect(() => {
           const fetchDatasets = async () => {
             try {
               const response = await fetch(
                 `http://localhost:5000/api/file/alldatasets/${userId}`
               );
               const data = await response.json();
               setDatasets(data.data);
             } catch (error) {
               console.error("Error fetching datasets: ", error);
             }
           };
           fetchDatasets();
         }, [userId]);

     const handleColumnRemove = (column) => {
        setSelectedColumns(selectedColumns.filter((c) => c !== column));
      };

      const fetchColumn = async (dataset) => {
        const csv = await parseCsvFile(dataset.file);
        const columns = Object.keys(csv[0]);
        setColumns1(columns);
      };


      const parseCsvFile = (file) => {
          return new Promise((resolve, reject) => {
            const uint8Array = new Uint8Array(file.data);
            const text = new TextDecoder("utf-8").decode(uint8Array);
      
            Papa.parse(text, {
              header: true,
              dynamicTyping: true,
              complete: (result) => {
                resolve(result.data);
              },
              error: (error) => {
                console.error("Error parsing CSV: ", error);
                reject(error);
              },
            });
          });
        };
      

     const handleDatasetSelect = async (dataset) => {
        setDataset1(dataset);
        fetchColumn(dataset);
        setSelectedColumns([]);
        setCurrentSelection("");
        setIsDropdownOpen(false); // Close the dropdown after selection
      };

      const handleColumnSelect = (e) => {
        const column = e.target.value;
        if (column && !selectedColumns.includes(column)) {
          setSelectedColumns([...selectedColumns, column]);
          setCurrentSelection("");
        }
      };

      const handleCsvView = async (dataset) => {
        const selectedDataset = datasets.find((d) => d.name === dataset.name);
        if (selectedDataset) {
          const csvData = await parseCsvFile(selectedDataset.file);
          
          
        }
      };


return (
    
    <div className={styles.concatenateContainer}>
 
      
      <div className={styles.formGroup}>
        <div className={styles.labelContainer}>
          {dataset1 && <label>Chose Dataset</label>}
          <Dropdown
            datasets={datasets}
            selected={dataset1}
            onSelect={handleDatasetSelect} // Only handles selection
            onView={handleCsvView} // Separate handler for viewing CSV
            isOpen={isDropdownOpen} // Use the new state variables
            setIsOpen={setIsDropdownOpen} // Use the new state variables
            />
        </div>
        <select value={currentSelection} onChange={handleColumnSelect}>
          <option value="">Select Columns</option>
          {columns1
            .filter((col) => !selectedColumns.includes(col))
            .map((col, index) => (
                <option key={index} value={col}>
                {col}
              </option>
            ))}
        </select>
        <div className={styles.labelContainer}>
          {selectedColumns.length >= 1 && <label>Selected Columns :</label>}
          <div className={styles.selectedColumns}>
            {selectedColumns.map((column, index) => (
                <div key={index} className={styles.selectedColumn}>
                {column}
                <FaTimes onClick={() => handleColumnRemove(column)} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.labelContainer}>
          <label>Delimiter</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="|">Pipe (|)</option>
            <option value=" ">Space</option>
          </select>
        </div>
        <div className={styles.labelContainer}>
          {finalColumnName && <label>Final Column Name</label>}
          <input
            type="text"
            value={finalColumnName}
            onChange={(e) => setFinalColumnName(e.target.value)}
            placeholder="Final Column Name"
            />
        </div>
        <button
          
          disabled={selectedColumns.length === 0 || isLoading}
          >
          {isLoading ? <span className={styles.loader}></span> : "Concatenate"}
        </button>
        </div>
    </div>


        );

        }

        export default SidebarConcatenate;