//dependent datasets concat and mere

// Updated MultiStepForm.js
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import "../styles/MultiStepForm.css";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { FaTimes } from "react-icons/fa"; // For the cross icon

const Select = ({ children, value, onChange }) => (
  <select className="select" value={value} onChange={onChange}>
    {children}
  </select>
);

const SelectDataset = ({ children, value, onChange }) => (
  <select className="select-dataset" value={value} onChange={onChange}>
    {children}
  </select>
);

// ConcatenateStep Component
const ConcatenateStep = ({
  datasets,
  dataset1,
  setDataset1,
  columns1,
  setColumns1,
  selectedColumns,
  setSelectedColumns,
  delimiter,
  setDelimiter,
  goBack,
  fetchColumn,
}) => {
  const availableDatasets = datasets.filter((dataset) => dataset.name !== dataset1);

  const handleColumnSelect = (column) => {
    if (!selectedColumns.includes(column)) {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const handleColumnRemove = (column) => {
    setSelectedColumns(selectedColumns.filter((c) => c !== column));
  };

  return (
    <div className="card">
      <div className="card-header">
        <MdKeyboardArrowLeft className="back" onClick={goBack} />
        <span className="step-title">Step 2: Configure Operation</span>
      </div>
      <div className="card-content">
        <div className="table-inputs">
          <div className="table-1-inputs">
            <SelectDataset
              value={dataset1}
              onChange={(e) => {
                const selectedDataset = datasets.find((dataset) => dataset.name === e.target.value);
                setDataset1(e.target.value);
                fetchColumn(selectedDataset, setColumns1);
                setSelectedColumns([]); // Reset selected columns when dataset changes
              }}
            >
              <option value="">Select Dataset</option>
              {availableDatasets.map((dataset, index) => (
                <option key={index} value={dataset.name}>
                  {dataset.name}
                </option>
              ))}
            </SelectDataset>
            <Select
              value=""
              onChange={(e) => {
                const column = e.target.value;
                if (column) {
                  handleColumnSelect(column);
                }
              }}
            >
              <option value="">Select Columns</option>
              {columns1
                .filter((column) => !selectedColumns.includes(column)) // Filter out already selected columns
                .map((column, index) => (
                  <option key={index} value={column}>
                    {column}
                  </option>
                ))}
            </Select>

            {/* Title for chosen columns, only displayed when columns are selected */}
            {selectedColumns.length > 0 && (
              <div className="chosen-columns-title">Chosen Columns:</div>
            )}

            {/* Display selected columns */}
            <div className="selected-columns">
              {selectedColumns.map((column, index) => (
                <div key={index} className="selected-column">
                  {column}
                  <FaTimes
                    className="remove-icon"
                    onClick={() => handleColumnRemove(column)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="delimiter-title">Choose a Delimiter:</div>
        <div className="delimiter-input">
          <Select value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
            <option value=",">Comma ( , )</option>
            <option value=";">Semicolon ( ; )</option>
            <option value="|">Pipe ( | )</option>
            <option value=" ">Space ( )</option>
            <option value="-">Hyphen ( - )</option>
            <option value="_">Underscore ( _ )</option>
          </Select>
        </div>

        <div className="button-group">
          <button className="button operate" disabled={selectedColumns.length === 0}>
            Concatenate
          </button>
        </div>
      </div>
    </div>
  );
};

// MergeStep Component
const MergeStep = ({
  datasets,
  dataset1,
  setDataset1,
  dataset2,
  setDataset2,
  columns1,
  setColumns1,
  columns2,
  setColumns2,
  goBack,
  fetchColumn,
}) => {
  const availableDatasets = datasets.filter(
    (dataset) => dataset.name !== dataset1 && dataset.name !== dataset2
  );

  return (
    <div className="card">
      <div className="card-header">
        <MdKeyboardArrowLeft className="back" onClick={goBack} />
        <span className="step-title">Step 2: Merge</span>
      </div>
      <div className="card-content">
        <div className="table-inputs">
          <div className="table-1-inputs">
            <SelectDataset
              value={dataset1}
              onChange={(e) => {
                const selectedDataset = datasets.find((dataset) => dataset.name === e.target.value);
                setDataset1(e.target.value);
                fetchColumn(selectedDataset, setColumns1); // Fetch columns for dataset1
                setColumns2([]); // Reset columns2 when changing dataset1
              }}
            >
              <option value="">Select Dataset 1</option>
              {availableDatasets.map((dataset, index) => (
                <option key={index} value={dataset.name}>
                  {dataset.name}
                </option>
              ))}
            </SelectDataset>

            {/* Column Selection for Dataset 1 */}
           

            <Select
              value=""
              onChange={(e) => {
                const column = e.target.value;
                // Handle column selection for dataset1 if needed
              }}
              >
              <option value="">Select Columns for Dataset 1</option>
              {columns1.map((column, index) => (
                <option key={index} value={column}>
                  {column}
                </option>
              ))}
            </Select>
             
          </div>

          <div className="table-1-inputs">
            <SelectDataset
              value={dataset2}
              onChange={(e) => {
                const selectedDataset = datasets.find((dataset) => dataset.name === e.target.value);
                setDataset2(e.target.value);
                fetchColumn(selectedDataset, setColumns2); // Fetch columns for dataset2
              }}
            >
              <option value="">Select Dataset 2</option>
              {availableDatasets.map((dataset, index) => (
                <option key={index} value={dataset.name}>
                  {dataset.name}
                </option>
              ))}
            </SelectDataset>

            {/* Column Selection for Dataset 2 */}
           
            <Select
              value=""
              onChange={(e) => {
                const column = e.target.value;
                // Handle column selection for dataset2 if needed
              }}
            >
              <option value="">Select Columns for Dataset 2</option>
              {columns2.map((column, index) => (
                <option key={index} value={column}>
                  {column}
                </option>
              ))}
            </Select>
          
          </div>
        </div>

        <div className="button-group">
          <button className="button operate" disabled={!dataset1 || !dataset2}>
            Merge
          </button>
        </div>
      </div>
    </div>
  );
};

// Main MultiStepForm Component
const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [datasets, setDatasets] = useState([]);
  const [operation, setOperation] = useState("");
  const [dataset1, setDataset1] = useState("");
  const [dataset2, setDataset2] = useState(""); // Second dataset for merging
  const [selectedColumns, setSelectedColumns] = useState([]); // Initialize selectedColumns as an array
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]); // State for columns of dataset 2
  const [delimiter, setDelimiter] = useState(","); // State for delimiter
  const [isLoading, setIsLoading] = useState(false);

  const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(file.data);
      const text = new TextDecoder("utf-8").decode(uint8Array);

      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        complete: (result) => {
          resolve(result.data);
        },
        error: (error) => {
          console.error("Error parsing CSV: ", error);
          reject(error);
        },
      });
    });
  };

  const fetchColumn = async (dataset, setColumn) => {
    const csv = await parseCsvFile(dataset.file);
    const columns = Object.keys(csv[0]);
    setColumn(columns);
  };

  const userId = localStorage.getItem("userId");

  const fetchDatasets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/file/datasets/${userId}`);
      const data = await response.json();
      setDatasets(data.data);
    } catch (error) {
      console.error("Error fetching datasets: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const goBack = () => {
    setStep((prevStep) => Math.max(prevStep - 1, 1));
  };

  const renderStep1 = () => (
    <div className="card">
      <div className="card-header">Step 1: Choose Operation</div>
      <div className="card-content-step1">
        <div
          className="operation-card concatenate-card"
          onClick={() => {
            setOperation("Concatenate");
            setStep(2);
          }}
        >
          Concatenate
          <p>
            This operation is used to concatenate a column from a dataset by a delimiter.
          </p>
        </div>
        <div
          className="operation-card merge-card"
          onClick={() => {
            setOperation("Merge");
            setStep(2);
          }}
        >
          Merge
          <p>
            This operation is used to merge two datasets.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (operation === "Concatenate") {
      return (
        <ConcatenateStep
          datasets={datasets}
          dataset1={dataset1}
          setDataset1={setDataset1}
          columns1={columns1}
          setColumns1={setColumns1}
          selectedColumns={selectedColumns} // Pass selectedColumns
          setSelectedColumns={setSelectedColumns} // Pass setSelectedColumns
          delimiter={delimiter}
          setDelimiter={setDelimiter}
          goBack={goBack}
          fetchColumn={fetchColumn} // Pass fetchColumn to ConcatenateStep
        />
      );
    } else if (operation === "Merge") {
      return (
        <MergeStep
          datasets={datasets}
          dataset1={dataset1}
          setDataset1={setDataset1}
          dataset2={dataset2}
          setDataset2={setDataset2}
          columns1={columns1}
          setColumns1={setColumns1}
          columns2={columns2}
          setColumns2={setColumns2}
          goBack={goBack}
          fetchColumn={fetchColumn} // Pass fetchColumn to MergeStep
        />
      );
    }
  };

  return (
    <div className="multi-step-form">
      {step === 1 ? renderStep1() : renderStep2()}
    </div>
  );
};

export default MultiStepForm;