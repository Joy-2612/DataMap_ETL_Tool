// server/services/aiFileService.js
const File = require("../models/File");
const { Readable } = require("stream");
const csvParser = require("csv-parser");

/**
 * getHeadersService
 * Reads the CSV headers from a file by its ID.
 */
async function getHeadersService(fileId) {
  console.log("fileId : ", fileId);
  const file = await File.findById(fileId);
  if (!file) {
    return `No file found with ID ${fileId}`;
  }

  // Convert from base64 to string
  const csvContent = Buffer.from(file.data, "base64").toString("utf-8");
  const rows = await parseCsvRows(csvContent, 1); // only read the first row

  if (rows.length === 0) {
    return "File is empty or invalid CSV";
  }

  // Return the keys from the first row as headers
  return JSON.stringify(Object.keys(rows[0]));
}

/**
 * getFirst10RowsService
 * Returns the first 10 rows of a CSV file by its ID, minus the header row.
 */
async function getFirst10RowsService(fileId) {
  const file = await File.findById(fileId);
  if (!file) return `No file found with ID ${fileId}`;

  const csvContent = Buffer.from(file.data, "base64").toString("utf-8");
  // read up to 10 rows
  const rows = await parseCsvRows(csvContent, 10);
  console.log("rows : ", rows);
  return JSON.stringify(rows, null, 2);
}

/**
 * getDistinctValuesService
 * Returns the distinct values for a specified column in a CSV file.
 */
async function getDistinctValuesService(fileId, columnName) {
  columnName = columnName.toLowerCase();

  const file = await File.findById(fileId);
  if (!file) return `No file found with ID ${fileId}`;

  const csvContent = Buffer.from(file.data, "base64").toString("utf-8");
  // read all rows (be mindful of performance if the file is huge)
  const rows = await parseCsvRows(csvContent);

  const distinctValues = new Set();
  rows.forEach((row) => {
    if (row[columnName]) {
      distinctValues.add(row[columnName]);
    }
  });

  return JSON.stringify([...distinctValues]);
}

/**
 * Helper function: parseCsvRows
 * Reads CSV content into an array of objects (up to 'limit' rows).
 */
function parseCsvRows(csvContent, limit = Infinity) {
  return new Promise((resolve, reject) => {
    const result = [];
    let count = 0;

    Readable.from(csvContent)
      .pipe(csvParser())
      .on("data", (row) => {
        if (count < limit) {
          result.push(row);
          count++;
        }
      })
      .on("end", () => resolve(result))
      .on("error", (error) => reject(error));
  });
}

module.exports = {
  getHeadersService,
  getFirst10RowsService,
  getDistinctValuesService,
};
