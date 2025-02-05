import React, { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { CiSettings } from "react-icons/ci";
import { FaDatabase } from "react-icons/fa6";

import RightSideBar from "./RightSideBar";
import styles from "./FlowDiagrams.module.css";

const initialNodes = [];
const initialEdges = [];

/**
 * 1. Define a custom node component.
 *
 *    - Renders the node label
 *    - If the node is selected, show an options button (⋮)
 *    - When clicked, show a small tooltip with a "Delete" button
 */
function DatasetNode({ id, data, selected }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleOptionsClick = (event) => {
    event.stopPropagation(); // Prevent triggering onNodeClick
    setShowTooltip((prev) => !prev);
  };

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "rgb(24 144 28 / 8%)",
        textAlign: "left",
        color: "#333",
        padding: "16px",
        border: "2px solid rgb(24 144 28 / 76%)",
        borderRadius: "8px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        minWidth: 150,
        overflow: "visible",
      }}
    >
      {/* Add a target handle at the top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#555", width: "8px", height: "8px" }}
      />

      {/* Main content of the node */}
      <div style={{ color: "black", marginBottom: "8px" }}>
        <FaDatabase />
      </div>
      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={data.name}
        >
          {data.name}
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>ID: {data._id}</div>
        <div
          style={{
            fontSize: "12px",
            color: "#666",
            marginTop: "4px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Type: {data.type}</span>
          <span>Size: {data.size}</span>
        </div>
      </div>

      {/* Add a source handle at the bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#555", width: "8px", height: "8px" }}
      />

      {selected && (
        <div style={{ position: "absolute", top: "8px", right: "8px" }}>
          {/* Options Icon */}
          <button
            onClick={(event) => {
              event.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
            style={{
              background: "none",
              padding: 0,
              border: "none",
              color: "#333",
              cursor: "pointer",
              fontSize: "16px",
            }}
            title="Options"
          >
            <CiSettings />
          </button>

          {/* Tooltip with "Delete" Button */}
          {showTooltip && (
            <div
              style={{
                position: "absolute",
                top: "-35px",
                right: "0",
                fontSize: "10px",
                background: "#fff",
                color: "#333",
                borderRadius: "4px",
                padding: "4px 6px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                zIndex: 999,
              }}
            >
              <button
                style={{
                  background: "red",
                  color: "white",
                  border: "none",
                  fontSize: "10px",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  cursor: "pointer",
                }}
                onClick={() => data.onDelete(id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 2. Register custom node types for ReactFlow.
 *    You could add more keys if you need different custom node UIs.
 */
const nodeTypes = {
  datasetNode: DatasetNode,
};

const FlowDiagrams = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarToggle, setSidebarToggle] = useState(false);
  const userId = localStorage.getItem("userId");

  // 3. Deletion callback for custom nodes
  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    },
    [setNodes]
  );

  const onConnect = useCallback(
    (params) => {
      const targetNode = nodes.find((node) => node.id === params.target);
      if (targetNode?.data?.type === "action") {
        setEdges((eds) => addEdge(params, eds));
      } else {
        const hasExistingConnection = edges.some(
          (edge) => edge.target === params.target
        );
        if (!hasExistingConnection) {
          setEdges((eds) => addEdge(params, eds));
        }
      }
    },
    [setEdges, nodes, edges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = event.target.getBoundingClientRect();
      const itemId = event.dataTransfer.getData("text/id");
      const itemName = event.dataTransfer.getData("text/name");
      const itemType = event.dataTransfer.getData("text/type");
      const itemSize = event.dataTransfer.getData("text/size");

      console.log("Data : ", itemId, itemName, itemType, itemSize);

      if (!reactFlowInstance) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // 4. Use our custom node type + pass in handleDeleteNode
      const newNode = {
        id: `item-${itemId}-${Date.now()}`,
        type: "datasetNode", // <-- custom node
        position,
        data: {
          name: itemName || `Item ${itemId}`,
          _id: itemId,
          type: itemType,
          size: itemSize,
          onDelete: handleDeleteNode,
        },
        style: {
          // Additional inline styles you prefer
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, handleDeleteNode]
  );

  /**
   * Example add-node functions, updated to use the `datasetNode` type
   * and pass `onDelete`.
   */
  const handleAddNode = (item) => {
    const newNode = {
      id: `item-${item.id}-${Date.now()}`,
      type: "datasetNode", // Use our custom node
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: {
        label: item.name,
        onDelete: handleDeleteNode, // So this node can delete itself
      },
      style: {
        // You can keep or enhance your style here as desired:
        fontWeight: "bold",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        padding: "10px",
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleAddNodeOutput = (item) => {
    const newNode = {
      id: `${item.type || "output"}-${item.id}-${Date.now()}`,
      type: "datasetNode",
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: {
        label: item.name,
        type: item.type || "output",
        actionType: item.actionType, // Store the specific action type
        onDelete: handleDeleteNode,
      },
      style:
        item.type === "action"
          ? {
              ...item.style,
              minWidth: "150px",
              minHeight: "50px",
            }
          : {
              border: "2px solid red",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              padding: "10px",
            },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onEdgeDoubleClick = (event, edge) => {
    event.preventDefault();
    setSelectedEdge(edge);
    setSelectedNode(null);
    setSidebarToggle(true);
  };

  const onBackgroundClick = () => {
    setSelectedEdge(null);
    setSelectedNode(null);
    setSidebarToggle(true);
  };

  const onNodeClick = (event, node) => {
    event.preventDefault();
    setSelectedEdge(null);
    setSelectedNode(node);
    setSidebarToggle(true);
    console.log(node);
  };

  return (
    <ReactFlowProvider>
      <div className={styles.container}>
        <div className={styles.flowContainer}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onBackgroundClick={onBackgroundClick}
            onNodeClick={onNodeClick}
            fitView
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes} // 5. Make sure to supply your custom node types
          >
            <MiniMap style={{ transformOrigin: "top left" }} />
            <Controls style={{ transformOrigin: "top left" }} />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        <RightSideBar
          userId={userId}
          onAddNode={handleAddNode}
          onAddNodeOutput={handleAddNodeOutput}
          selectedEdge={selectedEdge}
          selectedNode={selectedNode}
          setEdges={setEdges}
          sidebarToggle={sidebarToggle}
        />
      </div>
    </ReactFlowProvider>
  );
};

export default FlowDiagrams;
