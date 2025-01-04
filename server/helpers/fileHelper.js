// server/helpers/fileHelper.js

const xml2js = require("xml2js");

/**
 * Convert JSON array to CSV
 * @param {Array} jsonData - An array of objects
 * @returns {String} CSV String
 */
const jsonToCSV = (jsonData) => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    throw new Error("Invalid JSON data: should be a non-empty array.");
  }

  const headers = Object.keys(jsonData[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(","));

  // Add rows
  jsonData.forEach((obj) => {
    const values = headers.map((header) => {
      const escapedValue = ("" + (obj[header] || "")).replace(/"/g, '\\"');
      return `"${escapedValue}"`;
    });
    csvRows.push(values.join(","));
  });

  return csvRows.join("\n");
};

/**
 * Convert XML to CSV
 * @param {String} xmlData - XML string
 * @returns {Promise<String>} CSV String
 */
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
      const childKey = Object.keys(rootElement)[0];
      const items = rootElement[childKey];

      // Normalize the items to an array if there's only one item
      const itemArray = Array.isArray(items) ? items : [items];

      // Flatten nested XML structures
      const flattenedData = itemArray.map((item) => flattenXMLObject(item));

      // Convert to CSV
      const csvResult = jsonToCSV(flattenedData);
      resolve(csvResult);
    });
  });
};

/**
 * Recursive function to flatten a nested object (used in XML to CSV conversion)
 * @param {Object} obj - The object to flatten
 * @param {String} parent - Parent key (for nesting)
 * @param {Object} res - Accumulator for results
 * @returns {Object} Flattened object
 */
const flattenXMLObject = (obj, parent = "", res = {}) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const propName = parent ? `${parent}.${key}` : key;

      if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        flattenXMLObject(obj[key], propName, res);
      } else {
        const value = Array.isArray(obj[key])
          ? obj[key].join(", ")
          : (obj[key] || "").toString();
        res[propName] = value;
      }
    }
  }
  return res;
};

/**
 * Convert JSON to XML
 * @param {Array<Object>} jsonData - An array of objects to convert
 * @returns {String} XML String
 */
const jsonToXML = (jsonData) => {
  const builder = new xml2js.Builder({
    renderOpts: { pretty: true },
    xmldec: { version: "1.0", encoding: "UTF-8" },
  });

  const formattedData = jsonData.map((item) => {
    const newItem = {};
    for (const key in item) {
      // Replace spaces in keys with underscores
      const newKey = key.replace(/ /g, "_");
      newItem[newKey] = item[key];
    }
    return newItem;
  });

  // Wrap in a root element => <rows><row>... each item ...</row></rows>
  return builder.buildObject({ rows: { row: formattedData } });
};

/**
 * Convert CSV string to JSON array
 * @param {String} csvString - The CSV string
 * @returns {Array<Object>} - JSON data
 */
const csvToJson = (csvString) => {
  const rows = csvString.trim().split("\n");
  if (rows.length === 0) return [];

  const headers = rows[0].split(",").map((h) => h.trim().replace(/ /g, "_"));

  const data = rows.slice(1).map((row) => {
    const values = row.split(",");
    const jsonRow = {};
    headers.forEach((header, index) => {
      jsonRow[header] = values[index]?.trim() ?? "";
    });
    return jsonRow;
  });

  return data;
};

/**
 * Natural Join two arrays of objects on specified keys
 * @param {Array<Object>} dataset1
 * @param {Array<Object>} dataset2
 * @param {String} key1
 * @param {String} key2
 */
const naturalJoin = (dataset1, dataset2, key1, key2) => {
  const joinedData = [];

  // Create a map for dataset2 keyed by key2
  const map2 = new Map();
  dataset2.forEach((row) => {
    const key = row[key2];
    if (!map2.has(key)) {
      map2.set(key, []);
    }
    map2.get(key).push(row);
  });

  // Match from dataset1 to dataset2
  dataset1.forEach((row1) => {
    const key = row1[key1];
    const matchingRows = map2.get(key);

    if (matchingRows) {
      matchingRows.forEach((row2) => {
        joinedData.push({ ...row1, ...row2 });
      });
    }
  });

  return joinedData;
};

/**
 * Full Outer Join two arrays of objects on specified keys
 * @param {Array<Object>} dataset1
 * @param {Array<Object>} dataset2
 * @param {String} key1
 * @param {String} key2
 */
const fullOuterJoin = (dataset1, dataset2, key1, key2) => {
  const joinedData = [];

  const map2 = new Map();
  dataset2.forEach((row) => {
    const key = row[key2];
    if (!map2.has(key)) {
      map2.set(key, []);
    }
    map2.get(key).push(row);
  });

  const matchedKeys = new Set();

  // Join from dataset1 => dataset2
  dataset1.forEach((row1) => {
    const key = row1[key1];
    const matchingRows = map2.get(key);

    if (matchingRows) {
      matchingRows.forEach((row2) => {
        joinedData.push({ ...row1, ...row2 });
      });
      matchedKeys.add(key);
    } else {
      // row1 has no match
      const rowWithNulls = { ...row1 };
      Object.keys(dataset2[0] || {}).forEach((col) => {
        if (!(col in rowWithNulls)) rowWithNulls[col] = null;
      });
      joinedData.push(rowWithNulls);
    }
  });

  // Add any unmatched rows from dataset2
  dataset2.forEach((row2) => {
    const key = row2[key2];
    if (!matchedKeys.has(key)) {
      const rowWithNulls = { ...row2 };
      Object.keys(dataset1[0] || {}).forEach((col) => {
        if (!(col in rowWithNulls)) rowWithNulls[col] = null;
      });
      joinedData.push(rowWithNulls);
    }
  });

  return joinedData;
};

// Export all helper functions
module.exports = {
  jsonToCSV,
  xmlToCSV,
  jsonToXML,
  csvToJson,
  naturalJoin,
  fullOuterJoin,
};
