import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import { toast } from "sonner";
import styles from "./SidebarMerge.module.css";

const SidebarMerge = ({ nodeId, nodes, setNodes }) => {
  const [datasets, setDatasets] = useState([]);
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
      const selectedDataset = datasets.find((d) => d.name === dataset);
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

  return (
    <div className={styles.mergeContainer}>
      <div className={styles.formGroup}>
        <div className={styles.datasetAndColumnInput}>
          <div className={styles.mergeInput}>
            <Dropdown
              datasets={datasets}
              selected={dataset1}
              onSelect={(dataset) => {
                setDataset1(dataset);
                fetchColumns(dataset.name, setColumns1);
                setIsDropdown1Open(false);
              }}
              isOpen={isDropdown1Open}
              setIsOpen={setIsDropdown1Open}
            />
          </div>
          <select
            value={selectedColumn1}
            onChange={(e) => setSelectedColumn1(e.target.value)}
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
              datasets={datasets.filter((d) => d.name !== dataset1?.name)}
              selected={dataset2}
              onSelect={(dataset) => {
                setDataset2(dataset);
                fetchColumns(dataset.name, setColumns2);
                setIsDropdown2Open(false);
              }}
              isOpen={isDropdown2Open}
              setIsOpen={setIsDropdown2Open}
            />
          </div>
          <select
            value={selectedColumn2}
            onChange={(e) => setSelectedColumn2(e.target.value)}
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