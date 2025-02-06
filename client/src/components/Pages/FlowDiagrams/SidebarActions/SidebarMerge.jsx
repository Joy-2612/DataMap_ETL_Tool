import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import { toast } from "sonner";
import styles from "./SidebarMerge.module.css";

const SidebarMerge = ({ nodeId, nodes, setNodes ,datasets_source,  setDatasets_source}) => {
  // const [datasets, setDatasets] = useState([]);
  const [dataset1, setDataset1] = useState(null);
  const [dataset2, setDataset2] = useState(null);
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]);
  const [selectedColumn1, setSelectedColumn1] = useState("");
  const [selectedColumn2, setSelectedColumn2] = useState("");
  const [isDropdown1Open, setIsDropdown1Open] = useState(false);
  const [isDropdown2Open, setIsDropdown2Open] = useState(false);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    // If datasets are provided, set the values for dataset1 and dataset2
    console.log("setting: ",datasets_source);
    if (datasets_source.length > 0) {
      setDataset1(datasets_source[0]); // Set first dataset as default
      if (datasets_source.length > 1) {
        setDataset2(datasets_source[1]); // Set second dataset if available
      }
    }
  }, [datasets_source]);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/file/alldatasets/${userId}`
        );
        const data = await response.json();
        setDatasets_source(data.data);
      } catch (error) {
        console.error("Error fetching datasets: ", error);
      }
    };

    fetchDatasets();
  }, [userId]);

  useEffect(() => {
    const selectedNode = nodes.find((node) => node.id === nodeId);

    if (selectedNode && selectedNode.data.parameters) {
      const {
        dataset1: storedDataset1,
        dataset2: storedDataset2,
        selectedColumn1: storedColumn1,
        selectedColumn2: storedColumn2,
      } = selectedNode.data.parameters;

      setDataset1(storedDataset1);
      setDataset2(storedDataset2);
      setSelectedColumn1(storedColumn1);
      setSelectedColumn2(storedColumn2);

      if (storedDataset1) {
        fetchColumns(storedDataset1.name, setColumns1);
      }
      if (storedDataset2) {
        fetchColumns(storedDataset2.name, setColumns2);
      }
    }
  }, [nodeId, nodes]);

  // Automatically set datasets from the action node's source nodes
  useEffect(() => {
    const selectedNode = nodes.find((node) => node.id === nodeId);
    if (selectedNode?.data?.parameters?.sourcenodes?.length > 0) {
      const [sourceNode1, sourceNode2] = selectedNode.data.parameters.sourcenodes;
      const dataset1Data = datasets_source.find((dataset) => dataset._id === sourceNode1);
      const dataset2Data = datasets_source.find((dataset) => dataset._id === sourceNode2);

      setDataset1(dataset1Data || null);
      setDataset2(dataset2Data || null);

      if (dataset1Data) fetchColumns(dataset1Data.name, setColumns1);
      if (dataset2Data) fetchColumns(dataset2Data.name, setColumns2);
    }
  }, [nodeId, datasets_source.id, nodes]);

  const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(file.data);
      const text = new TextDecoder("utf-8").decode(uint8Array);

      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        complete: (result) => resolve(result.data),
        error: (error) => {
          console.error("Error parsing CSV: ", error);
          reject(error);
        },
      });
    });
  };

  const fetchColumns = async (dataset, setColumns) => {
    try {
      const selectedDataset = datasets_source.find((d) => d.name === dataset);
      if (selectedDataset) {
        const csvData = await parseCsvFile(selectedDataset.file);
        const columns = Object.keys(csvData[0]);
        setColumns(columns);
      }
    } catch (error) {
      console.error("Error fetching columns: ", error);
    }
  };

  const handleSubmit = () => {
    const parameters = {
      dataset1,
      dataset2,
      selectedColumn1,
      selectedColumn2
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
    console.log("Merge Parameters:", parameters);
    toast.success("Merge parameters saved successfully!");
  };

  // Check if dataset1 or dataset2 are available to be selected
  const isDataset1Selectable = !!datasets_source.find((d) => d._id === dataset1?._id);
  const isDataset2Selectable = !!datasets_source.find((d) => d._id === dataset2?._id);

  return (
    <div className={styles.mergeContainer}>
      <div className={styles.formGroup}>
        <div className={styles.datasetAndColumnInput}>
          <div className={styles.mergeInput}>
            <Dropdown
              datasets_source={datasets_source.id}
              selected={dataset1}
              onSelect={(dataset) => {
                setDataset1(dataset);
                fetchColumns(dataset.name, setColumns1);
                setIsDropdown1Open(false);
              }}
              isOpen={isDropdown1Open}
              setIsOpen={setIsDropdown1Open}
              disabled={datasets_source.length !== 2} // Disable if no dataset1 is available
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
              datasets_source={datasets_source.filter((d) => d._id !== dataset1?._id)}
              selected={dataset2}
              onSelect={(dataset) => {
                setDataset2(dataset);
                fetchColumns(dataset.name, setColumns2);
                setIsDropdown2Open(false);
              }}
              isOpen={isDropdown2Open}
              setIsOpen={setIsDropdown2Open}
              disabled={datasets_source.length !==2} // Disable if no dataset2 is available
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
        <button
          onClick={handleSubmit}
          disabled={!dataset1 || !dataset2 || !selectedColumn1 || !selectedColumn2}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default SidebarMerge;
