import React, { useEffect, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { toast } from "sonner";
import "react-toastify/dist/ReactToastify.css";
import { FaPlay, FaSave, FaFolderOpen } from "react-icons/fa";
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
    generateFlowJSON,
  } = useFlowLogic();

  const { handleAddNode, handleAddNodeOutput, handleAddActionNode } =
    useFlowUI(setNodes);
  const userId = localStorage.getItem("userId");
  const [templates, setTemplates] = useState([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);

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
  };

  const handleSaveTemplate = () => {
    if (nodes.length === 0) {
      toast.warning("Cannot save an empty diagram as template");
      return;
    }
    setIsSaveTemplateModalOpen(true);
  };

  const confirmSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.warning("Please enter a template name");
      return;
    }

    const newTemplate = {
      id: Date.now().toString(),
      name: templateName,
      description: templateDescription,
      createdAt: new Date().toISOString(),
      flowData: generateFlowJSON(nodes, edges),
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem(
      `flow-templates-${userId}`,
      JSON.stringify(updatedTemplates)
    );

    setTemplateName("");
    setTemplateDescription("");
    setIsSaveTemplateModalOpen(false);
    toast.success("Template saved successfully");
  };

  const handleViewTemplates = () => {
    setIsTemplateModalOpen(true);
  };

  const loadTemplate = (template) => {
    setNodes(template.flowData.nodes);
    setEdges(template.flowData.edges);
    setIsTemplateModalOpen(false);
    toast.success(`Template "${template.name}" loaded`);
  };

  const deleteTemplate = (templateId) => {
    const updatedTemplates = templates.filter((t) => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem(
      `flow-templates-${userId}`,
      JSON.stringify(updatedTemplates)
    );
    toast.success("Template deleted");
  };

  return (
    <ReactFlowProvider>
      <div className={styles.buttonContainer}>
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
        <div className={styles.templateButtons}>
          <button
            onClick={handleSaveTemplate}
            className={styles.templateButton}
            disabled={isClearDiagramDisabled}
          >
            <FaSave /> Save Template
          </button>
          <button
            onClick={handleViewTemplates}
            className={styles.templateButton}
          >
            <FaFolderOpen /> View Templates
          </button>
        </div>
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
            onInit={reactFlowInstance}
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

      {/* Flow JSON Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <pre>{JSON.stringify(flowJSON, null, 2)}</pre>
      </Modal>

      {/* Save Template Modal */}
      <Modal
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
      >
        <div className={styles.templateForm}>
          <h3>Save as Template</h3>
          <div className={styles.formGroup}>
            <label>Template Name *</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Enter template description"
            />
          </div>
          <button onClick={confirmSaveTemplate} className={styles.saveButton}>
            Save Template
          </button>
        </div>
      </Modal>

      {/* View Templates Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      >
        <div className={styles.templatesList}>
          <h3>Saved Templates</h3>
          {templates.length === 0 ? (
            <p>No templates saved yet</p>
          ) : (
            <ul>
              {templates.map((template) => (
                <li key={template.id} className={styles.templateItem}>
                  <div className={styles.templateInfo}>
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                    <small>
                      {new Date(template.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <div className={styles.templateActions}>
                    <button
                      onClick={() => loadTemplate(template)}
                      className={styles.loadButton}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </ReactFlowProvider>
  );
};

export default FlowDiagram;
