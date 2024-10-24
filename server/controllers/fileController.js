// server/controllers/uploadController.js
const File = require("../models/File");
const { Readable } = require("stream");
const csvParser = require("csv-parser");
const { Parser } = require("json2csv");
const xml2js = require('xml2js');
const fs = require("fs");
const { Builder } = require('xml2js');


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
        description: dataset.description || "", // Include description if available
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
        _id: dataset._id, // Include the ID for each dataset
        name: dataset.originalName, // Rename originalName to name
        type: dataset.contentType, // Rename contentType to type
        file: dataset.data, // Binary data remains the same
        description: dataset.description || "",
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
    const { dataset, column, mappings, outputFileName, description } = req.body;

    // Validate input
    if (
      !dataset ||
      !column ||
      !mappings ||
      !Array.isArray(mappings) ||
      !outputFileName
    ) {
      return res.status(400).json({
        message:
          "dataset, column, mappings, and outputFileName are required and mappings must be an array",
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
        const json2csvParser = new Parser({
          fields: Object.keys(rows[0]),
        });
        const updatedCsv = json2csvParser.parse(rows);

        // Convert the CSV data to a Buffer
        const csvBuffer = Buffer.from(updatedCsv, "utf-8");

        // Use the provided outputFileName
        const newFileName = outputFileName;

        // Save the new file in the database
        const newFile = new File({
          originalName: newFileName,
          data: csvBuffer,
          description: description || "", // Save the description if provided
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

const jsonToCSV = (jsonData) => {
  // Check if jsonData is an array and not empty
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    throw new Error("Invalid JSON data: should be a non-empty array.");
  }

  const headers = Object.keys(jsonData[0]);
  const csvRows = [];
  csvRows.push(headers.join(","));
  jsonData.forEach((obj) => {
    const values = headers.map((header) => {
      const escapedValue = ("" + obj[header]).replace(/"/g, '\\"');
      return `"${escapedValue}"`;
    });
    csvRows.push(values.join(","));
  });
  return csvRows.join("\n");
};

const xmlToCSV = (xmlData) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
      if (err) {
        return reject(err);
      }

      // Find the root tag dynamically (assumes there's only one root element)
      const rootTag = Object.keys(result)[0];
      const rootElement = result[rootTag];

      // Check if the root has child elements (items)
      const items = rootElement[Object.keys(rootElement)[0]];

      // Normalize the items to an array in case there is only one
      const itemArray = Array.isArray(items) ? items : [items];

      // Recursive function to flatten the XML object into key-value pairs
      const flattenObject = (obj, parent = "", res = {}) => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const propName = parent ? `${parent}.${key}` : key;

            // If it's an object, recursively flatten
            if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
              flattenObject(obj[key], propName, res);
            } else {
              res[propName] = Array.isArray(obj[key]) ? obj[key].join(", ") : obj[key];
            }
          }
        }
        return res;
      };

      // Flatten all the objects in the array
      const flattenedData = itemArray.map(item => flattenObject(item));

      // Log the extracted JSON data for debugging
      console.log("Extracted JSON Data:", flattenedData);

      // Convert the extracted JSON data to CSV
      const csvResult = jsonToCSV(flattenedData);
      resolve(csvResult);
    });
  });
};

// Controller function to handle file conversion
const convertFile = async (req, res) => {
  const { fileType, fileData, userId, originalFileName } = req.body;

  try {
    let csvResult;

    if (fileType === "json") {
      const jsonData = JSON.parse(fileData);
      csvResult = jsonToCSV(jsonData);
    } else if (fileType === "xml") {
      console.log("Converting XML to CSV...");
      console.log('Before conversion:');
      console.log(fileData);
      csvResult = await xmlToCSV(fileData); // Await the promise returned from xmlToCSV
    } else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    // Save the CSV in the database
    const csvBuffer = Buffer.from(csvResult, "utf-8");
    const newFile = new File({
      originalName: originalFileName + ".csv",
      data: csvBuffer,
      contentType: "text/csv",
      userId: userId,
      result: true,
    });

    await newFile.save();

    res.set("Content-Type", "text/csv");
    res.attachment("converted-file.csv");
    res.send(csvResult);
  } catch (error) {
    console.error("Error during file conversion:", error);
    res.status(500).json({ message: "Error converting file", error });
  }
};

const jsonToXML = (jsonData) => {
  const builder = new xml2js.Builder({
    renderOpts: { pretty: true },
    xmldec: { version: "1.0", encoding: "UTF-8" },
  });

  const xmlData = jsonData.map(item => {
    // Convert the keys to valid XML names (replace spaces with underscores)
    const formattedItem = {};
    for (const key in item) {
      if (item.hasOwnProperty(key)) {
        // Replace spaces in keys with underscores
        const newKey = key.replace(/ /g, "_"); // Replace spaces with underscores
        formattedItem[newKey] = item[key];
      }
    }
    return formattedItem;
  });

  return builder.buildObject({ rows: { row: xmlData } });
};



const csvToJson = (csvString) => {
  const rows = csvString.trim().split("\n");
  const headers = rows[0].split(",").map(header => header.trim().replace(/ /g, "_")); // Replace spaces with underscores

  const jsonData = rows.slice(1).map((row) => {
    const values = row.split(",");
    const jsonRow = {};
    headers.forEach((header, index) => {
      jsonRow[header] = values[index].trim();
    });
    return jsonRow;
  });

  return jsonData;
};

const convertBack = async (req, res) => {
  try {
    const { convertTo, fileData } = req.body;

    // Convert CSV to JSON
    const jsonData = csvToJson(fileData);
    if (convertTo === "json") {
      return res.status(200).send(JSON.stringify(jsonData, null, 2));
    } else if (convertTo === "xml") {
      const xmlData = jsonToXML(jsonData);
      return res.status(200).send(xmlData);
    } else {
      throw new Error("Unsupported file format");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};
const splitCols = async (req, res) => {
  const { data, splits } = req.body;

  console.log("Data received:", data);
  console.log("Splits received:", splits);

  try {
    const splitData = data.map(row => {
      let newRow = {}; // Create a new object for the modified row

      splits.forEach(split => {
        const { col, delimiter, numDelimiters, columnNames } = split;

        if (col && delimiter) {
          if (row[col] === undefined || row[col] === null) {
            console.warn(`Column "${col}" not found in the row:`, row);
            return; // Skip this split if the column doesn't exist
          }

          // Proceed with splitting
          const values = row[col].split(delimiter);
          const splitParts = values.slice(0, numDelimiters + 1);
          const remainingPart = values.slice(numDelimiters + 1).join(delimiter);

          // Add the original columns that are not being split to the newRow
          Object.keys(row).forEach(key => {
            if (key !== col) {
              newRow[key] = row[key]; // Copy existing columns to the new row
            }
          });

          // Rename the new columns based on provided names and insert them into the new row
          splitParts.forEach((value, index) => {
            if (index < columnNames.length) {
              newRow[columnNames[index]] = value; // Insert new column
            }
          });

          // Optionally, keep the remaining part in the original column if needed
          // newRow[col] = remainingPart; // Remove this line to not keep the original column
        }
      });

      return newRow; // Return the modified row
    });

    res.status(200).json(splitData); // Send back the modified data
  } catch (error) {
    console.error("Error splitting columns: ", error);
    res.status(500).json({ error: "Error splitting columns" });
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
  convertFile,
  convertBack,
  splitCols
};
