import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Papa from "papaparse";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import { toast } from "sonner";
import styles from "./SidebarMerge.module.css";

const SidebarMerge = ({ nodeId, nodes, setNodes }) => {
  const [dataset1, setDataset1] = useState(null);
  const [dataset2, setDataset2] = useState(null);
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]);
  const [selectedColumn1, setSelectedColumn1] = useState("");
  const [selectedColumn2, setSelectedColumn2] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const userId = localStorage.getItem("userId");
  const selectedNode = nodes.find((node) => node.id === nodeId);
  const disabled=true;

  useEffect(() => {
    if (selectedNode && selectedNode.data.parameters) {
      const { dataset1, dataset2, column1, column2 } = selectedNode.data.parameters;
      setDataset1(dataset1);
      setDataset2(dataset2);
      setSelectedColumn1(column1 || "");
      setSelectedColumn2(column2 || "");
      if (dataset1) fetchColumns(dataset1, setColumns1);
      if (dataset2) fetchColumns(dataset2, setColumns2);
    }
  }, [selectedNode]);

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
          const matchedDataset1 = data1.data.find((dataset) => dataset._id === sourceNodeIds[0]) || data2.data.find((dataset) => dataset._id === sourceNodeIds[0]);
           const matchedDataset2 = data1.data.find((dataset) => dataset._id === sourceNodeIds[1]) || data2.data.find((dataset) => dataset._id === sourceNodeIds[1]);
                
          console.log("D",matchedDataset1); 
          if (matchedDataset1) {
            setDataset1(matchedDataset1);
            // console.log("D",matchedDataset1);
            fetchColumns(matchedDataset1, setColumns1);
          }
          if (matchedDataset2) {
            setDataset2(matchedDataset2);
            // console.log(matchedDataset2);
            fetchColumns(matchedDataset2, setColumns2);
          }
        }
      } catch (error) {
        console.error("Error fetching datasets: ", error);
      }
    };
    fetchDatasets();
  }, [userId, selectedNode]);

  const fetchColumns = async (dataset, setColumns) => {
    const csv = await parseCsvFile(dataset.file);
    const columns = Object.keys(csv[0]);
    setColumns(columns);
  };

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

  const handleSubmit = () => {
    const parameters = {
      dataset1,
      dataset2,
      column1: selectedColumn1,
      column2: selectedColumn2,
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
    setIsLoading(false);
    toast.success("Merge parameters saved successfully!");
  };

  return (
    <div className={styles.mergeContainer}>
      <div className={styles.formGroup}>
        <div className={styles.labelContainer}>
          <label className={styles.label}>Dataset 1</label>
          
          <div className={styles.dropdown}>

          <Dropdown
         
          selected={dataset1}
          disabled={true} 
          onSelect={(dataset) => {
            if(!disabled){
              setDataset1(dataset);
              fetchColumns(dataset, setColumns1);
            }
          }}
          label="Select Dataset 1"
          />
          </div>
        </div>
        <select value={selectedColumn1} onChange={(e) => setSelectedColumn1(e.target.value)}>
          <option value="">Select Column from Dataset 1</option>
          {columns1.map((col, index) => (
            <option key={index} value={col}>
              {col}
            </option>
          ))}
        </select>

        <div className={styles.labelContainer}>
          <label className={styles.label}>Dataset 2</label>
          <div className={styles.dropdown}>

          <Dropdown
            selected={dataset2}
            disabled={true}
            onSelect={(dataset) => {
              if(!disabled){
                setDataset2(dataset);
                fetchColumns(dataset, setColumns2);

              }
            }}
            label="Select Dataset 2"
          />
          </div>
        </div>
        <select value={selectedColumn2} onChange={(e) => setSelectedColumn2(e.target.value)}>
          <option value="">Select Column from Dataset 2</option>
          {columns2.map((col, index) => (
            <option key={index} value={col}>
              {col}
            </option>
          ))}
        </select>

        <button onClick={handleSubmit} disabled={!selectedColumn1 || !selectedColumn2 || isLoading}>
          {isLoading ? <span className={styles.loader}></span> : "Set Parameters"}
        </button>
      </div>
    </div>
  );
};

export default SidebarMerge;