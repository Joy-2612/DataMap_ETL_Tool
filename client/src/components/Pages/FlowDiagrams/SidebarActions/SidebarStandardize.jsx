import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import Multiselect from "multiselect-react-dropdown";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import styles from "./SidebarStandardize.module.css";

const Standardize = ({ nodeId, nodes, setNodes }) => {
  const [outputFileName, setOutputFileName] = useState("");
  const [description, setDescription] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [mappings, setMappings] = useState([{ before: [], after: "" }]);
  const [csvData, setCsvData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState([]);
  const [globalSelectedValues, setGlobalSelectedValues] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userId = localStorage.getItem("userId");

  // Parse CSV File
  const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(file.data);
      const text = new TextDecoder("utf-8").decode(uint8Array);

      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        complete: (result) => resolve(result.data),
        error: (error) => reject(error),
      });
    });
  };

  // Fetch available datasets
  const fetchDatasets = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/alldatasets/${userId}`
      );
      const data = await response.json();
      setDatasets(data.data);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  // Fetch columns when dataset is selected
  const fetchColumns = async (dataset) => {
    const csv = await parseCsvFile(dataset.file);
    setCsvData(csv);
    setColumns(Object.keys(csv[0]));
  };

  // Load datasets on mount
  useEffect(() => {
    fetchDatasets();
  }, [userId]);

  // Update unique values when column changes
  useEffect(() => {
    if (selectedColumn && csvData.length > 0) {
      const values = csvData.map((row) => row[selectedColumn]);
      const uniqueVals = [
        ...new Set(values.filter((value) => value !== undefined && value !== null)),
      ];
      setUniqueValues(uniqueVals);
    } else {
      setUniqueValues([]);
    }
  }, [selectedColumn, csvData]);

  // Load existing parameters if available
  useEffect(() => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node && node.data && node.data.parameters) {
      const { datasetId, datasetName, column, mappings } = node.data.parameters;
      const dataset = datasets.find((d) => d._id === datasetId);

      if (dataset) {
        setSelectedDataset(dataset);
        fetchColumns(dataset);
      }
      setSelectedColumn(column || "");
      setMappings(mappings || [{ before: [], after: "" }]);



      
    }
  }, [nodeId, nodes, datasets]);

  // Handle mapping changes
  const handleMappingChange = (index, field, value) => {
    const updatedMappings = [...mappings];
    updatedMappings[index][field] = value;
    setMappings(updatedMappings);
  };

  // Handle multiselect changes
  const handleSelectChange = (index, selectedValues) => {
    const updatedMappings = [...mappings];
    updatedMappings[index].before = selectedValues;
    setMappings(updatedMappings);

    const updatedGlobalSelectedValues = new Set();
    updatedMappings.forEach((mapping) =>
      mapping.before.forEach((value) => updatedGlobalSelectedValues.add(value))
    );

    setGlobalSelectedValues([...updatedGlobalSelectedValues]);


    

  };

  // Filter selectable values
  const getFilteredValues = () => {
    return uniqueValues.filter((value) => !globalSelectedValues.includes(value));
  };

  // Submit Parameters (Save in Node JSON)
  const handleSubmit = () => {

    

    
    
    if (!selectedDataset || !selectedColumn) {
      toast.error("Please select a dataset and column.");
      return;
    }

    const parameters = {
      datasetId: selectedDataset._id,
      datasetName: selectedDataset.name, // ✅ Store dataset name for display
      column: selectedColumn,
      mappings: mappings,
    };

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
    console.log("Standardize Parameters:", parameters);
    toast.success("Standardize Parameters saved successfully!");
  };

  return (
    <div className={styles.standardizeContainer}>
      {/* Select Dataset */}
      <div className={styles.formGroup}>
        <label>Select Dataset</label>
        <Dropdown
          datasets={datasets}
          selected={selectedDataset}
          onSelect={(dataset) => {
            setSelectedDataset(dataset);
            fetchColumns(dataset);
            setIsDropdownOpen(false);
          }}
          isOpen={isDropdownOpen}
          setIsOpen={setIsDropdownOpen}
        />
       
      </div>

      {/* Select Column */}
      {columns.length > 0 && (
        <div className={styles.formGroup}>
          <label>Select Column</label>
          <select value={selectedColumn} onChange={(e) => setSelectedColumn(e.target.value)}>
            <option value="">Choose a Column</option>
            {columns.map((column, index) => (
              <option key={index} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mappings */}
      {selectedDataset && (
        <div className={styles.mappingsContainer}>
          <h2>Mappings</h2>
          {mappings.map((mapping, index) => (
            <div key={index} className={styles.mappingRow}>
              <div className={styles.multiSelect}>
                {uniqueValues.length > 0 && (
                  <Multiselect
                    options={getFilteredValues()}
                    selectedValues={mapping.before}
                    isObject={false}
                    onSelect={(selectedList) => handleSelectChange(index, selectedList)}
                    onRemove={(selectedList) => handleSelectChange(index, selectedList)}
                    placeholder="Select values"
                  />
                )}
              </div>
              <input
                type="text"
                placeholder="After"
                value={mapping.after}
                onChange={(e) => handleMappingChange(index, "after", e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <div className={styles.buttonGroup}>
        <button className={styles.submitButton} onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default Standardize;
