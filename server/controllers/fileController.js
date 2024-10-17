// server/controllers/uploadController.js
const File = require("../models/File");
const { Readable } = require("stream");
const csvParser = require("csv-parser");
const { Parser } = require("json2csv");
const fs = require('fs');


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
    const datasets = await File.find({ userId, result: false });

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
        _id: dataset._id, // Include the ID for each dataset
        name: dataset.originalName, // Rename originalName to name
        type: dataset.contentType, // Rename contentType to type
        file: dataset.data, // Binary data remains the same
        size: dataset.data.length, // Calculate size from binary data length
        createdAt: dataset.createdAt, // Calculate size from binary data length
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

const getDatasetResultByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const datasets = await File.find({ userId, result: true });
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
        size: dataset.data.length,
        createdAt: dataset.createdAt, // Calculate size from binary data length
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

const concatenateColumns = async (req, res) => {
  try {
    const { dataset, columns, finalColumnName, delimiter } = req.body;

    // Log the request body for debugging purposes
    console.log(req.body);

    // Validate input
    if (!dataset || !columns || !finalColumnName || !delimiter) {
      return res.status(400).json({
        message:
          "dataset, columns, finalColumnName, and delimiter are required",
      });
    }

    // Find the file by the originalName matching the dataset
    const file = await File.findOne({ originalName: dataset });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const fileId = file._id;

    // Decode the Base64 data stored in the file
    const csvContent = Buffer.from(file.data, "base64").toString("utf-8");

    // Convert the decoded CSV content into a readable stream
    const stream = Readable.from(csvContent);

    // Array to store rows after processing
    const rows = [];

    // Parse the CSV file
    stream
      .pipe(csvParser())
      .on("data", (row) => {
        // Concatenate the specified columns with the delimiter
        const concatenatedValue = columns
          .map((col) => row[col] || "") // Handle missing columns by using an empty string
          .join(delimiter);

        // Assign the concatenated value to the new column
        row[finalColumnName] = concatenatedValue;

        // Optionally, remove the old columns
        columns.forEach((col) => delete row[col]);

        rows.push(row);
      })
      .on("end", async () => {
        if (rows.length === 0) {
          return res.status(400).json({
            message: "The file is empty or in an invalid format",
          });
        }

        // Convert the modified data back to CSV
        const json2csvParser = new Parser({ fields: Object.keys(rows[0]) });
        const updatedCsv = json2csvParser.parse(rows);

        // Convert the CSV data to a Buffer instead of Uint8Array
        const csvBuffer = Buffer.from(updatedCsv, "utf-8");

        // Create a new file with a meaningful name
        const newFileName = `${file.originalName}_concatenated.csv`;

        // Save the new file in the database, storing it as a Buffer
        const newFile = new File({
          originalName: newFileName,
          data: csvBuffer, // Store as a Buffer
          contentType: file.contentType, // Use the same content type as original
          userId: file.userId, // Maintain user ownership
          result: true, // Mark the file as a result
        });

        await newFile.save();

        // Return a success response with the new file ID
        res.status(200).json({
          message: "Columns concatenated and new file created successfully!",
          newFileId: newFile._id,
        });
      })
      .on("error", (error) => {
        console.error("Error parsing CSV file:", error);
        res.status(500).json({ message: "Failed to process the file" });
      });
  } catch (error) {
    console.error("Error concatenating columns:", error);
    res.status(500).json({ message: "Failed to concatenate columns" });
  }
};

const naturalJoin = (dataset1, dataset2, key1, key2) => {
  const joinedData = [];

  // Create a map for quick lookup of rows in dataset2 by key2
  const map2 = new Map();
  dataset2.forEach((row) => {
    const key = row[key2];
    if (!map2.has(key)) {
      map2.set(key, []);
    }
    map2.get(key).push(row);
  });

  // Iterate over dataset1 and match with dataset2 based on key1 and key2
  dataset1.forEach((row1) => {
    const key = row1[key1];
    const matchingRows = map2.get(key);

    if (matchingRows) {
      matchingRows.forEach((row2) => {
        const mergedRow = { ...row1, ...row2 }; // Merge the two rows
        joinedData.push(mergedRow);
      });
    }
  });

  return joinedData;
};

