import React, { useState, useEffect } from "react";
import styles from "./RightSideBar.module.css";

const RightSideBar = ({
  onAddNode,
  onAddNodeOutput,
  userId,
  selectedEdge,
  setEdges,
}) => {
  const [datasets, setDatasets] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newNodeName, setNewNodeName] = useState(""); // Track input value for Add Node
  const [activeTab, setActiveTab] = useState("datasets"); // Track active tab

  // Fetch datasets and results from API
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

  // Handle drag and drop for items
  const handleDragStart = (event, item) => {
    event.dataTransfer.setData("text/plain", item.id);
    event.dataTransfer.setData("text/name", item.name);
    event.dataTransfer.effectAllowed = "move";
  };

  // Handle double click on an item to add a node
  const handleDoubleClick = (item) => {
    if (onAddNode) {
      onAddNode(item);
    }
  };

  // Set active tab based on edge selection
  useEffect(() => {
    if (selectedEdge) {
      setActiveTab("edgeActions"); // Show the "Actions" tab when an edge is selected
    } else if (activeTab === "edgeActions") {
      setActiveTab("datasets"); // Reset to "Datasets" if no edge is selected
    }
  }, [selectedEdge]);

  // Handle action click
  const handleActionClick = (action) => {
    if (selectedEdge) {
      const updatedEdge = { ...selectedEdge, label: `Action: ${action}` };
      setEdges((prevEdges) =>
        prevEdges.map((edge) =>
          edge.id === selectedEdge.id ? updatedEdge : edge
        )
      );
    }
  };

  // Render list of items (datasets or results)
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

  // Render action options when an edge is selected
  const renderActionOptions = () => (
    <div className={styles.actionOptions}>
      <div
        className={styles.actionOption}
        onClick={() => handleActionClick("Concatenate")}
      >
        Concatenate
      </div>
      <div
        className={styles.actionOption}
        onClick={() => handleActionClick("Split")}
      >
        Split
      </div>
      <div
        className={styles.actionOption}
        onClick={() => handleActionClick("Merge")}
      >
        Merge
      </div>
      <div
        className={styles.actionOption}
        onClick={() => handleActionClick("Standardize")}
      >
        Standardize
      </div>
      <div
        className={styles.actionOption}
        onClick={() => handleActionClick("Convert to CSV")}
      >
        Convert to CSV
      </div>
      <div
        className={styles.actionOption}
        onClick={() => handleActionClick("Convert to XML/JSON")}
      >
        Convert to XML/JSON
      </div>
    </div>
  );

  // Render Add Node tab
  const renderAddNodeTab = () => (
    <div className={styles.addNodeContainer}>
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
            if (onAddNodeOutput)
              onAddNodeOutput({ id: Date.now().toString(), name: newNodeName });
            setNewNodeName(""); // Clear input after adding the node
          }}
        >
          Add Node
        </button>
      )}
    </div>
  );

  return (
    <div className={styles.sidebar}>
      <div className={styles.tabHeader}>
        {/* Display tabs dynamically based on edge selection */}
        {activeTab !== "edgeActions" && (
          <>
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
          </>
        )}

        {/* Display Actions tab when an edge is selected */}
        {selectedEdge && (
          <div
            className={`${styles.tab} ${
              activeTab === "edgeActions" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("edgeActions")}
          >
            Actions
          </div>
        )}
      </div>

      <div className={styles.tabContent}>
        {/* Show content based on the active tab */}
        {activeTab === "datasets" && renderItems(datasets)}
        {activeTab === "results" && renderItems(results)}
        {activeTab === "addNode" && renderAddNodeTab()}
        {activeTab === "edgeActions" && renderActionOptions()}
      </div>
    </div>
  );
};

export default RightSideBar;
