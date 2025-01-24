import  create  from "zustand";
import { addEdge } from "reactflow";

const useFlowStore = create((set, get) => ({
  nodes: [
    {
      id: "1",
      type: "input",
      data: { label: "Start Node" },
      position: { x: 250, y: 100 },
    },
  ],
  edges: [],
  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),
  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
    })),
  updateEdges: (params) =>
    set((state) => ({
      edges: addEdge(params, state.edges),
    })),
  onNodesChange: (changes) =>
    set((state) => ({
      nodes: changes(state.nodes),
    })),
  onEdgesChange: (changes) =>
    set((state) => ({
      edges: changes(state.edges),
    })),
}));
export default useFlowStore;
