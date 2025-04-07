import React, { useState, useEffect } from "react";
import styles from "./RightSideBar.module.css";
import { toast } from "sonner";
import { FaChevronLeft, FaChevronRight, FaArrowLeft } from "react-icons/fa";
import { FaDatabase, FaSearch, FaChartBar, FaProjectDiagram } from "react-icons/fa";
import Papa from "papaparse";
import { actionOptions } from "./sidebarConfig";
import DataTab from "./DataTab";
import OutputTab from "./OutputTab";
import ActionsTab from "./ActionsTab";
import ParametersView from "./ParametersView";
import PeekModal from "../Modal/PeekModal";

const RightSideBar = ({
  onAddNode,
  onAddActionNode,
  onAddNodeOutput,
  selectedNodeId,
  isCollapsed,
  toggleCollapse,
  userId,
  selectedNode,
  nodes,
  setNodes,
  datasets_source,
  setDatasets_source,
}) => {
  const [datasets, setDatasets] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeDesc, setNewNodeDesc] = useState("");
  const [activeTab, setActiveTab] = useState("data");
  const [dataSubTab, setDataSubTab] = useState("source");
  const [selectedAction, setSelectedAction] = useState(null);
  const [showParametersView, setShowParametersView] = useState(false);
  const [searchSource, setSearchSource] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCsvData, setSelectedCsvData] = useState([]);

  useEffect(() => {
    if (selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node?.data?.type === "action") {
        const action = actionOptions.find(opt => opt.id === node.data.actionType);
        setSelectedAction(action);
        setShowParametersView(true);
      }
    }
  }, [selectedNodeId, nodes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [datasetsResponse, resultsResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/file/datasets/${userId}`),
          fetch(`http://localhost:5000/api/file/results/${userId}`),
        ]);

        const datasetsData = await datasetsResponse.json();
        const resultsData = await resultsResponse.json();

        setDatasets(datasetsData.data || []);
        setResults(resultsData.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  const parseCsvFile = (file) => {
    const uint8Array = new Uint8Array(file.data.file.data);
    const text = new TextDecoder("utf-8").decode(uint8Array);
    
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: ({ data }) => setSelectedCsvData([...data]),
      error: (error) => console.error("Error parsing CSV:", error),
    });
  };

  const handleDragStart = (event, item) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  };

  const handlePeekDataset = async (dataset) => {
    if (!dataset?._id) {
      toast.error("Node doesn't have a dataset");
      return;
    }

    try {
      setSelectedItem(dataset);
      const response = await fetch(`http://localhost:5000/api/file/dataset/${dataset._id}`);
      if (!response.ok) throw new Error("Failed to fetch file data");
      
      const fileData = await response.json();
      if (dataset.type.includes("csv")) parseCsvFile(fileData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dataset");
    }
  };

  const handleDoubleClick = (item) => {
    onAddNode?.({
      id: item._id,
      name: item.name,
      size: item.size,
      type: item.type,
    });
  };

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setShowParametersView(true);
    onAddActionNode?.({
      id: Date.now().toString(),
      name: action.name,
      type: "action",
      actionType: action.id,
      nodeType: "Action",
    });
  };

  const handleBackClick = () => {
    setShowParametersView(false);
    setSelectedAction(null);
  };

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      <button className={styles.collapseButton} onClick={toggleCollapse}>
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
      
      {!isCollapsed && (
        showParametersView ? (
          <ParametersView
            selectedAction={selectedAction}
            handleBackClick={handleBackClick}
            selectedNode={selectedNode}
            nodes={nodes}
            setNodes={setNodes}
            datasets_source={datasets_source}
            setDatasets_source={setDatasets_source}
          />
        ) : (
          <>
            <div className={styles.tabHeader}>
              <button
                className={`${styles.tabButton} ${activeTab === "data" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("data")}
              >
                <FaDatabase /> Data
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === "actions" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("actions")}
              >
                <FaProjectDiagram /> Actions
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === "output" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("output")}
              >
                <FaChartBar /> Output
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === "data" && (
                <DataTab
                  dataSubTab={dataSubTab}
                  setDataSubTab={setDataSubTab}
                  datasets={datasets}
                  results={results}
                  searchSource={searchSource}
                  searchResult={searchResult}
                  setSearchSource={setSearchSource}
                  setSearchResult={setSearchResult}
                  handleDragStart={handleDragStart}
                  handleDoubleClick={handleDoubleClick}
                  handlePeekDataset={handlePeekDataset}
                  selectedNodeId={selectedNodeId}
                />
              )}

              {activeTab === "actions" && (
                <ActionsTab
                  actionOptions={actionOptions}
                  handleActionSelect={handleActionSelect}
                />
              )}

              {activeTab === "output" && (
                <OutputTab
                  newNodeName={newNodeName}
                  newNodeDesc={newNodeDesc}
                  setNewNodeName={setNewNodeName}
                  setNewNodeDesc={setNewNodeDesc}
                  onAddNodeOutput={onAddNodeOutput}
                />
              )}
            </div>
          </>
        )
      )}
      
      <PeekModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedItem || {}}
        selectedCsvData={selectedCsvData}
      />
    </div>
  );
};

export default RightSideBar;