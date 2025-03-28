import React, { useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { toast } from "sonner";
import { FaPlay } from "react-icons/fa";
import useFlowLogic from "../FlowDiagrams/hooks/useFlowLogic";
import useFlowUI from "../FlowDiagrams/hooks/useFlowUI";
import RightSideBar from "./RightSideBar";
import Modal from "./Modal/Modal";
import styles from "./FlowDiagrams.module.css";
import DatasetNode from "./Nodes/DatasetNode";
import ActionNode from "./Nodes/ActionNode";
import OutputNode from "./Nodes/OutputNode";

const nodeTypes = {
  datasetNode: DatasetNode,
  outputNode: OutputNode,
  actionNode: ActionNode,
};

const FlowDiagram = () => {
  const {
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
    // The important setter for the ReactFlow instance:
    setReactFlowInstance,
  } = useFlowLogic();

  // For your custom UI hook (optional, if you need it)
  const { handleAddNode, handleAddNodeOutput, handleAddActionNode } =
    useFlowUI(setNodes);

  const userId = localStorage.getItem("userId");

  // Disable the "Clear Diagram" button if there are no nodes
  const isClearDiagramDisabled = nodes.length === 0;

  // Save nodes and edges to localStorage whenever they change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const flowData = { nodes, edges };
      localStorage.setItem(`flow-diagram-${userId}`, JSON.stringify(flowData));
    }
  }, [nodes, edges, userId]);

  // Load saved nodes and edges from localStorage on component mount
  useEffect(() => {
    const savedFlow = localStorage.getItem(`flow-diagram-${userId}`);
    if (savedFlow) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedFlow);

        if (savedNodes && savedNodes.length > 0) {
          setNodes(savedNodes);
        }

        if (savedEdges && savedEdges.length > 0) {
          setEdges(savedEdges);
        }
      } catch (error) {
        console.error("Error loading saved flow diagram:", error);
        toast.error("Failed to load saved diagram");
      }
    }
  }, [userId, setNodes, setEdges]);

  // Clear localStorage when flowDiagram is cleared
  const handleClearDiagram = () => {
    handleRemoveFlowDiagram();
    localStorage.removeItem(`flow-diagram-${userId}`);
    toast.success("Flow diagram cleared");
  };

  return (
    <ReactFlowProvider>
      <div className={styles.runButtonContainer}>
        <button
          onClick={handleRun}
          className={styles.runButton}
          disabled={isClearDiagramDisabled}
        >
          {isLoading ? "Processing..." : <FaPlay />}
        </button>
        <button
          onClick={handleClearDiagram}
          className={styles.removeButton}
          disabled={isClearDiagramDisabled}
        >
          Clear Diagram
        </button>
      </div>

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
            // Updated: store the instance
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
          datasets_source={datasets}
          setDatasets_source={datasets}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <pre>{JSON.stringify(flowJSON, null, 2)}</pre>
      </Modal>
    </ReactFlowProvider>
  );
};

export default FlowDiagram;
