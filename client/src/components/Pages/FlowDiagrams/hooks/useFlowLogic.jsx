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

  // Load saved nodes and edges from localStorage (if you want them separate from flow-diagram-userId)
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

  // Update action nodes with edge data whenever edges change
  useEffect(() => {
    const updatedNodes = updateActionNodesWithEdgeData(nodes, edges);
    setNodes(updatedNodes);
  }, [edges]);

  // Handle clearing the diagram
  const handleRemoveFlowDiagram = () => {
    setNodes([]);
    setEdges([]);
    localStorage.removeItem("savedNodes");
    localStorage.removeItem("savedEdges");
  };

  // Handle creating new edges
  const onConnect = useCallback(
    (params) => {
      const targetNode = nodes.find((node) => node.id === params.target);

      if (targetNode?.data?.type === "action") {
        // If target is an action node, just connect
        setEdges((eds) => addEdge(params, eds));
        const updatedNodes = updateActionNodesWithEdgeData(nodes, [
          ...edges,
          params,
        ]);
        setNodes(updatedNodes);
      } else {
        // For other nodes, ensure no duplicate target connections
        const hasExistingConnection = edges.some(
          (edge) => edge.target === params.target
        );
        if (!hasExistingConnection) {
          setEdges((eds) => addEdge(params, eds));
          const updatedNodes = updateActionNodesWithEdgeData(nodes, [
            ...edges,
            params,
          ]);
          setNodes(updatedNodes);
        }
      }
    },
    [setEdges, nodes, edges, setNodes]
  );

  // DRAG & DROP handlers
  const onDragOver = useCallback((event) => {
    // Must call preventDefault to allow onDrop
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      // Where you dropped inside the DOM
      const reactFlowBounds = event.target.getBoundingClientRect();

      // Data from handleDragStart in RightSideBar
      const itemId = event.dataTransfer.getData("text/id");
      const itemName = event.dataTransfer.getData("text/name");
      const itemType = event.dataTransfer.getData("text/type");
      const itemSize = event.dataTransfer.getData("text/size");
      const nodeType = event.dataTransfer.getData("text/nodeType");

      if (!itemId) return; // If there's no data, do nothing

      // Convert (x, y) from screen coords to React Flow coords
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Decide what node type to use in React Flow
      // (If nodeType is "Action", we might use actionNode, etc.)
      let newNodeType = "datasetNode";
      if (nodeType === "Action") {
        newNodeType = "actionNode";
      } else if (nodeType === "Output") {
        newNodeType = "outputNode";
      }

      const newNode = {
        // Unique ID
        id: `item-${itemId}-${Date.now()}`,
        type: newNodeType,
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
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          padding: "10px",
        },
      };

      // Add the new node
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Delete a node
  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      toast.success("Node deleted successfully!");
    },
    [setNodes]
  );

  // Edge double-click
  const onEdgeDoubleClick = (event, edge) => {
    event.preventDefault();
    setSelectedEdge(edge);
    setSelectedNode(null);
    setSidebarToggle(true);
  };

  // Background click
  const onBackgroundClick = () => {
    setSelectedEdge(null);
    setSelectedNode(null);
    setSidebarToggle(true);
  };

  // Node click
  const onNodeClick = (event, node) => {
    event.preventDefault();
    setSelectedEdge(null);
    setSelectedNode(node);
    setSidebarToggle(true);
  };

  // Generate JSON representation
  const generateFlowJSON = (nodes, edges) => {
    return {
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
  };

  // Handle "Run" button
  const handleRun = async () => {
    if (!validateFlowDiagram(nodes, edges)) {
      return;
    }

    const flowJSON = generateFlowJSON(nodes, edges);
    setFlowJSON(flowJSON);
    toast.info("Processing flow...");
    console.log("Final JSON: ", flowJSON);

    try {
      const actionNodes = flowJSON.nodes.filter(
        (node) => node.type === "actionNode"
      );
      const results = await Promise.all(
        actionNodes.map(async (node) => {
          return await handleActionOperationsOnRun(node);
        })
      );

      // Update output nodes with the result data
      const updatedNodes = flowJSON.nodes.map((node) => {
        if (node.type === "outputNode") {
          const result = results.find(
            (r) => r && node.data.name === r.datasetName
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
    // expose these handlers so FlowDiagram can use them
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
    // store and export the instance setter:
    setReactFlowInstance,
  };
};

export default useFlowLogic;
