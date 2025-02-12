// server/services/fileService.js
const File = require("../models/File");
const { Readable } = require("stream");
const csvParser = require("csv-parser");
const { Parser } = require("json2csv");
const axios = require("axios");

// Import helper functions
const {
  jsonToCSV,
  xmlToCSV,
  jsonToXML,
  csvToJson,
  naturalJoin,
  fullOuterJoin,
} = require("../helpers/fileHelper");

/* -------------------------------------------------------------------------- */
/*                               Service Methods                              */
/* -------------------------------------------------------------------------- */

/**
 * Upload a file to the database
 */
const uploadFileService = async ({
  originalname,
  mimetype,
  buffer,
  description,
  userId,
}) => {
  const file = new File({
    originalName: originalname,
    data: buffer,
    description: description || "",
    contentType: mimetype,
    userId,
  });
  await file.save();
  return file;
};

/**
 * Get a dataset by its ID
 */
const getDatasetByDatasetIdService = async (datasetId) => {
  return File.findById(datasetId);
};

/**
 * Get all datasets by userId (excluding result: true)
 */
const getDatasetsByUserIdService = async (userId) => {
  return File.find({ userId, result: false });
};

/**
 * Get all result datasets by userId (result: true)
 */
const getDatasetResultByUserIdService = async (userId) => {
  return File.find({ userId, result: true });
};

/**
 * Get *all* datasets by userId (both result: true and false)
 */
const getAllDatasetsByUserIdService = async (userId) => {
  return File.find({ userId });
};

/**
 * Delete a dataset by its ID
 */
const deleteDatasetByIdService = async (datasetId) => {
  return File.findByIdAndDelete(datasetId);
};

/**
 * Concatenate columns in a CSV dataset
 */
