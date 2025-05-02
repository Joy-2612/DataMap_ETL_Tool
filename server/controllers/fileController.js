// server/controllers/fileController.js

const {
  uploadFileService,
  getDatasetByDatasetIdService,
  getDatasetsByUserIdService,
  getDatasetResultByUserIdService,
  getAllDatasetsByUserIdService,
  deleteDatasetByIdService,
  concatenateColumnsService,
  mergeDatasetsService,
  standardizeColumnService,
  convertFileService,
  convertBackService,
  splitColsService,
  splitAddressService,
  updateDatasetNameService,
} = require("../services/fileService");

/**
 * Controller: Upload File
 */
const uploadFile = async (req, res) => {
  try {
    const files = req.files; // Array of files from multipart/form-data
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Process all files concurrently
    const uploadPromises = files.map((file) =>
      uploadFileService({
        originalname: file.originalname,
        mimetype: file.mimetype,
        buffer: file.buffer,
        userId: userId,
      })
    );

    await Promise.all(uploadPromises);

    return res.status(201).json({
      message: `${files.length} files uploaded successfully`,
      count: files.length,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return res.status(500).json({
      message: "Failed to upload files",
      error: error.message,
      partialSuccess: error.partialResults ? true : false,
      succeeded: error.partialResults?.length || 0,
    });
  }
};

/**
 * Controller: Get dataset by datasetId
 */
const getDatasetByDatasetId = async (req, res) => {
  try {
    const { datasetId } = req.params;
    const dataset = await getDatasetByDatasetIdService(datasetId);
    console.log("Dataset Obtained: ", dataset);

    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    const formattedDataset = {
      _id: dataset._id,
      name: dataset.originalName,
      type: dataset.contentType,
      file: dataset.data,
      description: dataset.description || "",
      size: dataset.data.length,
      createdAt: dataset.createdAt,
    };

    return res.status(200).json({ data: formattedDataset });
  } catch (error) {
    console.error("Error fetching dataset:", error);
    return res.status(500).json({ message: "Failed to fetch dataset" });
  }
};

/**
 * Controller: Get all non-result datasets by userId (result: false)
 */
const getDatasetsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const datasets = await getDatasetsByUserIdService(userId);

    if (!datasets || datasets.length === 0) {
      return res
        .status(404)
        .json({ message: "No datasets found for this user." });
    }

    const formattedDatasets = datasets.map((dataset) => ({
      _id: dataset._id,
      name: dataset.originalName,
      type: dataset.contentType,
      file: dataset.data,
      description: dataset.description || "",
      size: dataset.data.length,
      createdAt: dataset.createdAt,
    }));

    return res.status(200).json({ data: formattedDatasets });
  } catch (error) {
    console.error("Error fetching datasets:", error);
    return res.status(500).json({ message: "Failed to fetch datasets" });
  }
};

/**
 * Controller: Get all result datasets by userId (result: true)
 */
const getDatasetResultByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const datasets = await getDatasetResultByUserIdService(userId);

    if (!datasets || datasets.length === 0) {
      return res
        .status(404)
        .json({ message: "No datasets found for this user." });
    }

    const formattedDatasets = datasets.map((dataset) => ({
      _id: dataset._id,
      name: dataset.originalName,
      type: dataset.contentType,
      file: dataset.data,
      description: dataset.description || "",
      size: dataset.data.length,
      createdAt: dataset.createdAt,
    }));

    return res.status(200).json({ data: formattedDatasets });
  } catch (error) {
    console.error("Error fetching result datasets:", error);
    return res.status(500).json({ message: "Failed to fetch datasets" });
  }
};

/**
 * Controller: Get all datasets by userId (both result: true and false)
 */
const getAllDatasetsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const datasets = await getAllDatasetsByUserIdService(userId);

    if (!datasets || datasets.length === 0) {
      return res
        .status(404)
        .json({ message: "No datasets found for this user." });
    }

    const formattedDatasets = datasets.map((dataset) => ({
      _id: dataset._id,
      name: dataset.originalName,
      type: dataset.contentType,
      file: dataset.data,
      result: dataset.result,
      description: dataset.description || "",
      size: dataset.data.length,
      createdAt: dataset.createdAt,
    }));

    return res.status(200).json({ data: formattedDatasets });
  } catch (error) {
    console.error("Error fetching all datasets:", error);
    return res.status(500).json({ message: "Failed to fetch datasets" });
  }
};

/**
 * Controller: Concatenate columns
 */