// Controller to merge two datasets based on given columns
const mergeDatasets = async (req, res) => {
  try {
    const { dataset1, dataset2, column1, column2 } = req.body;

    // Validate input
    if (!dataset1 || !dataset2 || !column1 || !column2) {
      return res.status(400).json({
        message: "dataset1, dataset2, column1, and column2 are required",
      });
    }

    // Find the datasets by the originalName
    const file1 = await File.findOne({ originalName: dataset1 });
    const file2 = await File.findOne({ originalName: dataset2 });

    if (!file1 || !file2) {
      return res
        .status(404)
        .json({ message: "One or both datasets not found" });
    }

    // Decode Base64 data stored in the files
    const csvContent1 = Buffer.from(file1.data, "base64").toString("utf-8");
    const csvContent2 = Buffer.from(file2.data, "base64").toString("utf-8");

    // Convert the decoded CSV content into a readable stream
    const stream1 = Readable.from(csvContent1);
    const stream2 = Readable.from(csvContent2);

    const dataset1Rows = [];
    const dataset2Rows = [];

    // Parse the first CSV file
    const dataset1Promise = new Promise((resolve, reject) => {
      stream1
        .pipe(csvParser())
        .on("data", (row) => dataset1Rows.push(row))
        .on("end", () => resolve())
        .on("error", (error) => reject(error));
    });

    // Parse the second CSV file
    const dataset2Promise = new Promise((resolve, reject) => {
      stream2
        .pipe(csvParser())
        .on("data", (row) => dataset2Rows.push(row))
        .on("end", () => resolve())
        .on("error", (error) => reject(error));
    });

    // Wait for both datasets to finish parsing
    await Promise.all([dataset1Promise, dataset2Promise]);

    // Perform natural join on the datasets based on the given keys
    const joinedData = naturalJoin(
      dataset1Rows,
      dataset2Rows,
      column1,
      column2
    );

    if (joinedData.length === 0) {
      return res.status(400).json({
        message: "No matching rows found between the two datasets",
      });
    }

    // Convert the merged data back to CSV
    const json2csvParser = new Parser({ fields: Object.keys(joinedData[0]) });
    const updatedCsv = json2csvParser.parse(joinedData);

    // Convert the CSV data to a Buffer
    const csvBuffer = Buffer.from(updatedCsv, "utf-8");

    // Create a new file with a meaningful name
    const newFileName = `merge_result.csv`;

    // Save the new merged file to the database
    const newFile = new File({
      originalName: newFileName,
      data: csvBuffer,
      contentType: file1.contentType, // Use the same content type as original
      userId: file1.userId, // Maintain user ownership (assuming it's the same user)
      result: true, // Mark the file as a result
    });

    await newFile.save();

    // Return a success response with the new file ID
    res.status(200).json({
      message: "Datasets merged and new file created successfully!",
      newFileId: newFile._id,
    });
  } catch (error) {
    console.error("Error merging datasets:", error);
    res.status(500).json({ message: "Failed to merge datasets" });
  }
};

