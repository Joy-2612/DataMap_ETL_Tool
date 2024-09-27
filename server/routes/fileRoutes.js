// server/routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const {
  uploadFile,
  getDatasetsByUserId,
  concatenateColumns,
} = require("../controllers/fileController");

const router = express.Router();

// Set up multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define the upload route
router.post("/upload", upload.single("file"), uploadFile);
router.get("/datasets/:userId", getDatasetsByUserId);
router.post("/concatenate", concatenateColumns);

module.exports = router;
