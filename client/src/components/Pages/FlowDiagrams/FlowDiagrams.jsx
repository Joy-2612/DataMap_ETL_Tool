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
import "reactflow/dist/style.css";
import DatasetNode from "./Nodes/DatasetNode";
import OutputNode from "./Nodes/OutputNode";
import ActionNode from "./Nodes/ActionNode";
import RightSideBar from "./RightSideBar";
import styles from "./FlowDiagrams.module.css";
import { toast } from "sonner"; // For showing toast notifications
import "react-toastify/dist/ReactToastify.css"; // Toast styles

const initialNodes = [];
const initialEdges = [];

const nodeTypes = {
  datasetNode: DatasetNode,
  outputNode: OutputNode,
  actionNode: ActionNode,
};

// Function to update the action nodes with their source nodes
function updateActionNodesWithSourceData(nodes, edges) {
  const actionNodesMap = new Map();

  edges.forEach((edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);

    if (
      sourceNode &&
      targetNode &&
      sourceNode.type === "datasetNode" &&
      targetNode.type === "actionNode"
    ) {
      const actionNodeId = targetNode.id;

      if (!actionNodesMap.has(actionNodeId)) {
        actionNodesMap.set(actionNodeId, {
          ...targetNode,
          data: {
            ...targetNode.data,
            sourcenodes: [],
          },
        });
      }

      const actionNode = actionNodesMap.get(actionNodeId);
      actionNode.data.sourcenodes.push({
        id: sourceNode.id,
        name: sourceNode.data.name,
      });
    }
  });

  return nodes.map((node) =>
    actionNodesMap.has(node.id) ? actionNodesMap.get(node.id) : node
  );
}

// Extract source nodes for action nodes based on stored dataset IDs in sourcenodes

const FlowDiagrams = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarToggle, setSidebarToggle] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const userId = localStorage.getItem("userId");

  const updateSidebarMergeWithSourceData = (actionNode) => {
    if (
      !actionNode?.data?.sourcenodes ||
      actionNode.data.sourcenodes.length === 0
    ) {
      setSelectedNode(actionNode);
      setDatasets([]); // No datasets available
      return;
    }

    const datasets = actionNode.data.sourcenodes.map((source) => ({
      name: source.name,
      id: source.id, // Assuming id info is necessary for column fetching
    }));

    setSelectedNode(actionNode);
    setDatasets(datasets);
  };

  // Deletion callback for custom nodes
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
        // Update action nodes with source nodes data
        const updatedNodes = updateActionNodesWithSourceData(nodes, [
          ...edges,
          params,
        ]);
        setNodes(updatedNodes); // Apply the updated nodes state
        console.log(updatedNodes);
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

      // console.log("Data : ", itemId, itemName, itemType, itemSize);

      if (!reactFlowInstance) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `item-${itemId}-${Date.now()}`,
        type: "datasetNode", // <-- custom node
        position,
        data: {
          name: itemName || `Item ${itemId}`,
          _id: itemId,
          type: itemType,
          size: itemSize,
          nodeType: "Dataset",
          onDelete: handleDeleteNode,
        },
        style: {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          padding: "10px",
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, handleDeleteNode]
  );

  const handleAddNode = (item) => {
    const newNode = {
      id: `${item.type || "dataset"} -${item.id}-${Date.now()}`,
      type: "datasetNode", // Use our custom node
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: {
        name: item.name,
        _id: item.id,
        type: item.type,
        size: item.size,
        nodeType: "Dataset",
        label: item.name,
        onDelete: handleDeleteNode, // So this node can delete itself
      },
      style: {
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
      type: "outputNode",
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: {
        name: item.name,
        label: item.name,
        type: item.type,
        nodeType: "Output",
        description: item.desc,
        actionType: item.actionType, // Store the specific action type
        onDelete: handleDeleteNode,
      },
      style: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        padding: "10px",
      },
    };
    setNodes((nds) => nds.concat(newNode));
    console.log("o/p node: ", newNode);
  };

  const handleAddActionNode = (item) => {
    const newNode = {
      id: `${item.type || "action"}-${item.id}-${Date.now()}`,
      type: "actionNode", // Use the new ActionNode type
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: {
        label: item.name,
        type: item.type || "action",
        nodeType: "Action",
        actionType: item.actionType, // Store the specific action type
        onDelete: handleDeleteNode,
        parameters: {},
      },
      style: {
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

    if (node.type === "actionNode") {
      updateSidebarMergeWithSourceData(node); // Updated to use the correct source nodes
    } else {
      setDatasets([]); // Clear datasets if a non-action node is selected
    }

    console.log(node);
  };

  const generateFlowJSON = () => {
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

  const handleRun = async () => {
    const flowJSON = generateFlowJSON(); // Generate flow data
    toast.info("Processing flow...");
    console.log("Final JSON: ", flowJSON);

    //   try {
    //     const result = await runOperation(flowJSON); // Send data to backend
    //     console.log("Backend Response:", result);

    //     // Update output nodes with dataset details from backend response
    //     const updatedNodes = nodes.map((node) => {
    //       if (node.type === "outputNode") {
    //         return {
    //           ...node,
    //           data: {
    //             ...node.data,
    //             name: result.datasetName,
    //             _id: result.datasetId,
    //             type: result.datasetType,
    //             size: result.datasetSize,
    //           },
    //         };
    //       }
    //       return node;
    //     });

    //     setNodes(updatedNodes); // Update the state with new dataset details
    //     toast.success(`Dataset created: ${result.datasetName} (ID: ${result.datasetId})`);
    //   } catch (error) {
    //     console.error("Error running operation:", error);
    //     toast.error("Failed to create dataset. Please try again.");
    //   }
    //
  };

  return (
    <ReactFlowProvider>
      <div className={styles.runButtonContainer}>
        <button onClick={handleRun} className={styles.runButton}>
          Run
        </button>
      </div>
      <div className={styles.container}>
        {/* Run Button at the top of the flow diagram */}

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
            nodeTypes={nodeTypes}
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
          onAddActionNode={handleAddActionNode}
          selectedEdge={selectedEdge}
          selectedNode={selectedNode}
          setEdges={setEdges}
          nodes={nodes}
          setNodes={setNodes}
          sidebarToggle={sidebarToggle}
          datasets_source={datasets} // Pass datasets
          setDatasets_source={setDatasets} // Pass setDatasets function
        />
      </div>
    </ReactFlowProvider>
  );
};

export default FlowDiagrams;
