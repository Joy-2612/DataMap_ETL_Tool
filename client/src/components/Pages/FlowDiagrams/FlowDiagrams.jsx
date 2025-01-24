import React, { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
} from "reactflow";

import RightSideBar from "./RightSideBar";
import styles from "./FlowDiagrams.module.css";
import "reactflow/dist/style.css";

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Start Node" },
    position: { x: 250, y: 0 },
  },
];

const initialEdges = [];

const FlowDiagrams = () => {
  // remove useReactFlow from the top-level and store the instance from onInit
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedEdge, setSelectedEdge] = useState(null);
  const [sidebarToggle, setSidebarToggle] = useState(false);
  const userId = localStorage.getItem("userId");

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Use reactFlowInstance.project(...) within onDrop
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = event.target.getBoundingClientRect();
      const itemId = event.dataTransfer.getData("text/plain");
      const itemName = event.dataTransfer.getData("text/name");

      // If the instance is not ready yet, just return
      if (!reactFlowInstance) {
        return;
      }

      // Convert cursor coordinates to the current zoom/pan scale
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `item-${itemId}-${Date.now()}`,
        type: "default",
        position,
        data: { label: itemName || `Item ${itemId}` },
        style: {
          fontWeight: "bold",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          padding: "10px",
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Handle double-click to add a node
  const handleAddNode = (item) => {
    const newNode = {
      id: `item-${item.id}-${Date.now()}`,
      type: "default",
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { label: item.name },
      style: {
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
      id: `output-${item.id}-${Date.now()}`,
      type: "default",
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { label: item.name },
      style: {
        border: "1px solid red",
        boxShadow: "0 0 2px red",
        fontWeight: "bold",
        padding: "10px",
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // Handle double-click on an edge
  const onEdgeDoubleClick = (event, edge) => {
    event.preventDefault();
    setSelectedEdge(edge);
    setSidebarToggle(true);
  };

  // Reset selected edge when clicking on background or nodes
  const onBackgroundClick = () => {
    setSelectedEdge(null);
    setSidebarToggle(false);
  };

  const onNodeClick = () => {
    setSelectedEdge(null);
    setSidebarToggle(false);
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
            // This is crucial so we get a valid reactFlowInstance in state
            onInit={setReactFlowInstance}
          >
            <MiniMap
              style={{
                transform: "scale(0.5) translate(200px, -50px)",
                transformOrigin: "top left",
              }}
            />
            <Controls
              style={{
                transform: "scale(0.5) translate(-20px, -100px)",
                transformOrigin: "top left",
              }}
            />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        <RightSideBar
          userId={userId}
          onAddNode={handleAddNode}
          onAddNodeOutput={handleAddNodeOutput}
          selectedEdge={selectedEdge}
          setEdges={setEdges}
          sidebarToggle={sidebarToggle}
        />
      </div>
    </ReactFlowProvider>
  );
};

export default FlowDiagrams;
