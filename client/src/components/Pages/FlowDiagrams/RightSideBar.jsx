import React, { useState, useEffect } from "react";
import styles from "./RightSideBar.module.css";
import Concatenate from "../../Features/Concatenate/Concatenate";
import Split from "../../Features/Split/Split";
import Standardize from "../../Features/Standardize/Standardize";
import Merge from "../../Features/Merge/Merge";
import Convert from "../../Features/Convert/Convert";
import ConvertBack from "../../Features/ConvertBack/ConvertBack";

const RightSideBar = ({
  onAddNode,
  onAddNodeOutput,
  userId,
  selectedEdge,
  selectedNode,
  setEdges,
}) => {
  const [datasets, setDatasets] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newNodeName, setNewNodeName] = useState("");
  const [activeTab, setActiveTab] = useState("datasets"); // Default to "datasets"
  const [nodeType, setNodeType] = useState("regular");
  const [isHidden, setIsHidden] = useState(true);

  // NEW: Control modal visibility
  const [showModal, setShowModal] = useState(false);

  const actionOptions = [
    {
      id: "concatenate",
      name: "Concatenate",
      color: "blue",
      component: Concatenate,
    },
    { id: "split", name: "Split", color: "blue", component: Split },
    { id: "merge", name: "Merge", color: "blue", component: Merge },
    {
      id: "standardize",
      name: "Standardize",
      color: "blue",
      component: Standardize,
    },
    {
      id: "convertCSV",
      name: "Convert to CSV",
      color: "blue",
      component: Convert,
    },
    {
      id: "convertXML",
      name: "Convert to XML/JSON",
      color: "blue",
      component: ConvertBack,
    },
  ];

  // Determine if the currently selected node is an action node
  const isActionNode = selectedNode?.data?.type === "action";
  // Find which action node it is
  const selectedAction = isActionNode
    ? actionOptions.find((action) => action.id === selectedNode.data.actionType)
    : null;

  // Whenever the selectedNode changes, decide whether to show the modal
  useEffect(() => {
    if (isActionNode && selectedAction) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isActionNode, selectedAction]);

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

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleDragStart = (event, item) => {
    event.dataTransfer.setData("text/plain", item.id);
    event.dataTransfer.setData("text/name", item.name);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDoubleClick = (item) => {
    if (onAddNode) {
      onAddNode(item);
    }
  };

  // Render the correct action component in the modal
  const renderActionComponent = () => {
    if (!selectedAction?.component) return null;

    const ActionComponent = selectedAction.component;
    return (
      <ActionComponent
        nodeId={selectedNode.id}
        isHidden={isHidden}
        // Pass additional props if needed
      />
    );
  };

  const renderItems = (items) => (
    <div className={styles.itemsContainer}>
      {items.length === 0 ? (
        <div className={styles.emptyState}>No items found</div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDoubleClick={() => handleDoubleClick(item)}
            onClick={() => setSelectedItem(item)}
            className={`${styles.draggableItem} ${
              selectedItem?.id === item.id ? styles.selectedItem : ""
            }`}
          >
            {item.name}
          </div>
        ))
      )}
    </div>
  );

  const renderAddNodeTab = () => (
    <div className={styles.addNodeContainer}>
      <select
        className={styles.nodeTypeSelect}
        value={nodeType}
        onChange={(e) => setNodeType(e.target.value)}
      >
        <option value="regular">Regular Node</option>
        <option value="action">Action Node</option>
      </select>

      {nodeType === "regular" ? (
        <>
          <input
            type="text"
            placeholder="Enter node name"
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            className={styles.nodeInput}
          />
          {newNodeName && (
            <button
              className={styles.addNodeButton}
              onClick={() => {
                if (onAddNodeOutput) {
                  onAddNodeOutput({
                    id: Date.now().toString(),
                    name: newNodeName,
                  });
                }
                setNewNodeName("");
              }}
            >
              Add Node
            </button>
          )}
        </>
      ) : (
        <div className={styles.actionNodeSelect}>
          <select
            className={styles.actionSelect}
            onChange={(e) => {
              const selectedAction = actionOptions.find(
                (action) => action.id === e.target.value
              );
              if (selectedAction) {
                onAddNodeOutput({
                  id: Date.now().toString(),
                  name: selectedAction.name,
                  type: "action",
                  actionType: selectedAction.id,
                  style: {
                    border: "2px solid blue",
                    borderRadius: "4px",
                    padding: "10px",
                    backgroundColor: "#f8f9fa",
                  },
                });
              }
            }}
          >
            <option value="">Select Action</option>
            {actionOptions.map((action) => (
              <option key={action.id} value={action.id}>
                {action.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.sidebar}>
      {/* Modal for action forms */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* Optional modal header */}
            <div className={styles.modalHeader}>
              <h3>{selectedAction?.name}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            {/* Render the action form inside the modal */}
            <div className={styles.modalBody}>{renderActionComponent()}</div>
          </div>
        </div>
      )}

      <div className={styles.tabHeader}>
        <div
          className={`${styles.tab} ${
            activeTab === "datasets" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("datasets")}
        >
          Datasets
        </div>
        <div
          className={`${styles.tab} ${
            activeTab === "results" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("results")}
        >
          Results
        </div>
        <div
          className={`${styles.tab} ${
            activeTab === "addNode" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("addNode")}
        >
          Add Node
        </div>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "datasets" && renderItems(datasets)}
        {activeTab === "results" && renderItems(results)}
        {activeTab === "addNode" && renderAddNodeTab()}
      </div>
    </div>
  );
};

export default RightSideBar;
