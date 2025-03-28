import React, { useState, useEffect } from "react";
import styles from "./RightSideBar.module.css";
import {
  FaDatabase,
  FaPlus,
  FaChevronDown,
  FaChevronRight,
  FaArrowLeft,
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
  const [datasets1, setDatasets1] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeDesc, setNewNodeDesc] = useState("");
  const [activeTab, setActiveTab] = useState("datasets");
  const [isLoadedOpen, setIsLoadedOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showParametersView, setShowParametersView] = useState(false);

  const actionOptions = [
    {
      id: "concatenate",
      name: "Concatenate",
      color: "blue",
      component: SidebarConcatenate,
    },
    { id: "split", name: "Split", color: "blue", component: SidebarSplit },
    { id: "merge", name: "Merge", color: "blue", component: SidebarMerge },
    {
      id: "standardize",
      name: "Standardize",
      color: "blue",
      component: SidebarStandardize,
    },
  ];

  // Fetch data whenever userId or selectedNode changes
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
        setActiveTab("datasets");
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

        setDatasets1(datasetsData.data || []);
        setResults(resultsData.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, selectedNode]);

  // When dragging starts, set the data for dropping
  const handleDragStart = (event, item) => {
    console.log("Dragging item: ", item);
    event.dataTransfer.setData("text/id", item._id);
    event.dataTransfer.setData("text/name", item.name);
    event.dataTransfer.setData("text/size", item.size);
    event.dataTransfer.setData("text/type", item.type);
    // If nodeType isn't set, default to "dataset"
    event.dataTransfer.setData("text/nodeType", item.nodeType || "dataset");
    event.dataTransfer.effectAllowed = "move";
  };

  // Double-click to add node instantly (optional)
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

  // Renders the list of items (dataset or results)
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

  const renderAddNodeAccordion = () => (
    <div className={styles.accordion}>
      <div
        className={styles.accordionHeader}
        onClick={() => setIsAddNodeOpen(!isAddNodeOpen)}
      >
        Output Node {isAddNodeOpen ? <FaChevronDown /> : <FaChevronRight />}
      </div>
      {isAddNodeOpen && (
        <div className={styles.accordionContent}>
          <input
            type="text"
            placeholder="Output Node name"
            title="Enter the name of the new dataset to store result"
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            className={styles.nodeInput}
          />
          <input
            type="text"
            placeholder="Enter Description"
            title="Enter the new node's description"
            value={newNodeDesc}
            onChange={(e) => setNewNodeDesc(e.target.value)}
            className={styles.nodeInput}
          />
          <button
            className={styles.addNodeButton}
            disabled={!newNodeName || !newNodeDesc}
            onClick={() => {
              if (newNodeName && newNodeDesc && onAddNodeOutput) {
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
            Add Node
          </button>
        </div>
      )}
    </div>
  );

  const renderActionsAccordion = () => (
    <div className={styles.accordion}>
      <div
        className={styles.accordionHeader}
        onClick={() => setIsActionsOpen(!isActionsOpen)}
      >
        Action Nodes {isActionsOpen ? <FaChevronDown /> : <FaChevronRight />}
      </div>
      {isActionsOpen && (
        <div className={styles.accordionContent}>
          {actionOptions.map((action) => (
            <div
              key={action.id}
              className={`${styles.actionItem} ${
                selectedAction?.id === action.id ? styles.selectedAction : ""
              }`}
              onClick={() => handleActionSelect(action)}
            >
              {action.name}
            </div>
          ))}
        </div>
      )}
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
            nodeId={selectedNode?.id} // Pass the selected node's ID
            nodes={nodes} // Pass the nodes array
            setNodes={setNodes} // Pass the setNodes function
            datasets_source={datasets_source}
            setDatasets_source={setDatasets_source}
          />
        </div>
      </div>
    );
  };

  // Regular content if we're not in parameters view
  const regularContent = (
    <>
      <div className={styles.tabHeader}>
        <div
          className={`${styles.tab} ${
            activeTab === "datasets" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("datasets")}
        >
          <FaDatabase title="Datasets" className={styles.icon} />
        </div>
        <div
          className={`${styles.tab} ${
            activeTab === "addNode" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("addNode")}
        >
          <FaPlus title="Add Node" className={styles.icon} />
        </div>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "datasets" && (
          <>
            <div className={styles.accordion}>
              <div
                className={styles.accordionHeader}
                onClick={() => setIsLoadedOpen(!isLoadedOpen)}
              >
                Loaded Datasets{" "}
                {isLoadedOpen ? <FaChevronDown /> : <FaChevronRight />}
              </div>
              {isLoadedOpen && renderItems(datasets1)}
            </div>
            <div className={styles.accordion}>
              <div
                className={styles.accordionHeader}
                onClick={() => setIsResultsOpen(!isResultsOpen)}
              >
                Result Datasets{" "}
                {isResultsOpen ? <FaChevronDown /> : <FaChevronRight />}
              </div>
              {isResultsOpen && renderItems(results)}
            </div>
          </>
        )}

        {activeTab === "addNode" && (
          <div className={styles.addNodeSection}>
            {renderAddNodeAccordion()}
            {renderActionsAccordion()}
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
