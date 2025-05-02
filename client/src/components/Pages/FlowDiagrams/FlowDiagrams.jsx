import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { toast } from "sonner";
import { FaPlay, FaSave, FaFolderOpen, FaTrash } from "react-icons/fa";
import useFlowLogic from "../FlowDiagrams/hooks/useFlowLogic";
import useFlowUI from "../FlowDiagrams/hooks/useFlowUI";
import RightSideBar from "./RightSideBar/RightSideBar";
import Modal from "./Modal/Modal";
import SaveTemplateModal from "./Modal/SaveTemplateModal";
import ViewTemplatesModal from "./Modal/ViewTemplatesModal";
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
    generateFlowJSON,
    handleDragStart,
  } = useFlowLogic();

  // ADDED: State for result datasets
  const [resultDatasets, setResultDatasets] = useState([]);

  const { handleAddNode, handleAddNodeOutput, handleAddActionNode } =
    useFlowUI(setNodes);
  const userId = localStorage.getItem("userId");
  const [templates, setTemplates] = useState([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [resetTabTrigger, setResetTabTrigger] = useState(0);

  // Disable the "Clear Diagram" button if there are no nodes
  const isClearDiagramDisabled = nodes.length === 0;

  const prevNodesLength = useRef(nodes.length);
  useEffect(() => {
    if (nodes.length < prevNodesLength.current) {
      setResetTabTrigger((prev) => prev + 1);
    }
    prevNodesLength.current = nodes.length;
  }, [nodes.length]);

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

    // Load templates
    const savedTemplates = localStorage.getItem(`flow-templates-${userId}`);
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, [userId, setNodes, setEdges]);

  // Clear localStorage when flowDiagram is cleared
  const handleClearDiagram = () => {
    handleRemoveFlowDiagram();
    localStorage.removeItem(`flow-diagram-${userId}`);
    toast.success("Flow diagram cleared");
    setIsSidebarCollapsed(false);
  };

  const handleSaveTemplate = () => {
    if (nodes.length === 0) {
      toast.warning("Cannot save an empty diagram as template");
      return;
    }
    setIsSaveTemplateModalOpen(true);
  };

  const handleSaveTemplateConfirm = (name, description) => {
    const newTemplate = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: new Date().toISOString(),
      flowData: generateFlowJSON(nodes, edges),
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem(
      `flow-templates-${userId}`,
      JSON.stringify(updatedTemplates)
    );
    toast.success("Template saved successfully");
    setIsSaveTemplateModalOpen(false);
  };

  const handleLoadTemplate = (template) => {
    setNodes(template.flowData.nodes);
    setEdges(template.flowData.edges);
    setIsTemplateModalOpen(false);
    toast.success(`Template "${template.name}" loaded`);
  };

  const handleDatasetDragStart = useCallback((event, item) => {
    event.dataTransfer.setData("application/reactflow", "datasetNode");
    event.dataTransfer.setData("dataset", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDeleteTemplate = (templateId) => {
    const updatedTemplates = templates.filter((t) => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem(
      `flow-templates-${userId}`,
      JSON.stringify(updatedTemplates)
    );
    toast.success("Template deleted");
  };

  const runWorkflow = async () => {
    // Check if all output nodes already have datasets
    const outputNodes = nodes.filter((node) => node.type === "outputNode");
    const outputNodesWithoutDatasets = outputNodes.filter(
      (node) => !node.data._id
    );

    if (outputNodes.length > 0 && outputNodesWithoutDatasets.length === 0) {
      toast.info(
        "All output datasets are already created. No need to run again."
      );
      return;
    }

    // Continue with normal run process
    await handleRun();
    await refreshResultDatasets();
  };

  // ADDED: Function to refresh result datasets
  const refreshResultDatasets = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch(
        `http://localhost:5000/api/file/results/${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const resultsData = await response.json();
      setResultDatasets(resultsData.data || []);
    } catch (error) {
      console.error("Error fetching result datasets:", error);
    }
  }, []);

  // ADDED: Load result datasets on component mount
  useEffect(() => {
    refreshResultDatasets();
  }, [refreshResultDatasets]);

  return (
    <ReactFlowProvider>
      <div className={styles.topBar}>
        <div className={styles.leftControls}>
          <button
            onClick={runWorkflow}
            className={styles.runButton}
            disabled={isClearDiagramDisabled}
          >
            {isLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              <>
                <FaPlay /> Run Workflow
              </>
            )}
          </button>
          <button
            onClick={handleClearDiagram}
            className={styles.clearButton}
            disabled={isClearDiagramDisabled}
          >
            <FaTrash /> Clear
          </button>
        </div>
        <div className={styles.rightControls}>
          <button
            onClick={handleSaveTemplate}
            className={styles.templateButton}
            id={styles.savetemp}
            disabled={isClearDiagramDisabled}
          >
            <FaSave /> Save Template
          </button>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className={styles.templateButton}
          >
            <FaFolderOpen /> View Templates
          </button>
        </div>
      </div>

      <div className={styles.workarea}>
        <div className={styles.flowWrapper}>
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
            nodeTypes={nodeTypes}
          >
            <MiniMap className={styles.minimap} />
            <Controls className={styles.controls} />
            <Background variant="dots" gap={40} size={1} />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className={styles.emptyState}>
              <h3>Welcome to Workflow Builder</h3>
              <p>Drag nodes from the right panel to get started</p>
            </div>
          )}
        </div>

        <RightSideBar
          userId={userId}
          onAddNode={handleAddNode}
          onAddNodeOutput={handleAddNodeOutput}
          selectedNodeId={selectedNode?.id}
          onAddActionNode={handleAddActionNode}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          selectedEdge={selectedEdge}
          selectedNode={selectedNode}
          setEdges={setEdges}
          nodes={nodes}
          setNodes={setNodes}
          sidebarToggle={sidebarToggle}
          datasets_source={datasets}
          setDatasets_source={datasets}
          onClear={handleClearDiagram}
          resetTabTrigger={resetTabTrigger}
          handleDragStart={handleDragStart}
          results={resultDatasets}
        />
      </div>

      {/* Flow JSON Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <pre>{JSON.stringify(flowJSON, null, 2)}</pre>
      </Modal>

      {/* Template Modals */}
      <SaveTemplateModal
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        onSave={handleSaveTemplateConfirm}
      />

      <ViewTemplatesModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        onLoadTemplate={handleLoadTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />
    </ReactFlowProvider>
  );
};

export default FlowDiagram;
