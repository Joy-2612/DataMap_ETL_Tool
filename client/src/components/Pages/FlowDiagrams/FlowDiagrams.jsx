import React from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";

import "reactflow/dist/style.css";

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Start Node" },
    position: { x: 250, y: 0 },
  },
  {
    id: "2",
    data: { label: "Intermediate Node" },
    position: { x: 100, y: 100 },
  },
  {
    id: "3",
    data: { label: "Another Node" },
    position: { x: 400, y: 100 },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", label: "Edge 1-2" },
  { id: "e1-3", source: "1", target: "3", label: "Edge 1-3" },
];

const FlowDiagrams = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = React.useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default FlowDiagrams;
