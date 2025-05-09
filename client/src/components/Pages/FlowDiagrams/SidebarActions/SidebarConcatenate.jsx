import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Papa from "papaparse";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import { toast } from "sonner";
import styles from "./SidebarConcatenate.module.css";

const SidebarConcatenate = ({ nodeId, nodes, setNodes }) => {
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

  const selectedNode = nodes.find((node) => node.id === nodeId);
  const disabled=true;

  //  console.log("d",selectedNode.data.parameters);

  useEffect(() => {
    if (selectedNode && selectedNode.data.parameters) {
      const { dataset, columns, delimiter, finalColumnName } =
        selectedNode.data.parameters;
      // console.log(dataset);
      setDataset1(dataset);
      setSelectedColumns(columns || []);
      setDelimiter(delimiter || ",");
      setFinalColumnName(finalColumnName || "");
      if (dataset) {
        fetchColumn(dataset);
      }
    }
  }, [selectedNode]);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response1 = await fetch(
          `http://localhost:5000/api/file/datasets/${userId}`
        );
        const response2 = await fetch(
          `http://localhost:5000/api/file/results/${userId}`
        );
        const data1 = await response1.json();
        const data2 = await response2.json();

        // Match datasets with sourcenode.id
        if (selectedNode && selectedNode.data.sourcenodes) {
          const sourceNodeIds = selectedNode.data.sourcenodes.map(
            (node) => node.id
          );
          const matchedDataset1 =
            data1.data.find((dataset) => dataset._id === sourceNodeIds[0]) ||
            data2.data.find((dataset) => dataset._id === sourceNodeIds[0]);

          if (matchedDataset1) {
            setDataset1(matchedDataset1);
            fetchColumn(matchedDataset1, setColumns1);
          }
        }
      } catch (error) {
        console.error("Error fetching datasets: ", error);
      }
    };
    fetchDatasets();
  }, [userId, selectedNode]);

  const handleSubmit = () => {
    const parameters = {
      dataset: dataset1,
      columns: selectedColumns,
      delimiter,
      finalColumnName,
    };

    // Update the node with the new parameters
    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            parameters,
          },
        };
      }
      return node;
    });
    setNodes(updatedNodes);
    setIsLoading(false);
    console.log("Concatenate Parameters Saved:", parameters);
    toast.success("Concatenation parameters saved successfully!");
  };

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
          {<label>Dataset</label>}
          <Dropdown
            datasets={datasets}
            selected={dataset1}
            disabled={true}
            // onSelect={handleDatasetSelect} // Only handles selection
            onSelect={(dataset) => {
              if(!disabled){
                setDataset1(dataset);
                fetchColumn(dataset, setColumns1);
              }
                
            }}
            // onView={handleCsvView} // Separate handler for viewing CSV
            // isOpen={isDropdownOpen} // Use the new state variables
            // setIsOpen={setIsDropdownOpen} // Use the new state variables
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
          onClick={handleSubmit}
          disabled={
            selectedColumns.length === 0 || !finalColumnName || isLoading
          }
        >
          {isLoading ? <span className={styles.loader}></span> : "Set Parameters"}
        </button>
      </div>
    </div>
  );
};

export default SidebarConcatenate;
