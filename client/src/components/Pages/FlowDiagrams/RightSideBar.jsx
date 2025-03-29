import React, { useState, useEffect } from "react";
import styles from "./RightSideBar.module.css";
import { FaCodeMerge } from "react-icons/fa6";
import { IoMdAddCircleOutline } from "react-icons/io";
import { PiApproximateEqualsBold } from "react-icons/pi";
import { MdOutlineVerticalSplit } from "react-icons/md";
import {
  FaDatabase,
  FaPlus,
  FaFileCsv,
  FaFileExcel,
  FaArrowLeft,
  FaChartBar,
  FaProjectDiagram,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

import SidebarConcatenate from "./SidebarActions/SidebarConcatenate";
import SidebarSplit from "./SidebarActions/SidebarSplit";
import SidebarStandardize from "./SidebarActions/SidebarStandardize";
import SidebarMerge from "./SidebarActions/SidebarMerge";

const RightSideBar = ({
  onAddNode,
  onAddActionNode,
  onAddNodeOutput,
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

  const actionOptions = [
    {
      id: "concatenate",
      name: "Concatenate",
      color: "#22C55E", // Green
      component: SidebarConcatenate,
      icon: <IoMdAddCircleOutline />,
      description: "Combine multiple datasets vertically",
    },
    {
      id: "split",
      name: "Split",
      color: "#EC4899", // Pink
      component: SidebarSplit,
      icon: <MdOutlineVerticalSplit />,
      description: "Divide dataset by columns or conditions",
    },
    {
      id: "merge",
      name: "Merge",
      color: "#3B82F6", // Blue
      component: SidebarMerge,
      icon: <FaCodeMerge />,
      description: "Join datasets using common keys",
    },
    {
      id: "standardize",
      name: "Standardize",
      color: "#F97316", // Orange
      component: SidebarStandardize,
      icon: <PiApproximateEqualsBold />,
      description: "Normalize data formats and values",
    },
  ];

  useEffect(() => {
    if (selectedNode) {
      if (selectedNode.data?.type === "action") {
        const action = actionOptions.find(
          (opt) => opt.id === selectedNode.data.actionType
        );
        if (action) {
          setSelectedAction(action);
          setShowParametersView(true);
        }
      } else {
        setSelectedAction(null);
        setShowParametersView(false);
        setActiveTab("data");
      }
    }

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

    if (userId) {
      fetchData();
    }
  }, [userId, selectedNode]);

  const handleDragStart = (event, item) => {
    event.dataTransfer.setData("text/id", item._id);
    event.dataTransfer.setData("text/name", item.name);
    event.dataTransfer.setData("text/size", item.size);
    event.dataTransfer.setData("text/type", item.type);
    event.dataTransfer.setData("text/nodeType", item.nodeType || "dataset");
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDoubleClick = (item) => {
    if (onAddNode) {
      const nodeData = {
        id: item._id,
        name: item.name,
        size: item.size,
        type: item.type,
      };
      onAddNode(nodeData);
    }
  };

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setShowParametersView(true);

    if (onAddActionNode) {
      onAddActionNode({
        id: Date.now().toString(),
        name: action.name,
        type: "action",
        actionType: action.id,
        nodeType: "Action",
      });
    }
  };

  const handleBackClick = () => {
    setShowParametersView(false);
    setSelectedAction(null);
  };

  const renderDatasetGroup = (title, items, icon) => (
    <div className={styles.datasetGroup}>
      <div className={styles.groupHeader}>
        {icon}
        <h4>{title}</h4>
        <span className={styles.countBadge}>{items.length}</span>
      </div>
      <div className={styles.datasetGrid}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>{title} not found</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDoubleClick={() => handleDoubleClick(item)}
              onClick={() => setSelectedItem(item)}
              className={`${styles.datasetCard} ${
                selectedItem?.id === item.id ? styles.selectedCard : ""
              }`}
            >
              <div className={styles.cardHeader}>
                {item.type === "csv" ? <FaFileCsv /> : <FaFileExcel />}
                <span className={styles.datasetName}>{item.name}</span>
              </div>
              <div className={styles.cardMeta}>
                <span className={styles.fileSize}>
                  {(item.size / 1024).toFixed(1)}KB
                </span>
                <span className={styles.fileType}>{item.type}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderActionButtons = () => (
    <div className={styles.actionsGrid}>
      {actionOptions.map((action) => (
        <button
          key={action.id}
          className={styles.actionCard}
          onClick={() => handleActionSelect(action)}
          style={{ border: `2px solid ${action.color}` }}
        >
          <div
            className={styles.actionIconContainer}
            style={{ backgroundColor: `${action.color}20` }}
          >
            {React.cloneElement(action.icon, {
              style: { color: action.color, fontSize: "1.4rem" },
            })}
          </div>
          <div className={styles.actionTextContainer}>
            <span className={styles.actionName}>{action.name}</span>
            <span className={styles.actionDescription}>
              {action.description}
            </span>
          </div>
          <div
            className={styles.actionHoverIndicator}
            style={{ color: action.color }}
          >
            <FaChevronRight className={styles.chevronIcon} />
          </div>
        </button>
      ))}
    </div>
  );

  const renderOutputNodeCreator = () => (
    <div className={styles.outputCreator}>
      <h4 className={styles.creatorTitle}>
        <FaChartBar /> Create Output Node
      </h4>
      <input
        type="text"
        placeholder="Output name"
        value={newNodeName}
        onChange={(e) => setNewNodeName(e.target.value)}
        className={styles.creatorInput}
      />
      <textarea
        placeholder="Description..."
        value={newNodeDesc}
        onChange={(e) => setNewNodeDesc(e.target.value)}
        className={styles.creatorTextarea}
      />
      <button
        className={styles.creatorButton}
        disabled={!newNodeName || !newNodeDesc}
        onClick={() => {
          if (onAddNodeOutput) {
            onAddNodeOutput({
              id: Date.now().toString(),
              name: newNodeName,
              desc: newNodeDesc,
            });
            setNewNodeName("");
            setNewNodeDesc("");
          }
        }}
      >
        Create Node
      </button>
    </div>
  );

  const renderParametersView = () => {
    if (!selectedAction?.component) return null;
    const ActionComponent = selectedAction.component;

    return (
      <div className={styles.parametersView}>
        <div className={styles.parametersHeader}>
          <button onClick={handleBackClick} className={styles.backButton}>
            <FaArrowLeft />
          </button>
          <div className={styles.parametersTitle}>
            <h2>{selectedAction.name}</h2>
          </div>
        </div>
        <div className={styles.parametersContent}>
          <ActionComponent
            nodeId={selectedNode?.id}
            nodes={nodes}
            setNodes={setNodes}
            datasets_source={datasets_source}
            setDatasets_source={setDatasets_source}
          />
        </div>
      </div>
    );
  };

  const regularContent = (
    <>
      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "data" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("data")}
        >
          <FaDatabase /> Data
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "actions" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("actions")}
        >
          <FaProjectDiagram /> Actions
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "output" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("output")}
        >
          <FaChartBar /> Output
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "data" && (
          <div className={styles.dataContent}>
            <div className={styles.subTabs}>
              <button
                className={`${styles.subTabButton} ${
                  dataSubTab === "source" ? styles.activeSubTab : ""
                }`}
                onClick={() => setDataSubTab("source")}
              >
                Source Datasets
              </button>
              <button
                className={`${styles.subTabButton} ${
                  dataSubTab === "results" ? styles.activeSubTab : ""
                }`}
                onClick={() => setDataSubTab("results")}
              >
                Result Datasets
              </button>
            </div>
            <div className={styles.datasetsScrollContainer}>
              {renderDatasetGroup(
                dataSubTab === "source" ? "Source Datasets" : "Result Datasets",
                dataSubTab === "source" ? datasets : results,
                dataSubTab === "source" ? (
                  <FaFileCsv className={styles.groupIcon} />
                ) : (
                  <FaChartBar className={styles.groupIcon} />
                )
              )}
            </div>
          </div>
        )}

        {activeTab === "output" && (
          <div className={styles.creationPanel}>
            {renderOutputNodeCreator()}
          </div>
        )}

        {activeTab === "actions" && (
          <div className={styles.actionPanel}>
            <h4 className={styles.sectionTitle}>Data Transformations</h4>
            {renderActionButtons()}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className={styles.sidebar}>
      {showParametersView ? renderParametersView() : regularContent}
    </div>
  );
};

export default RightSideBar;
