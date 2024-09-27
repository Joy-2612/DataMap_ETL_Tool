// server/controllers/uploadController.js
const File = require("../models/File");
const { Readable } = require("stream");
const csvParser = require("csv-parser");
const { Parser } = require("json2csv");

// Controller to handle file upload
const uploadFile = async (req, res) => {
  try {
    const { originalname, mimetype, buffer } = req.file;
    const { userId } = req.body; // Get userId from request body

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Save file metadata and data to MongoDB
    const file = new File({
      originalName: originalname,
      data: buffer,
      contentType: mimetype,
      userId, // Associate file with the user
    });

    await file.save();

    res.status(201).json({ message: "File uploaded and saved successfully!" });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
};

// Controller to get all datasets by userID
const getDatasetsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("userId", userId);

    // Fetch datasets for the given userId
    const datasets = await File.find({ userId });

    // If no datasets found, return a 404 response
    if (!datasets || datasets.length === 0) {
      console.warn(`No datasets found for userId: ${userId}`);
      return res
        .status(404)
        .json({ message: "No datasets found for this user." });
    }

    // Format the response to match the required structure
    const formattedDatasets = datasets.map((dataset) => {
      return {
        name: dataset.originalName, // Rename originalName to name
        type: dataset.contentType, // Rename contentType to type
        file: dataset.data, // Binary data remains the same
        size: dataset.data.length, // Calculate size from binary data length
      };
    });

    console.log("Formatted datasets:", formattedDatasets);

    // Send the formatted response
    res.status(200).json({ data: formattedDatasets });
  } catch (error) {
    console.error("Error fetching datasets:", error);
    res.status(500).json({ message: "Failed to fetch datasets" });
  }
};

// Controller to concatenate columns in a CSV file
const concatenateColumns = async (req, res) => {
  try {
    const { fileId, columns, finalColumnName, delimiter } = req.body;

    // Validate input
    if (!fileId || !columns || !finalColumnName || !delimiter) {
      return res.status(400).json({
        message: "fileId, columns, finalColumnName, and delimiter are required",
      });
    }

    // Fetch the file from MongoDB
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Convert the file buffer into a readable stream
    const csvContent = file.data.toString("utf-8");

    const stream = Readable.from(csvContent);

    // Parse the CSV file
    const rows = [];
    stream
      .pipe(csvParser())
      .on("data", (row) => {
        // Concatenate the specified columns with the delimiter
        const concatenatedValue = columns
          .map((col) => row[col])
          .join(delimiter);

        // Replace the columns with the new concatenated value under the finalColumnName
        row[finalColumnName] = concatenatedValue;

        // Remove the old columns
        columns.forEach((col) => delete row[col]);

        rows.push(row);
      })
      .on("end", async () => {
        // Convert the modified data back to CSV
        const json2csvParser = new Parser({ fields: Object.keys(rows[0]) });
        const updatedCsv = json2csvParser.parse(rows);

        // Create a new file with a meaningful name
        const newFileName = `${
          file.originalName
        }_concatenated_${Date.now()}.csv`;

        // Save the new file in the database, base64-encoded
        const newFile = new File({
          originalName: newFileName,
          data: Buffer.from(updatedCsv).toString("base64"), // Store as base64
          contentType: file.contentType, // Use the same content type
          userId: file.userId, // Same user ID reference
        });

        await newFile.save();

        res.status(200).json({
          message: "Columns concatenated and new file created successfully!",
          newFileId: newFile._id, // Return the new file ID
        });
      })
      .on("error", (error) => {
        console.error("Error parsing CSV file:", error);
        res.status(500).json({ message: "Failed to process file" });
      });
  } catch (error) {
    console.error("Error concatenating columns:", error);
    res.status(500).json({ message: "Failed to concatenate columns" });
  }
};

module.exports = { uploadFile, getDatasetsByUserId, concatenateColumns };
