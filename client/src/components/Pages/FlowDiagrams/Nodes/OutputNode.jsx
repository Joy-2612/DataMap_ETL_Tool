import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { CiSettings } from "react-icons/ci";
import { FaDatabase } from "react-icons/fa6";
import Tooltip from "./Tooltip"; // Adjust the import path as necessary

const OutputNode = ({ id, data, selected }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  console.log("Output node new dataset's: ", data, id);

  const handleOptionsClick = (event) => {
    event.stopPropagation();
    setShowTooltip((prev) => !prev);
  };

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "rgba(255, 0, 0, 0.1)", // Light red background
        textAlign: "left",
        color: "#333",
        padding: "16px",
        paddingBottom: "8px",
        border: "2px solid red", // Red outline
        borderRadius: "8px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        minWidth: 150,
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#555", width: "8px", height: "8px" }}
      />

      <div style={{ color: "black", marginBottom: "8px" }}>
        <FaDatabase />
      </div>

      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={data.name}
        >
          {data.name}
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>ID: {data._id}</div>
        <div
          style={{
            fontSize: "12px",
            color: "#666",
            marginTop: "4px",
            marginBottom: "4px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>DataType: {data.type}</span>
          <span>Size: {data.size}</span>
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          NodeType: {data.nodeType}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#555", width: "8px", height: "8px" }}
      />

      {selected && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 10, // Ensures visibility
          }}
        >
          <button
            onClick={handleOptionsClick}
            style={{
              background: "none",
              padding: 0,
              border: "none",
              color: "#333",
              cursor: "pointer",
              fontSize: "16px",
            }}
            title="Options"
          >
            <CiSettings />
          </button>

          {showTooltip && (
            <Tooltip onDelete={data.onDelete} id={id} data={data} />
          )}
        </div>
      )}
    </div>
  );
};

export default OutputNode;