const concatenateColumnsService = async ({
  dataset,
  columns,
  finalColumnName,
  delimiter,
  outputFileName,
  description,
}) => {

  console.log("para: ", dataset,    columns,    finalColumnName,    delimiter,    outputFileName,    description);
  // Find the file
  const file = await File.findOne({ _id: dataset });
  if (!file) throw new Error("File not found");

  // Decode Base64 data
  const csvContent = Buffer.from(file.data, "base64").toString("utf-8");
  const stream = Readable.from(csvContent);

  const rows = [];

  return new Promise((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on("data", (row) => {
        const concatenatedValue = columns
          .map((col) => row[col] || "")
          .join(delimiter);

        row[finalColumnName] = concatenatedValue;

        // Remove old columns
        columns.forEach((col) => delete row[col]);

        rows.push(row);
      })
      .on("end", async () => {
        if (rows.length === 0) {
          return reject(new Error("The file is empty or in an invalid format"));
        }

        // Convert to CSV
        const json2csvParser = new Parser({ fields: Object.keys(rows[0]) });
        const updatedCsv = json2csvParser.parse(rows);
        const csvBuffer = Buffer.from(updatedCsv, "utf-8");

        // Save the new file
        const newFile = new File({
          originalName: outputFileName,
          data: csvBuffer,
          description: description || "",
          contentType: file.contentType,
          userId: file.userId,
          result: true,
        });

        await newFile.save();
        resolve(newFile);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

/**
 * Merge two datasets (Full Outer Join, or could also do Natural Join)
 */
const mergeDatasetsService = async ({
  dataset1,
  dataset2,
  column1,
  column2,
  outputFileName,
  description,
}) => {
  const file1 = await File.findOne({
    $or: [{ originalName: dataset1 }, { _id: dataset1 }],
  });

  const file2 = await File.findOne({
    $or: [{ originalName: dataset2 }, { _id: dataset2 }],
  });

  if (!file1) {
    throw new Error(`Dataset "${dataset1}" not found`);
  }
  if (!file2) {
    throw new Error(`Dataset "${dataset2}" not found`);
  }

  // Decode Base64
  const csvContent1 = Buffer.from(file1.data, "base64").toString("utf-8");
  const csvContent2 = Buffer.from(file2.data, "base64").toString("utf-8");

  const stream1 = Readable.from(csvContent1);
  const stream2 = Readable.from(csvContent2);

  const dataset1Rows = [];
  const dataset2Rows = [];

  const dataset1Promise = new Promise((resolve, reject) => {
    stream1
      .pipe(csvParser())
      .on("data", (row) => dataset1Rows.push(row))
      .on("end", () => resolve())
      .on("error", (error) => reject(error));
  });

  const dataset2Promise = new Promise((resolve, reject) => {
    stream2
      .pipe(csvParser())
      .on("data", (row) => dataset2Rows.push(row))
      .on("end", () => resolve())
      .on("error", (error) => reject(error));
  });

  await Promise.all([dataset1Promise, dataset2Promise]);

  // Perform Full Outer Join (can switch to naturalJoin if needed)
  const joinedData = fullOuterJoin(
    dataset1Rows,
    dataset2Rows,
    column1,
    column2
  );

  if (joinedData.length === 0) {
    throw new Error("No matching rows found between the two datasets");
  }

  // Convert to CSV
  const json2csvParser = new Parser({ fields: Object.keys(joinedData[0]) });
  const updatedCsv = json2csvParser.parse(joinedData);
  const csvBuffer = Buffer.from(updatedCsv, "utf-8");

  // Save as new file
  const newFile = new File({
    originalName: outputFileName,
    data: csvBuffer,
    description: description || "",
    contentType: file1.contentType,
    userId: file1.userId,
    result: true,
  });

  await newFile.save();
  return newFile;
};

/**
 * Standardize a column based on provided "before => after" mappings
 */
const standardizeColumnService = async ({
  datasetId,
  column,
  mappings,
  outputFileName,
  description,
}) => {
  console.log(datasetId);
  const file = await File.findOne({ _id: datasetId });
  if (!file) throw new Error("Dataset not found");

  const csvContent = Buffer.from(file.data, "base64").toString("utf-8");
  const stream = Readable.from(csvContent);

  const rows = [];

  return new Promise((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on("data", (row) => {
        const value = row[column];
        if (value) {
          mappings.forEach((mapping) => {
            if (mapping.before.includes(value)) {
              row[column] = mapping.after;
            }
          });
        }
        rows.push(row);
      })
      .on("end", async () => {
        if (rows.length === 0) {
          return reject(new Error("The file is empty or in an invalid format"));
        }

        // Convert to CSV
        const json2csvParser = new Parser({ fields: Object.keys(rows[0]) });
        const updatedCsv = json2csvParser.parse(rows);
        const csvBuffer = Buffer.from(updatedCsv, "utf-8");

        // Save new file
        const newFile = new File({
          originalName: outputFileName,
          data: csvBuffer,
          description: description || "",
          contentType: file.contentType,
          userId: file.userId,
          result: true,
        });

        await newFile.save();
        resolve(newFile);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

/**
 * Convert JSON or XML to CSV and store it
 */
const convertFileService = async ({
  fileType,
  fileData,
  userId,
  originalFileName,
}) => {
  let csvResult;

  if (fileType === "json") {
    const jsonData = JSON.parse(fileData);
    csvResult = jsonToCSV(jsonData);
  } else if (fileType === "xml") {
    csvResult = await xmlToCSV(fileData);
  } else {
    throw new Error("Unsupported file type");
  }

  const csvBuffer = Buffer.from(csvResult, "utf-8");
  const newFile = new File({
    originalName: originalFileName + ".csv",
    data: csvBuffer,
    contentType: "text/csv",
    userId,
    result: true,
  });

  await newFile.save();
  return { csvResult, newFile };
};

/**
 * Convert CSV back to JSON or XML
 */
const convertBackService = async ({ convertTo, fileData }) => {
  const jsonData = csvToJson(fileData);

  if (convertTo === "json") {
    return JSON.stringify(jsonData, null, 2);
  } else if (convertTo === "xml") {
    return jsonToXML(jsonData);
  } else {
    throw new Error("Unsupported file format");
  }
};

/**
 * Split specified columns by a delimiter
 */
const splitColsService = async ({
  fileId,
  splits,
  description = "",
  outputFileName,
}) => {
  const file = await File.findById(fileId);
  if (!file) throw new Error("File not found");

  const csvContent = Buffer.from(file.data, "base64").toString("utf-8");
  const rows = await new Promise((resolve, reject) => {
    const result = [];
    Readable.from(csvContent)
      .pipe(csvParser())
      .on("data", (row) => result.push(row))
      .on("end", () => resolve(result))
      .on("error", (error) => reject(error));
  });

  const splitData = rows.map((row) => {
    const newRow = { ...row };
    splits.forEach(({ col, delimiter, numDelimiters, columnNames }) => {
      if (typeof row[col] === "undefined") return; // skip if column doesn't exist
      const parts = row[col].split(delimiter);
      const splitParts = parts.slice(0, numDelimiters + 1);

      // Insert new columns
      splitParts.forEach((value, index) => {
        if (index < columnNames.length) {
          newRow[columnNames[index]] = value;
        }
      });

      // Remove original column if desired
      delete newRow[col];
    });
    return newRow;
  });

  const json2csvParser = new Parser({ fields: Object.keys(splitData[0]) });
  const updatedCsv = json2csvParser.parse(splitData);
  const csvBuffer = Buffer.from(updatedCsv, "utf-8");

  const newFile = new File({
    originalName: outputFileName || `${file.originalName}_split.csv`,
    data: csvBuffer,
    contentType: "text/csv",
    description,
    userId: file.userId,
    result: true,
  });

  await newFile.save();
  return newFile;
};

/**
 * Split address and enrich with pincode details
 */
const splitAddressService = async ({
  fileId,
  addressName,
  description = "",
  outputFileName,
}) => {
  const file = await File.findById(fileId);
  if (!file) throw new Error("File not found");

  const csvContent = Buffer.from(file.data, "base64").toString("utf-8");
  const rows = await new Promise((resolve, reject) => {
    const result = [];
    Readable.from(csvContent)
      .pipe(csvParser())
      .on("data", (row) => result.push(row))
      .on("end", () => resolve(result))
      .on("error", (error) => reject(error));
  });

  const splitData = rows.map((row) => {
    const addressParts = (row[addressName] || "")
      .split(",")
      .map((p) => p.trim());
    const pincodeMatch = (row[addressName] || "").match(/-\s*(\d{6})$/);
    const pincode = pincodeMatch ? pincodeMatch[1] : "";

    return { ...row, addressParts, pincode };
  });

  const enrichedData = await Promise.all(
    splitData.map(async (item) => {
      try {
        const response = await axios.get(
          `https://api.postalpincode.in/pincode/${item.pincode}`
        );
        const locationData = response.data[0]?.PostOffice?.[0] || {};

        const post_office = locationData.Name || "Unknown";
        const district = locationData.District || "Unknown";
        const state = locationData.State || "Unknown";
        const country = locationData.Country || "India";

        // Remove location parts if found in the original address
        const cleanedAddressParts = item.addressParts.filter(
          (part) =>
            !part.includes(post_office) &&
            !part.includes(district) &&
            !part.includes(state) &&
            !part.includes(country) &&
            !part.includes(item.pincode)
        );

        item["Street Address"] = cleanedAddressParts.join(", ");
        delete item[addressName];

        return { ...item, post_office, district, state, country };
      } catch (error) {
        // Return defaults if API fails
        return {
          ...item,
          post_office: "Unknown",
          district: "Unknown",
          state: "Unknown",
          country: "India",
        };
      }
    })
  );

  // Convert to CSV
  let fields = Object.keys(enrichedData[0]).filter((f) => f !== "addressParts");
  const stateIndex = fields.indexOf("state");
  const pincodeIndex = fields.indexOf("pincode");

  // Move pincode after state if needed
  if (
    pincodeIndex !== -1 &&
    stateIndex !== -1 &&
    pincodeIndex !== stateIndex + 1
  ) {
    fields.splice(pincodeIndex, 1);
    fields.splice(stateIndex, 0, "pincode");
  }

  const json2csvParser = new Parser({ fields });
  const updatedCsv = json2csvParser.parse(enrichedData);
  const csvBuffer = Buffer.from(updatedCsv, "utf-8");

  const newFile = new File({
    originalName: outputFileName || `${file.originalName}_address_split.csv`,
    data: csvBuffer,
    contentType: "text/csv",
    description,
    userId: file.userId,
    result: true,
  });

  await newFile.save();
  return newFile;
};

/* -------------------------------------------------------------------------- */
/*                                Exports                                     */
/* -------------------------------------------------------------------------- */

module.exports = {
  // Services
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
};
