import React, { useState, useCallback,useEffect } from "react";
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
import { MdDeleteForever } from "react-icons/md";
import "react-toastify/dist/ReactToastify.css"; // Toast styles
import Modal from "./Modal"; // Import the Modal component

const initialNodes = [];
const initialEdges = [];

const nodeTypes = {
  datasetNode: DatasetNode,
  outputNode: OutputNode,
  actionNode: ActionNode,
};



 
function updateActionNodesWithEdgeData(nodes, edges) {
  const actionNodesMap = new Map();

  // Process each edge to find source and target nodes
  edges.forEach((edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);

    // If the source is a dataset node and the target is an action node
    if (sourceNode && targetNode && sourceNode.type === "datasetNode" && targetNode.type === "actionNode") {
      const actionNodeId = targetNode.id;

      // Initialize the action node in the map if it doesn't exist
      if (!actionNodesMap.has(actionNodeId)) {
        actionNodesMap.set(actionNodeId, {
          ...targetNode,
          data: {
            ...targetNode.data,
            sourcenodes: [], // Array to store source nodes
            destinationNode: null, // Initialize destination node as null
          },
        });
      }

      // Add the source node to the action node's sourcenodes
      const actionNode = actionNodesMap.get(actionNodeId);
      actionNode.data.sourcenodes.push({ id: sourceNode.data._id, name: sourceNode.data.name });
    }

    // If the source is an action node and the target is an output node
    if (sourceNode && targetNode && sourceNode.type === "actionNode" && targetNode.type === "outputNode") {
      const actionNodeId = sourceNode.id; // Use the action node's ID

      // Ensure the action node exists in the map
      if (!actionNodesMap.has(actionNodeId)) {
        actionNodesMap.set(actionNodeId, {
          ...sourceNode,
          data: {
            ...sourceNode.data,
            sourcenodes: sourceNode.data.sourcenodes || [], // Preserve existing sourcenodes
            destinationNode: null, // Initialize destination node as null
          },
        });
      }

      // Update the action node with the destination node
      const actionNode = actionNodesMap.get(actionNodeId);
      actionNode.data.destinationNode = {
        id: targetNode.data._id,
        name: targetNode.data.name,
        description: targetNode.data.description,
      };
    }
  });

  // Return the updated nodes
  return nodes.map((node) => (actionNodesMap.has(node.id) ? actionNodesMap.get(node.id) : node));
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
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [flowJSON, setFlowJSON] = useState(null); // State to store the flow JSON
  const [isLoading, setIsLoading] = useState(false); // State to track loading state
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const updatedNodes = updateActionNodesWithEdgeData(nodes, edges);
    setNodes(updatedNodes);
  }, [edges]); // Re-run when edges change


 
  const updateSidebarMergeWithSourceData = (actionNode) => {
    if (!actionNode?.data?.sourcenodes || actionNode.data.sourcenodes.length === 0) {
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

  const handleActionOperationsOnRun = async (actionNode) => {
    const { actionType, parameters, sourcenodes ,destinationNode} = actionNode.data;
    const datasetIds = sourcenodes.map((source) => source.id);

    console.log("Dataset id: ", datasetIds );

    
  
    try {
      setIsLoading(true);
      let endpoint = "";
      let payload = {};


  
      switch (actionType) {
        case "concatenate":
          endpoint = "http://localhost:5000/api/file/concatenate";
          payload = {
            dataset: datasetIds[0], // Assuming concatenate works on one dataset
            columns: parameters.columns,
            finalColumnName: parameters.finalColumnName,
            delimiter: parameters.delimiter,
            outputFileName: destinationNode.name,
            description: destinationNode.description,  
          };
          console.log("payload is: ",payload);
          break;
  
          case "merge":
            endpoint = "http://localhost:5000/api/file/merge";
            payload = {
              dataset1: datasetIds[0], // First dataset ID
              dataset2: datasetIds[1], // Second dataset ID
              column1: parameters.column1, // Column from dataset1
              column2: parameters.column2, // Column from dataset2
              outputFileName: destinationNode.name,
            description: destinationNode.description,
            };
            break;
    
          case "standardize":
            endpoint = "http://localhost:5000/api/file/standardize";
            payload = {
              datasetId: datasetIds[0], // Dataset ID
              column: parameters.column, // Column to standardize
              mappings: parameters.mappings, // Standardization mappings
              outputFileName: destinationNode.name,
            description: destinationNode.description,
            };
            break;
    
          case "split":
            if (parameters.splitType === "general") {
              endpoint = "http://localhost:5000/api/file/split";
              payload = {
                fileId: datasetIds[0], // Dataset ID
                splits: parameters.splits, // Split configuration
                outputFileName: destinationNode.name,
            description: destinationNode.description,
              };
            } else if (parameters.splitType === "address") {
              endpoint = "http://localhost:5000/api/file/splitAddress";
              payload = {
                fileId: datasetIds[0], // Dataset ID
                addressName: parameters.addressName, // Address column name
                outputFileName: destinationNode.name,
            description: destinationNode.description,
              };
            } else {
              throw new Error("Invalid split type. Must be 'general' or 'address'.");
            }
            break;
  
        default:
          throw new Error(`Unsupported action type: ${actionType}`);
      }
  
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
      console.log("Backend Response:", data); 
  
      if (response.ok) {
        toast.success(`Operation completed successfully! New file ID: ${data.newFileId}`);
        return data; // Return the result for updating output nodes
      } else {
        toast.error(`${data.message}`);
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(`An error occurred while performing the ${actionType} operation.`);
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
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
        const updatedNodes = updateActionNodesWithEdgeData(nodes, [...edges, params]);
        setNodes(updatedNodes); // Apply the updated nodes state
        console.log(updatedNodes);
      } else {
        const hasExistingConnection = edges.some(
          (edge) => edge.target === params.target
        );
        if (!hasExistingConnection) {
          setEdges((eds) => addEdge(params, eds));
          // Update action nodes with source nodes data
          const updatedNodes = updateActionNodesWithEdgeData(nodes, [...edges, params]);
          setNodes(updatedNodes); // Apply the updated nodes state
        }
      }
    },
    [setEdges, nodes, edges, setNodes]
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
        parameters:{},
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
      updateSidebarMergeWithSourceData(node);  // Updated to use the correct source nodes
    } else {
      setDatasets([]);  // Clear datasets if a non-action node is selected
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


     // Check if all action nodes have incoming edges, dataset IDs, and valid parameters
  const actionNodes = flowJSON.nodes.filter((node) => node.type === "actionNode");
  const invalidActionNodes = actionNodes.filter((node) => {
    const incomingEdges = flowJSON.edges.filter((edge) => edge.target === node.id);
    const hasParameters = node.data.parameters && Object.keys(node.data.parameters).length > 0;

    return incomingEdges.length === 0 || !node.data.sourcenodes || node.data.sourcenodes.length === 0 || !hasParameters;
  });

  if (invalidActionNodes.length > 0) {
    toast.error("Please ensure all action nodes have incoming edges, dataset IDs, and valid parameters.");
    return;
  }

  
    setFlowJSON(flowJSON); // Store the flow JSON in state
    // setIsModalOpen(true); // Open the modal
    toast.info("Processing flow...");
    console.log("Final JSON: ", flowJSON);
  

  try {
    // Call handleActionOperationsOnRun for each action node
    const results = await Promise.all(
      actionNodes.map(async (node) => {
        return await handleActionOperationsOnRun(node);
      })
    );

    // Update output nodes with the results
    const updatedNodes = flowJSON.nodes.map((node) => {
      if (node.type === "outputNode") {
        const result = results.find((result) => result.datasetId === node.data._id);
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

    setNodes(updatedNodes); // Update the state with new dataset details
    toast.success("All operations completed successfully!");
  } catch (error) {
    console.error("Error running operation:", error);
    toast.error("Failed to perform operation. Please try again.");
  }
};
 

  const closeModal = () => {
    setIsModalOpen(false); // Close the modal
  };
  

  return (
    <ReactFlowProvider>
      <div className={styles.runButtonContainer}>
          <button onClick={handleRun} className={styles.runButton} disabled={isLoading}>
          {isLoading ? "Processing..." : "Run"}
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
            <MiniMap style={{ transformOrigin: "top left"}} />
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
      {/* Modal to display the JSON */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <pre>{JSON.stringify(flowJSON, null, 2)}</pre>
      </Modal>
    </ReactFlowProvider>
  );
};

export default FlowDiagrams;