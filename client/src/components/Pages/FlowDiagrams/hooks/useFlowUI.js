import { useCallback } from "react";

const useFlowUI = (setNodes) => {
  const handleAddNode = useCallback(
    (item) => {
      const newNode = {
        id: `${item.type || "dataset"}-${item.id}-${Date.now()}`,
        type: "datasetNode",
        position: { x: Math.random() * 200, y: Math.random() * 200 },
        data: {
          name: item.name,
          _id: item.id,
          type: item.type,
          size: item.size,
          nodeType: "Dataset",
          label: item.name,
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
    [setNodes]
  );

  const handleAddNodeOutput = useCallback(
    (item) => {
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
          actionType: item.actionType,
          onDelete: handleDeleteNode,
          size: null,
          _id: null,
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
    [setNodes]
  );

  const handleAddActionNode = useCallback(
    (item) => {
      const newNode = {
        id: `${item.type || "action"}-${item.id}-${Date.now()}`,
        type: "actionNode",
        position: { x: Math.random() * 200, y: Math.random() * 200 },
        data: {
          label: item.name,
          type: item.type || "action",
          nodeType: "Action",
          actionType: item.actionType,
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
    },
    [setNodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    },
    [setNodes]
  );

  return { handleAddNode, handleAddNodeOutput, handleAddActionNode };
};

export default useFlowUI;
