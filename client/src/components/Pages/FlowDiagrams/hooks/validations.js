import { toast } from "sonner";

export const validateFlowDiagram = (nodes, edges) => {
  //Existence of atleast 1 node to run
  if (nodes.length === 0) {
    toast.error("There must be at least one node in the diagram to run.");
    return false;
  }

  // 1) Check for nodes without edges
  const nodesWithoutEdges = nodes.filter(
    (node) =>
      !edges.some((edge) => edge.source === node.id || edge.target === node.id)
  );
  if (nodesWithoutEdges.length > 0) {
    toast.error("There are nodes without edges. Please connect all nodes.");
    return;
  }

  // 2) Action nodes must have incoming and outgoing edges
  const actionNodes = nodes.filter((node) => node.type === "actionNode");
  const invalidActionNodes = actionNodes.filter((node) => {
    const incomingEdges = edges.filter((edge) => edge.target === node.id);
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);
    return incomingEdges.length === 0 || outgoingEdges.length === 0;
  });
  if (invalidActionNodes.length > 0) {
    toast.error("Action nodes must have both incoming and outgoing edges.");
    return;
  }

  // 3) All parameter values must be set
  const actionNodesWithoutParameters = actionNodes.filter(
    (node) =>
      !node.data.parameters || Object.keys(node.data.parameters).length === 0
  );
  if (actionNodesWithoutParameters.length > 0) {
    toast.error("Please set all parameters for action nodes.");
    return;
  }

  // 4) Invalid edge connections
  const invalidEdges = edges.filter((edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);

    // Dataset -> Output
    if (
      sourceNode?.type === "datasetNode" &&
      targetNode?.type === "outputNode"
    ) {
      return true;
    }

    // Output -> Action
    // if (
    //   sourceNode?.type === "outputNode" &&
    //   targetNode?.type === "actionNode"
    // ) {
    //   return true;
    // }

    // Action -> Dataset
    if (
      sourceNode?.type === "actionNode" &&
      targetNode?.type === "datasetNode"
    ) {
      return true;
    }

    // Action -> Action
    if (
      sourceNode?.type === "actionNode" &&
      targetNode?.type === "actionNode"
    ) {
      return true;
    }

    // Dataset -> Dataset
    if (
      sourceNode?.type === "datasetNode" &&
      targetNode?.type === "datasetNode"
    ) {
      return true;
    }

    // Output -> Output
    if (
      sourceNode?.type === "outputNode" &&
      targetNode?.type === "outputNode"
    ) {
      return true;
    }

    return false;
  });

  if (invalidEdges.length > 0) {
    toast.error("Invalid edge connections detected.");
    return;
  }

  return true;
};
