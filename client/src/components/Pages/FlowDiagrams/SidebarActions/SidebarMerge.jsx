import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import { toast } from "sonner";
import styles from "./SidebarMerge.module.css";

const SidebarMerge = ({ nodeId, nodes, setNodes, datasets_source, setDatasets_source }) => {
  const [dataset1, setDataset1] = useState(null);
  const [dataset2, setDataset2] = useState(null);
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]);
  const [selectedColumn1, setSelectedColumn1] = useState("");
  const [selectedColumn2, setSelectedColumn2] = useState("");
  const [isDropdown1Open, setIsDropdown1Open] = useState(false);
  const [isDropdown2Open, setIsDropdown2Open] = useState(false);

  const userId = localStorage.getItem("userId");

  // ✅ Fetch datasets on component mount
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/file/alldatasets/${userId}`);
        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
          setDatasets_source(data.data);  // ✅ Correctly updating state
        } else {
          console.error("Invalid data format:", data);
        }
      } catch (error) {
        console.error("Error fetching datasets:", error);
      }
    };
    fetchDatasets();
  }, [userId]);

  // ✅ Set datasets from source nodes (when datasets_source updates)
  useEffect(() => {
    const selectedNode = nodes.find((node) => node.id === nodeId);
    
    if (selectedNode?.data?.parameters?.sourcenodes?.length > 0) {
      console.log("Source Nodes:", selectedNode.data.parameters.sourcenodes);
      
      const [sourceNode1, sourceNode2] = selectedNode.data.parameters.sourcenodes;

      const dataset1Data = datasets_source.find((dataset) => dataset.id === sourceNode1);
      const dataset2Data = datasets_source.find((dataset) => dataset.id === sourceNode2);

      if (dataset1Data) {
        setDataset1(dataset1Data);
        fetchColumns(dataset1Data, setColumns1);
      }
      if (dataset2Data) {
        setDataset2(dataset2Data);
        fetchColumns(dataset2Data, setColumns2);
      }
    }
  }, [nodeId, datasets_source, nodes]);

  // ✅ Fetch columns when dataset1 or dataset2 updates
  useEffect(() => {
    if (dataset1) fetchColumns(dataset1, setColumns1);
  }, [dataset1]);

  useEffect(() => {
    if (dataset2) fetchColumns(dataset2, setColumns2);
  }, [dataset2]);

  // ✅ Fetch columns from dataset
  const fetchColumns = async (dataset, setColumns) => {
    try {
      console.log(`Fetching columns for dataset: ${dataset.name}`);
      
      if (!dataset?.file) {
        console.warn(`No file found for dataset: ${dataset.name}`);
        return;
      }

      const csvData = await parseCsvFile(dataset.file);
      if (csvData.length > 0) {
        setColumns(Object.keys(csvData[0]));
      } else {
        setColumns([]);
      }
    } catch (error) {
      console.error("Error fetching columns:", error);
    }
  };

  // ✅ Parse CSV file from dataset object
  const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (result) => resolve(result.data),
        error: (error) => {
          console.error("Error parsing CSV:", error);
          reject(error);
        },
      });
    });
  };

  const handleSubmit = () => {
    if (!dataset1 || !dataset2 || !selectedColumn1 || !selectedColumn2) {
      toast.error("Please select both datasets and columns before submitting.");
      return;
    }

    const parameters = {
      dataset1,
      dataset2,
      selectedColumn1,
      selectedColumn2,
    };

    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              parameters,
            },
          }
        : node
    );

    setNodes(updatedNodes);
    toast.success("Merge parameters saved successfully!");
  };

  return (
    <div className={styles.mergeContainer}>
      <div className={styles.formGroup}>
        <div className={styles.datasetAndColumnInput}>
          <div className={styles.mergeInput}>
            <Dropdown
              datasets_source={datasets_source}  // ✅ Pass correct datasets_source
              selected={dataset1}
              onSelect={(dataset) => {
                setDataset1(dataset);
                fetchColumns(dataset, setColumns1);
                setIsDropdown1Open(false);
              }}
              isOpen={isDropdown1Open}
              setIsOpen={setIsDropdown1Open}
              disabled={datasets_source.length < 2}
            />
          </div>
          <select
            value={selectedColumn1}
            onChange={(e) => setSelectedColumn1(e.target.value)}
            disabled={!dataset1}
          >
            <option value="">Select Column from Dataset 1</option>
            {columns1.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
        <hr className={styles.linebreak} />
        <div className={styles.datasetAndColumnInput}>
          <div className={styles.mergeInput}>
            <Dropdown
              datasets_source={datasets_source.filter((d) => d.id !== dataset1?.id)}
              selected={dataset2}
              onSelect={(dataset) => {
                setDataset2(dataset);
                fetchColumns(dataset, setColumns2);
                setIsDropdown2Open(false);
              }}
              isOpen={isDropdown2Open}
              setIsOpen={setIsDropdown2Open}
              disabled={datasets_source.length < 2}
            />
          </div>
          <select
            value={selectedColumn2}
            onChange={(e) => setSelectedColumn2(e.target.value)}
            disabled={!dataset2}
          >
            <option value="">Select Column from Dataset 2</option>
            {columns2.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleSubmit} disabled={!dataset1 || !dataset2 || !selectedColumn1 || !selectedColumn2}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default SidebarMerge;
