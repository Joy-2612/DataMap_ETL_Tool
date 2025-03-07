import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { CiSettings } from "react-icons/ci";
import { GrAction } from "react-icons/gr";

const ActionNode = ({ id, data, selected }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleOptionsClick = (event) => {
    event.stopPropagation();
    setShowTooltip((prev) => !prev);
  };

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "rgba(0, 0, 255, 0.1)", // Light blue background
        textAlign: "left",
        backdropFilter: "blur(8px)",
        color: "#333",
        padding: "16px",
        paddingBottom: "8px",
        border: "2px solid blue", // Blue outline
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

      <div style={{ marginBottom: "8px" }}>
        <GrAction />

        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={data.label}
        >
          {data.label}
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          NodeType: {data.nodeType}
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#666",
            marginTop: "4px",
            display: "flex",
            justifyContent: "space-between",
          }}
        ></div>
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

//   return (
//     <div
//       style={{
//         position: "relative",
//         backgroundColor: "rgba(0, 0, 255, 0.1)", // Light blue background
//         textAlign: "left",
//         color: "#333",
//         padding: "16px",
//         border: "2px solid blue", // Blue outline
//         borderRadius: "8px",
//         fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
//         boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//         minWidth: 150,
//         overflow: "visible",
//       }}
//     >
//       <Handle type="target" position={Position.Top} style={{ background: "#555", width: "8px", height: "8px" }} />

//       <div style={{ marginBottom: "8px" }}>
//         <div
//           style={{
//             fontSize: "16px",
//             marginBottom: "4px",
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//             whiteSpace: "nowrap",
//           }}
//           title={data.label}
//         >
//           {data.label}
//         </div>
//         <div style={{ fontSize: "12px", color: "#666" }}>NodeType: Action</div>
//       </div>

//       <Handle type="source" position={Position.Bottom} style={{ background: "#555", width: "8px", height: "8px" }} />

//       {selected && (
//         <div
//           style={{
//             position: "absolute",
//             top: "8px",
//             right: "8px",
//             zIndex: 10,
//           }}
//         >
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
//                 top: "100%",
//                 right: "0",
//                 marginTop: "5px",
//                 fontSize: "10px",
//                 background: "#fff",
//                 color: "#333",
//                 borderRadius: "4px",
//                 padding: "4px 6px",
//                 boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
//                 zIndex: 999,
//                 whiteSpace: "nowrap",
//                 border: "1px solid #ddd",
//               }}
//             >
//               <button
//                 style={{
//                   background: "red",
//                   color: "white",
//                   border: "none",
//                   fontSize: "10px",
//                   borderRadius: "4px",
//                   padding: "4px 8px",
//                   cursor: "pointer",
//                   width: "100%",
//                   minWidth: "60px",
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

export default ActionNode;
