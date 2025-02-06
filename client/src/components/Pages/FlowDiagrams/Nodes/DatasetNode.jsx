// import React, { useState } from "react";
// import { Handle, Position } from "reactflow";
// import { CiSettings } from "react-icons/ci";
// import { FaDatabase } from "react-icons/fa6";

// const DatasetNode = ({ id, data, selected }) => {
//   const [showTooltip, setShowTooltip] = useState(false);

//   const handleOptionsClick = (event) => {
//     event.stopPropagation();
//     setShowTooltip((prev) => !prev);
//   };

//   return (
//     <div
//       style={{
//         position: "relative",
//         backgroundColor: "rgb(24 144 28 / 8%)",
//         textAlign: "left",
//         color: "#333",
//         padding: "16px",
//         border: "2px solid rgb(24 144 28 / 76%)",
//         borderRadius: "8px",
//         fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
//         boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//         minWidth: 150,
//         overflow: "visible",
//       }}
//     >
//       <Handle type="target" position={Position.Top} style={{ background: "#555", width: "8px", height: "8px" }} />

//       <div style={{ color: "black", marginBottom: "8px" }}>
//         <FaDatabase />
//       </div>
//       <div style={{ marginBottom: "8px" }}>
//         <div
//           style={{
//             fontSize: "16px",
//             fontWeight: "bold",
//             marginBottom: "4px",
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//             whiteSpace: "nowrap",
//           }}
//           title={data.name}
//         >
//           {data.name}
//         </div>
//         <div style={{ fontSize: "12px", color: "#666" }}>ID: {data._id}</div>
//         <div
//           style={{
//             fontSize: "12px",
//             color: "#666",
//             marginTop: "4px",
//             display: "flex",
//             justifyContent: "space-between",
//           }}
//         >
//           <span>Type: {data.type}</span>
//           <span>Size: {data.size}</span>
//         </div>
//       </div>

//       <Handle type="source" position={Position.Bottom} style={{ background: "#555", width: "8px", height: "8px" }} />

//       {selected && (
//         <div style={{ position: "absolute", top: "8px", right: "8px" }}>
//           <button
//             onClick={handleOptionsClick}
//             style={{
//               background: "none",
//               padding: 0,
//               border: "none",
//               color: "#333",
//               cursor: "pointer",
//               fontSize: "16px",
//             }}
//             title="Options"
//           >
//             <CiSettings />
//           </button>

//           {showTooltip && (
//             <div
//               style={{
//                 position: "absolute",
//                 top: "-35px",
//                 right: "0",
//                 fontSize: "10px",
//                 background: "#fff",
//                 color: "#333",
//                 borderRadius: "4px",
//                 padding: "4px 6px",
//                 boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
//                 zIndex: 999,
//               }}
//             >
//               <button
//                 style={{
//                   background: "red",
//                   color: "white",
//                   border: "none",
//                   fontSize: "10px",
//                   borderRadius: "4px",
//                   padding: "2px 6px",
//                   cursor: "pointer",
//                 }}
//                 onClick={() => data.onDelete(id)}
//               >
//                 Delete
//               </button>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default DatasetNode;

import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { CiSettings } from "react-icons/ci";
import { FaDatabase } from "react-icons/fa6";

const DatasetNode = ({ id, data, selected }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleOptionsClick = (event) => {
    event.stopPropagation();
    setShowTooltip((prev) => !prev);
  };

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "rgb(24 144 28 / 8%)",
        textAlign: "left",
        color: "#333",
        padding: "16px",
        paddingBottom: "8px",
        backdropFilter: "blur(8px)",
        border: "2px solid rgb(24 144 28 / 76%)",
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
            zIndex: 10, // Added zIndex to ensure visibility
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
            <div
              style={{
                position: "absolute",
                top: "100%", // Changed from -35px to position below the settings icon
                right: "0",
                marginTop: "5px", // Added margin for spacing
                fontSize: "10px",
                background: "#fff",
                color: "#333",
                borderRadius: "4px",
                padding: "4px 6px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                zIndex: 999,
                whiteSpace: "nowrap", // Prevent button from wrapping
                border: "1px solid #ddd", // Added border for better visibility
              }}
            >
              <button
                style={{
                  background: "red",
                  color: "white",
                  border: "none",
                  fontSize: "10px",
                  borderRadius: "4px",
                  padding: "4px 8px", // Increased padding for better clickability
                  cursor: "pointer",
                  width: "100%", // Ensure button takes full width
                  minWidth: "60px", // Minimum width for the button
                }}
                onClick={() => data.onDelete(id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatasetNode;
