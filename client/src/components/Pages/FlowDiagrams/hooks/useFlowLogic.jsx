import { useState, useCallback, useEffect } from "react";
import { useNodesState, useEdgesState, addEdge } from "reactflow";
import { toast } from "sonner";
import { updateActionNodesWithEdgeData } from "../utils/utils";
import { handleActionOperationsOnRun } from "./apiOperations";
import { validateFlowDiagram } from "./validations";

const useFlowLogic = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarToggle, setSidebarToggle] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flowJSON, setFlowJSON] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved nodes and edges from localStorage
  useEffect(() => {
    const savedNodes = JSON.parse(localStorage.getItem("savedNodes")) || [];
    const savedEdges = JSON.parse(localStorage.getItem("savedEdges")) || [];
    setNodes(savedNodes);
    setEdges(savedEdges);
  }, []);

  // Save nodes and edges to localStorage
  useEffect(() => {
    localStorage.setItem("savedNodes", JSON.stringify(nodes));
    localStorage.setItem("savedEdges", JSON.stringify(edges));
  }, [nodes, edges]);

  // Update action nodes with edge data
  useEffect(() => {
    const updatedNodes = updateActionNodesWithEdgeData(nodes, edges);
    console.log("Updated Node ",updatedNodes);
    setNodes(updatedNodes);
  }, [edges]);

  // Handle diagram clearing
  const handleRemoveFlowDiagram = () => {
    setNodes([]);
    setEdges([]);
    localStorage.removeItem("savedNodes");
    localStorage.removeItem("savedEdges");
  };

  // Handle edge connections
  const onConnect = useCallback(
    (params) => {
      const targetNode = nodes.find((node) => node.id === params.target);
      if (targetNode?.data?.type === "action") {
        setEdges((eds) => addEdge(params, eds));
        const updatedNodes = updateActionNodesWithEdgeData(nodes, [...edges, params]);
        setNodes(updatedNodes);
      } else {
        const hasExistingConnection = edges.some((edge) => edge.target === params.target);
        if (!hasExistingConnection) {
          setEdges((eds) => addEdge(params, eds));
          const updatedNodes = updateActionNodesWithEdgeData(nodes, [...edges, params]);
          setNodes(updatedNodes);
        }
      }
    },
    [setEdges, nodes, edges, setNodes]
  );

  // Handle drag-and-drop for nodes
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
      const nodeType = event.dataTransfer.getData("text/nodeType");

      if (!reactFlowInstance) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `item-${itemId}-${Date.now()}`,
        type: "datasetNode",
        position,
        data: {
          name: itemName || `Item ${itemId}`,
          _id: itemId,
          type: itemType,
          size: itemSize,
          nodeType: nodeType,
          onDelete: handleDeleteNode,
        },
        style: {
          backgroundcolor: "red",
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

  // Handle node deletion
  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      toast.success("Node deleted successfully!");
    },
    [setNodes]
  );

  // Handle edge double-click
  const onEdgeDoubleClick = (event, edge) => {
    event.preventDefault();
    setSelectedEdge(edge);
    setSelectedNode(null);
    setSidebarToggle(true);
  };

  // Handle background click
  const onBackgroundClick = () => {
    setSelectedEdge(null);
    setSelectedNode(null);
    setSidebarToggle(true);
  };

  // Handle node click
  const onNodeClick = (event, node) => {
    event.preventDefault();
    setSelectedEdge(null);
    setSelectedNode(node);
    setSidebarToggle(true);
  };

  // Generate flow JSON
  const generateFlowJSON = (nodes, edges) => {
    const flowData = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    };
    return flowData;
  };

  // Handle running the flow diagram
  const handleRun = async () => {
    if (!validateFlowDiagram(nodes, edges)) {
      return;
    }

    const flowJSON = generateFlowJSON(nodes, edges);
    setFlowJSON(flowJSON);
    toast.info("Processing flow...");
    console.log("Final JSON: ", flowJSON);

    try {
      const actionNodes = flowJSON.nodes.filter((node) => node.type === "actionNode");
      const results = await Promise.all(
        actionNodes.map(async (node) => {
          return await handleActionOperationsOnRun(node);
        })
      );

      const updatedNodes = flowJSON.nodes.map((node) => {
        if (node.type === "outputNode") {
          const result = results.find(
            (result) => result && node.data.name === result.datasetName
          );

          if (result) {
            return {
              ...node,
              data: {
                ...node.data,
                name: result.datasetName,
                _id: result.datasetId,
                type: result.datasetType,
                size: result.datasetSize,
              },
            };
          }
        }
        return node;
      });

      setNodes(updatedNodes);
      toast.success("All operations completed successfully!");
    } catch (error) {
      console.error("Error running operation:", error);
      toast.error("Failed to perform operation. Please try again.");
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedEdge,
    selectedNode,
    sidebarToggle,
    datasets,
    isModalOpen,
    flowJSON,
    isLoading,
    reactFlowInstance,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDragOver,
    onDrop,
    onEdgeDoubleClick,
    onBackgroundClick,
    onNodeClick,
    handleRun,
    handleRemoveFlowDiagram,
    closeModal,
  };
};

export default useFlowLogic;