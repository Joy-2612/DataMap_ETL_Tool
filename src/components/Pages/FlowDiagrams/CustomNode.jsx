import React, { useState } from "react";
import { Handle, Position } from "reactflow";

const CustomNode = ({ id, data, setNodes }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [nodeLabel, setNodeLabel] = useState(data.label);
  const [nodeColor, setNodeColor] = useState("#000");

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleRename = () => {
    const newName = prompt("Enter new node name:", nodeLabel);
    if (newName) {
      setNodeLabel(newName);
      setNodes((nds) =>
        nds.map((node) => (node.id === id ? { ...node, data: { ...node.data, label: newName } } : node))
      );
    }
    setMenuOpen(false);
  };

  const handleColorChange = () => {
    const newColor = prompt("Enter new outline color (CSS format, e.g., red or #ff0000):", nodeColor);
    if (newColor) {
      setNodeColor(newColor);
      setNodes((nds) =>
        nds.map((node) => (node.id === id ? { ...node, style: { ...node.style, borderColor: newColor } } : node))
      );
    }
    setMenuOpen(false);
  };

  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setMenuOpen(false);
  };

  return (
    <div
      className="relative bg-white shadow-md rounded-lg p-3 border"
      style={{ borderColor: nodeColor, position: "relative" }}
    >
      {/* Tooltip Menu (Three Dots) */}
      <div
        className="absolute top-2 right-2 cursor-pointer p-1 hover:bg-gray-200 rounded"
        onClick={toggleMenu}
      >
        ⋮
      </div>

      {/* Node Label */}
      <div className="text-center font-semibold">{nodeLabel}</div>

      {/* Menu Options */}
      {menuOpen && (
        <div className="absolute right-2 top-8 bg-white border rounded shadow-md p-2 text-sm">
          <button onClick={handleRename} className="block w-full text-left p-1 hover:bg-gray-100">
            Rename
          </button>
          <button onClick={handleColorChange} className="block w-full text-left p-1 hover:bg-gray-100">
            Change Color
          </button>
          <button onClick={handleDelete} className="block w-full text-left p-1 text-red-500 hover:bg-gray-100">
            Delete
          </button>
        </div>
      )}

      {/* Handles for connecting nodes */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default CustomNode;
