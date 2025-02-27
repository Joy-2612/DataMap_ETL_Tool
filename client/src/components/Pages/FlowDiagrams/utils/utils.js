// export const updateActionNodesWithEdgeData = (nodes, edges) => {
//     const actionNodesMap = new Map();
  
//     edges.forEach((edge) => {
//       const sourceNode = nodes.find((node) => node.id === edge.source);
//       const targetNode = nodes.find((node) => node.id === edge.target);
  
//       if (sourceNode && targetNode && sourceNode.type === "datasetNode" && targetNode.type === "actionNode") {
//         const actionNodeId = targetNode.id;
//         if (!actionNodesMap.has(actionNodeId)) {
//           actionNodesMap.set(actionNodeId, {
//             ...targetNode,
//             data: {
//               ...targetNode.data,
//               sourcenodes: [],
//               destinationNode: null,
//             },
//           });
//         }
//         const actionNode = actionNodesMap.get(actionNodeId);
//         actionNode.data.sourcenodes.push({
//           id: sourceNode.data._id,
//           name: sourceNode.data.name,
//         });
//       }
  
//       if (sourceNode && targetNode && sourceNode.type === "actionNode" && targetNode.type === "outputNode") {
//         const actionNodeId = sourceNode.id;
//         if (!actionNodesMap.has(actionNodeId)) {
//           actionNodesMap.set(actionNodeId, {
//             ...sourceNode,
//             data: {
//               ...sourceNode.data,
//               sourcenodes: sourceNode.data.sourcenodes || [],
//               destinationNode: null,
//             },
//           });
//         }
//         const actionNode = actionNodesMap.get(actionNodeId);
//         actionNode.data.destinationNode = {
//           id: targetNode.data._id,
//           name: targetNode.data.name,
//           description: targetNode.data.description,
//         };
//       }
//     });
//     // console.log("Source Node ",nodes.sourceNode,"Destination Node ",nodes.destinationNode);
//     return nodes.map((node) => (actionNodesMap.has(node.id) ? actionNodesMap.get(node.id) : node));
//   };

export const updateActionNodesWithEdgeData = (nodes, edges) => {
  const actionNodesMap = new Map();

  edges.forEach((edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      const targetNode = nodes.find((node) => node.id === edge.target);

      // Case 1: datasetNode -> actionNode
      if (sourceNode && targetNode && sourceNode.type === "datasetNode" && targetNode.type === "actionNode") {
          const actionNodeId = targetNode.id;
          if (!actionNodesMap.has(actionNodeId)) {
              actionNodesMap.set(actionNodeId, {
                  ...targetNode,
                  data: {
                      ...targetNode.data,
                      sourcenodes: [],
                      destinationNode: null,
                  },
              });
          }
          const actionNode = actionNodesMap.get(actionNodeId);
          actionNode.data.sourcenodes.push({
              id: sourceNode.data._id,
              name: sourceNode.data.name,
          });
      }

      // Case 2: actionNode -> outputNode
      if (sourceNode && targetNode && sourceNode.type === "actionNode" && targetNode.type === "outputNode") {
          const actionNodeId = sourceNode.id;
          if (!actionNodesMap.has(actionNodeId)) {
              actionNodesMap.set(actionNodeId, {
                  ...sourceNode,
                  data: {
                      ...sourceNode.data,
                      sourcenodes: sourceNode.data.sourcenodes || [],
                      destinationNode: null,
                  },
              });
          }
          const actionNode = actionNodesMap.get(actionNodeId);
          actionNode.data.destinationNode = {
              id: targetNode.data._id,
              name: targetNode.data.name,
              description: targetNode.data.description,
          };
      }

      // Case 3: outputNode -> actionNode
      if (sourceNode && targetNode && sourceNode.type === "outputNode" && targetNode.type === "actionNode") {
          const actionNodeId = targetNode.id;
          if (!actionNodesMap.has(actionNodeId)) {
              actionNodesMap.set(actionNodeId, {
                  ...targetNode,
                  data: {
                      ...targetNode.data,
                      sourcenodes: [],
                      destinationNode: null,
                  },
              });
          }
          const actionNode = actionNodesMap.get(actionNodeId);
          actionNode.data.sourcenodes.push({
              id: sourceNode.data._id,
              name: sourceNode.data.name,
              description: sourceNode.data.description,
          });
      }

      // Case 4: actionNode -> outputNode (already handled in Case 2)
  });

  return nodes.map((node) => (actionNodesMap.has(node.id) ? actionNodesMap.get(node.id) : node));
};