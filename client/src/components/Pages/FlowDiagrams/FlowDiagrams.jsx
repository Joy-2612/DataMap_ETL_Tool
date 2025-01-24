import React, { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import RightSideBar from './RightSideBar';
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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdge, setSelectedEdge] = useState(null); // Track the selected edge
  const [sidebarToggle, setSidebarToggle] = useState(false); // Track the sidebar toggle state
  const userId = localStorage.getItem("userId");

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const reactFlowBounds = event.target.getBoundingClientRect();
    const itemId = event.dataTransfer.getData('text/plain');
    const itemName = event.dataTransfer.getData('text/name'); // Optional

    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };

    const newNode = {
      id: `item-${itemId}-${Date.now()}`,  // Adding a timestamp to make the ID unique
      type: 'default',
      position,
      data: { label: itemName || `Item ${itemId}` },
      style: {
        fontWeight: 'bold',  // Make text bold
        overflow: 'hidden',  // Prevent text overflow
        textOverflow: 'ellipsis',  // Ellipsis when text overflows
        whiteSpace: 'nowrap',  // Prevent text from wrapping
        padding: '10px',  // Add padding for better spacing
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  // Handle double-click to add a node
  const handleAddNode = (item) => {
    const newNode = {
      id: `item-${item.id}-${Date.now()}`,  // Adding a timestamp to make the ID unique
      type: 'default',
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { label: item.name },
      style: {
        fontWeight: 'bold',  // Make text bold
        overflow: 'hidden',  // Prevent text overflow
        textOverflow: 'ellipsis',  // Ellipsis when text overflows
        whiteSpace: 'nowrap',  // Prevent text from wrapping
        padding: '10px',  // Add padding for better spacing
      },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const handleAddNodeOutput = (item) => {
    const newNode = {
      id: `output-${item.id}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { label: item.name },
      style: {
        border: '1px solid red', // Red border for output node
        boxShadow: '0 0 2px red', // Optional shadow effect
        fontWeight: 'bold',
        padding: '10px',
      },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  // Handle double-click on an edge
  const onEdgeDoubleClick = (event, edge) => {
    event.preventDefault();
    setSelectedEdge(edge); // Set the selected edge
    setSidebarToggle(true); // Hide all headings except 'Actions'
  };

  // Reset selected edge when clicking on background or nodes (focus loss from edge)
  const onBackgroundClick = () => {
    setSelectedEdge(null); // Remove edge selection
    setSidebarToggle(false); // Reset sidebar state to show all headings
  };

  // Handle node click to remove selection from edge
  const onNodeClick = () => {
    setSelectedEdge(null); // Remove edge selection when node is clicked
    setSidebarToggle(false); // Reset sidebar state to show all headings
  };

  return (
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
          fitView
          onEdgeDoubleClick={onEdgeDoubleClick}  // Attach double-click handler for edges
          onBackgroundClick={onBackgroundClick}  // Reset the edge selection when clicking on background
          onNodeClick={onNodeClick}  // Remove edge selection when clicking on node
        >

          

          <MiniMap style={{
            transform: 'scale(0.5) translate(200px, -50px)',  // Scaling and offsetting
            transformOrigin: 'top left', // Origin of transformation
          }}/>
          
          <Controls style={{
            
            transform: 'scale(0.5) translate(-20px, -100px)',  // Scaling and offsetting
            transformOrigin: 'top left', // Origin of transformation
          }}/>
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Pass selectedEdge to RightSideBar */}
      <RightSideBar userId={userId}
       onAddNode={handleAddNode} 
       onAddNodeOutput={handleAddNodeOutput} 
       selectedEdge={selectedEdge} 
       setEdges={setEdges}  
       sidebarToggle={sidebarToggle} // Pass toggle state to RightSideBar
       />
    </div>
  );
};

export default FlowDiagrams;
