import { toast } from "sonner";

export const handleActionOperationsOnRun = async (actionNode) => {
  const { actionType, parameters, sourcenodes, destinationNode } = actionNode.data;
  const datasetIds = sourcenodes.map((source) => source.id);

  try {
    let endpoint = "";
    let payload = {};

    switch (actionType) {
      case "concatenate":
        endpoint = "http://localhost:5000/api/file/concatenate";
        payload = {
          dataset: datasetIds[0],
          columns: parameters.columns,
          finalColumnName: parameters.finalColumnName,
          delimiter: parameters.delimiter,
          outputFileName: destinationNode.name,
          description: destinationNode.description,
        };
        break;

      case "merge":
        endpoint = "http://localhost:5000/api/file/merge";
        payload = {
          dataset1: datasetIds[0],
          dataset2: datasetIds[1],
          column1: parameters.column1,
          column2: parameters.column2,
          outputFileName: destinationNode.name,
          description: destinationNode.description,
        };
        break;

      case "standardize":
        endpoint = "http://localhost:5000/api/file/standardize";
        payload = {
          datasetId: datasetIds[0],
          column: parameters.column,
          mappings: parameters.mappings,
          outputFileName: destinationNode.name,
          description: destinationNode.description,
        };
        break;

      case "split":
        if (parameters.splitType === "general") {
          endpoint = "http://localhost:5000/api/file/split";
          payload = {
            fileId: datasetIds[0],
            splits: parameters.splits,
            outputFileName: destinationNode.name,
            description: destinationNode.description,
          };
        } else if (parameters.splitType === "address") {
          endpoint = "http://localhost:5000/api/file/splitAddress";
          payload = {
            fileId: datasetIds[0],
            addressName: parameters.addressName,
            outputFileName: destinationNode.name,
            description: destinationNode.description,
          };
        }
        break;

      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Backend Response:", data);

    if (response.ok) {
      toast.success(`Operation completed successfully! New file ID: ${data.newFileId}`);

      const datasetResponse = await fetch(
        `http://localhost:5000/api/file/dataset/${data.newFileId}`
      );
      if (!datasetResponse.ok) {
        throw new Error("Failed to fetch dataset details");
      }

      const datasetDetails = await datasetResponse.json();
      console.log("Dataset details: ", datasetDetails);

      return {
        datasetId: data.newFileId,
        datasetName: datasetDetails.data.name,
        datasetType: datasetDetails.data.type || "text/csv",
        datasetSize: datasetDetails.data.size || "N/A",
      };
    } else {
      toast.error(`${data.message}`);
      throw new Error(data.message);
    }
  } catch (error) {
    toast.error(`An error occurred while performing the ${actionType} operation.`);
    console.error(error);
    throw error;
  }
};