const concatenateColumns = async (req, res) => {
  try {
    const newFile = await concatenateColumnsService(req.body);

    return res.status(200).json({
      message: "Columns concatenated and new file created successfully!",
      newFileId: newFile._id,
    });
  } catch (error) {
    console.error("Error concatenating columns:", error);
    return res.status(500).json({ message: "Failed to concatenate columns1" });
  }
};

/**
 * Controller: Merge two datasets
 */
const mergeDatasets = async (req, res) => {
  try {
    const newFile = await mergeDatasetsService(req.body);

    return res.status(200).json({
      message: "Datasets merged and new file created successfully!",
      newFileId: newFile._id,
    });
  } catch (error) {
    console.error("Error merging datasets:", error);
    return res.status(500).json({ message: "Failed to merge datasets" });
  }
};

/**
 * Controller: Standardize a column
 */
const standardizeColumn = async (req, res) => {
  try {
    const newFile = await standardizeColumnService(req.body);

    return res.status(200).json({
      message: "Column standardized and new file created successfully!",
      newFileId: newFile._id,
    });
  } catch (error) {
    console.error("Error standardizing column:", error);
    return res.status(500).json({ message: "Failed to standardize column" });
  }
};

/**
 * Controller: Delete dataset by ID
 */
const deleteDatasetById = async (req, res) => {
  try {
    const { datasetId } = req.params;
    const deletedFile = await deleteDatasetByIdService(datasetId);

    if (!deletedFile) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    return res.status(200).json({ message: "Dataset deleted successfully!" });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    return res.status(500).json({ message: "Failed to delete dataset" });
  }
};

/**
 * Controller: Convert JSON or XML to CSV
 */
const convertFile = async (req, res) => {
  try {
    const { fileType, fileData, userId, originalFileName } = req.body;
    const { csvResult, newFile } = await convertFileService({
      fileType,
      fileData,
      userId,
      originalFileName,
    });

    // Return CSV as a downloadable response
    res.set("Content-Type", "text/csv");
    res.attachment("converted-file.csv");
    return res.send(csvResult);
  } catch (error) {
    console.error("Error during file conversion:", error);
    return res.status(500).json({ message: "Error converting file", error });
  }
};

/**
 * Controller: Convert CSV back to JSON or XML
 */
const convertBack = async (req, res) => {
  try {
    const { convertTo, fileData } = req.body;
    const convertedData = await convertBackService({ convertTo, fileData });
    return res.status(200).send(convertedData);
  } catch (error) {
    console.error("Error converting back:", error);
    return res
      .status(500)
      .json({ message: "Error converting back", error: error.message });
  }
};

/**
 * Controller: Split specified columns
 */
const splitCols = async (req, res) => {
  try {
    const newFile = await splitColsService(req.body);

    return res.status(201).json({
      message: "Columns split and new file created successfully!",
      newFileId: newFile._id,
    });
  } catch (error) {
    console.error("Error splitting columns:", error);
    return res.status(500).json({ message: "Error splitting columns", error });
  }
};

/**
 * Controller: Split address and enrich data with pincode details
 */
const splitAddress = async (req, res) => {
  try {
    const newFile = await splitAddressService(req.body);

    return res.status(201).json({
      message: "Address split and cleaned successfully!",
      newFileId: newFile._id,
    });
  } catch (error) {
    console.error("Error splitting address:", error);
    return res.status(500).json({ message: "Error splitting address", error });
  }
};

const updateDatasetName = async (req, res) => {
  try {
    const { datasetId } = req.params;
    const { newName } = req.body;

    if (!newName?.trim()) {
      return res.status(400).json({ message: "New name is required" });
    }

    const updated = await updateDatasetNameService(datasetId, newName.trim());

    if (!updated) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    return res.status(200).json({
      message: "Dataset renamed successfully",
      data: { _id: updated._id, name: updated.originalName },
    });
  } catch (err) {
    console.error("Error renaming dataset:", err);
    return res.status(500).json({ message: "Failed to rename dataset" });
  }
};

/* -------------------------------------------------------------------------- */
/*                                Exports                                     */
/* -------------------------------------------------------------------------- */

module.exports = {
  uploadFile,
  getDatasetByDatasetId,
  getDatasetsByUserId,
  getDatasetResultByUserId,
  getAllDatasetsByUserId,
  concatenateColumns,
  mergeDatasets,
  standardizeColumn,
  deleteDatasetById,
  convertFile,
  convertBack,
  splitCols,
  splitAddress,
  updateDatasetName,
};
