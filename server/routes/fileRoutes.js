// server/routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const {
  uploadFile,
  getDatasetsByUserId,
  getAllDatasetsByUserId,
  concatenateColumns,
  getDatasetResultByUserId,
  mergeDatasets,
  standardizeColumn,
  deleteDatasetById,
  convertFile,
  convertBack,
  splitCols,
  splitAddress,
  getDatasetByDatasetId,
  updateDatasetName,
} = require("../controllers/fileController");

const router = express.Router();

// Set up multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define the upload route
router.post("/upload", upload.array("files"), uploadFile);
router.get("/dataset/:datasetId", getDatasetByDatasetId);
router.get("/alldatasets/:userId", getAllDatasetsByUserId);
router.get("/datasets/:userId", getDatasetsByUserId);
router.post("/concatenate", concatenateColumns);
router.get("/results/:userId", getDatasetResultByUserId);
router.post("/merge", mergeDatasets);
router.post("/standardize", standardizeColumn);
router.delete("/dataset/:datasetId", deleteDatasetById);
router.post("/convert", convertFile);
router.post("/convertback", convertBack);
router.post("/split", splitCols);
router.post("/splitAddress", splitAddress);
router.patch("/dataset/:datasetId/rename", updateDatasetName);

module.exports = router;
