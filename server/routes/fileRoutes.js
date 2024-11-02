// server/routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const {
  uploadFile,
  getDatasetsByUserId,
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
} = require("../controllers/fileController");

const router = express.Router();

// Set up multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define the upload route
router.post("/upload", upload.single("file"), uploadFile);
router.get("/dataset/:datasetId", getDatasetByDatasetId);
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

module.exports = router;
