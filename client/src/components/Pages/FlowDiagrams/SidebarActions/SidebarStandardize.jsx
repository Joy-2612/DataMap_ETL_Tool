import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import Multiselect from "multiselect-react-dropdown";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import styles from "./SidebarStandardize.module.css";

const SidebarStandardize = ({ nodeId, nodes, setNodes }) => {
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
  const selectedNode = nodes.find((node) => node.id === nodeId);

  const userId = localStorage.getItem("userId");
  const disabled=true;

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
  useEffect(() => {
            const fetchDatasets = async () => {
              try {
                const response1 = await fetch(`http://localhost:5000/api/file/datasets/${userId}`);
        const response2 = await fetch(`http://localhost:5000/api/file/results/${userId}`);
        const data1 = await response1.json();
        const data2= await response2.json();
        
                // Match datasets with sourcenode.id
                if (selectedNode && selectedNode.data.sourcenodes) {
                  const sourceNodeIds = selectedNode.data.sourcenodes.map((node) => node.id);
                  // console.log("S",sourceNodeIds);
                  const matchedDataset1 = data1.data.find((dataset) => dataset._id === sourceNodeIds[0])
                  || data2.data.find(
                    (dataset) => dataset._id === sourceNodeIds[0]
                  );;
        
                  // console.log("D",matchedDataset1); 
                  if (matchedDataset1) {
                    setSelectedDataset(matchedDataset1);
                    // console.log("D",matchedDataset1);
                    fetchColumns(matchedDataset1, setColumns);
                  }
                  
                }
              } catch (error) {
                console.error("Error fetching datasets: ", error);
              }
            };
            fetchDatasets();
          }, [userId, selectedNode])

  // Fetch columns when dataset is selected
  const fetchColumns = async (dataset) => {
    const csv = await parseCsvFile(dataset.file);
    setCsvData(csv);
    setColumns(Object.keys(csv[0]));
  };



  // Update unique values when column changes
  useEffect(() => {
    if (selectedColumn && csvData.length > 0) {
      const values = csvData.map((row) => row[selectedColumn]);
      const uniqueVals = [
        ...new Set(
          values.filter((value) => value !== undefined && value !== null)
        ),
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
    return uniqueValues.filter(
      (value) => !globalSelectedValues.includes(value)
    );
  };

  const handleAddMapping = () => {
    setMappings([...mappings, { before: [], after: "" }]);
  };
  const handleSubmit = () => {
    if (!selectedDataset || !selectedColumn) {
      toast.error("Please select a dataset and column.");
      return;
    }

    // Ensure at least one mapping has a filled "after" value
    const isAnyMappingFilled = mappings.some(
      (mapping) => mapping.after.trim() !== ""
    );

    if (!isAnyMappingFilled) {
      toast.error(
        "At least one mapping must have a value in the 'After' field."
      );
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
          disabled={true}  // Add disabled prop
          onSelect={(dataset) => {
            if (!disabled) {  // Add condition to prevent selection
              setSelectedDataset(dataset);
              fetchColumns(dataset);
              setIsDropdownOpen(false);
            }
          }}
          isOpen={isDropdownOpen}
          setIsOpen={setIsDropdownOpen}
    
        />
      </div>

      {/* Select Column */}
      {columns.length > 0 && (
        <div className={styles.formGroup}>
          <label>Select Column</label>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
          >
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
          <label>Mappings</label>
          {mappings.map((mapping, index) => (
            <div key={index} className={styles.mappingRow}>
              <div className={styles.multiSelect}>
                {uniqueValues.length > 0 && (
                  <Multiselect
                    options={getFilteredValues()}
                    selectedValues={mapping.before}
                    isObject={false}
                    onSelect={(selectedList) =>
                      handleSelectChange(index, selectedList)
                    }
                    onRemove={(selectedList) =>
                      handleSelectChange(index, selectedList)
                    }
                    placeholder="Select values"
                  />
                )}
              </div>
              <input
                type="text"
                placeholder="After"
                value={mapping.after}
                onChange={(e) =>
                  handleMappingChange(index, "after", e.target.value)
                }
              />
            </div>
          ))}
          <button className={styles.addButton} onClick={handleAddMapping}>
            + Add More
          </button>
        </div>
      )}

      {/* Submit Button */}
      <div className={styles.buttonGroup}>
        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={
            !selectedDataset ||
            !selectedColumn ||
            !mappings.some((m) => m.after.trim() !== "")
          }
        >
          Set Parameters
        </button>
      </div>
    </div>
  );
};

export default SidebarStandardize;