const standardizeColumn = async (req, res) => {
  try {
    const { dataset, column, mappings } = req.body;

    // Validate input
    if (!dataset || !column || !mappings || !Array.isArray(mappings)) {
      return res.status(400).json({
        message:
          "dataset, column, and mappings are required and mappings must be an array",
      });
    }

    // Find the dataset by its name
    const file = await File.findOne({ originalName: dataset });

    if (!file) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    // Decode Base64 data stored in the file
    const csvContent = Buffer.from(file.data, "base64").toString("utf-8");

    // Convert the CSV content into a readable stream
    const stream = Readable.from(csvContent);

    // Array to store rows after processing
    const rows = [];

    // Parse the CSV file
    stream
      .pipe(csvParser())
      .on("data", (row) => {
        const value = row[column];

        // Apply mappings
        const mappedValue =
          mappings.find((m) => m.before === value)?.after || value;
        row[column] = mappedValue;

        rows.push(row);
      })
      .on("end", async () => {
        if (rows.length === 0) {
          return res.status(400).json({
            message: "The file is empty or in an invalid format",
          });
        }

        // Convert the modified data back to CSV
        const json2csvParser = new Parser({ fields: Object.keys(rows[0]) });
        const updatedCsv = json2csvParser.parse(rows);

        // Convert the CSV data to a Buffer
        const csvBuffer = Buffer.from(updatedCsv, "utf-8");

        // Create a new file with a meaningful name
        const newFileName = `${file.originalName}_standardized.csv`;

        // Save the new file in the database
        const newFile = new File({
          originalName: newFileName,
          data: csvBuffer,
          contentType: file.contentType, // Use the same content type as original
          userId: file.userId, // Maintain user ownership
          result: true, // Mark the file as a result
        });

        await newFile.save();

        // Return a success response with the new file ID
        res.status(200).json({
          message: "Column standardized and new file created successfully!",
          newFileId: newFile._id,
        });
      })
      .on("error", (error) => {
        console.error("Error processing file:", error);
        res.status(500).json({ message: "Failed to process the file" });
      });
  } catch (error) {
    console.error("Error standardizing column:", error);
    res.status(500).json({ message: "Failed to standardize column" });
  }
};

// Controller to delete a dataset by ID
const deleteDatasetById = async (req, res) => {
  try {
    const { datasetId } = req.params;

    const deletedFile = await File.findByIdAndDelete(datasetId);

    if (!deletedFile) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    res.status(200).json({ message: "Dataset deleted successfully!" });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    res.status(500).json({ message: "Failed to delete dataset" });
  }
};



// Assuming you have the jsonToCSV and xmlToCSV conversion functions defined
const jsonToCSV = (jsonData) => {
  const headers = Object.keys(jsonData[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));
  jsonData.forEach(obj => {
    const values = headers.map(header => {
      const escapedValue = ('' + obj[header]).replace(/"/g, '\\"');
      return `"${escapedValue}"`;
    });
    csvRows.push(values.join(','));
  });
  return csvRows.join('\n');
};

const xmlToCSV = (xmlData) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlData, 'application/xml');
  const rows = [...xml.getElementsByTagName('row')];
  const headers = [...rows[0].children].map(node => node.nodeName);
  const csvRows = [];
  csvRows.push(headers.join(','));
  rows.forEach(row => {
    const values = [...row.children].map(node => `"${node.textContent.replace(/"/g, '\\"')}"`);
    csvRows.push(values.join(','));
  });
  return csvRows.join('\n');
};

// Controller function to handle file conversion
const convertFile = async (req, res) => {
  const { fileType, fileData } = req.body; // Assuming fileType is either 'json' or 'xml'

  try {
    let csvResult;

    if (fileType === 'json') {
      const jsonData = JSON.parse(fileData);
      csvResult = jsonToCSV(jsonData);
    } else if (fileType === 'xml') {
      csvResult = xmlToCSV(fileData);
    } else {
      return res.status(400).json({ message: 'Unsupported file type' });
    }

    res.set('Content-Type', 'text/csv');
    res.attachment('converted-file.csv');
    res.send(csvResult);
  } catch (error) {
    res.status(500).json({ message: 'Error converting file', error });
  }
};
module.exports = {
  uploadFile,
  getDatasetsByUserId,
  concatenateColumns,
  mergeDatasets,
  getDatasetResultByUserId,
  standardizeColumn,
  deleteDatasetById,
  convertFile
};
