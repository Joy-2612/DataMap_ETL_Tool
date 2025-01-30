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
    style: { fontWeight: "bold" },
  },
];

const initialEdges = [];

const FlowDiagrams = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarToggle, setSidebarToggle] = useState(false);
  const userId = localStorage.getItem("userId");

  const onConnect = useCallback(
    (params) => {
      const targetNode = nodes.find(node => node.id === params.target);
      if (targetNode?.data?.type === 'action') {
        setEdges((eds) => addEdge(params, eds));
      } else {
        const hasExistingConnection = edges.some(edge => edge.target === params.target);
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
      const itemId = event.dataTransfer.getData("text/plain");
      const itemName = event.dataTransfer.getData("text/name");

      if (!reactFlowInstance) return;

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
      id: `${item.type || 'output'}-${item.id}-${Date.now()}`,
      type: "default",
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { 
        label: item.name,
        type: item.type || 'output',
        actionType: item.actionType // Store the specific action type
      },
      style: item.type === 'action' ? {
        ...item.style,
        minWidth: '150px',
        minHeight: '50px',
      } : {
        border: "1px solid red",
        boxShadow: "0 0 2px red",
        fontWeight: "bold",
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
    // console.log(node);
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