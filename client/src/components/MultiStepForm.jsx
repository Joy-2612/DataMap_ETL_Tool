import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import "../styles/MultiStepForm.css";
import { IoMdAddCircleOutline } from "react-icons/io";
import { VscMerge } from "react-icons/vsc";
import { MdKeyboardArrowLeft } from "react-icons/md";

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

const MultiStepForm = () => {
  const [step, setStep] = useState(1); // Start at step 1
  const [datasets, setDatasets] = useState([]); // All datasets fetched from the API
  const [operation, setOperation] = useState("");
  const [dataset1, setDataset1] = useState("");
  const [dataset2, setDataset2] = useState("");
  const [column1, setColumn1] = useState("");
  const [column2, setColumn2] = useState("");
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]);
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

  // Fetch userId from local storage
  const userId = localStorage.getItem("userId");

  // Fetch datasets from the API
  const fetchDatasets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/file/datasets/${userId}`
      );
      const data = await response.json();
      setDatasets(data.data); // Assuming data.data contains the list of datasets
    } catch (error) {
      console.error("Error fetching datasets: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch datasets when the component mounts
  useEffect(() => {
    fetchDatasets();
  }, []);

  const goBack = () => {
    console.log(step);
    setStep((prevStep) => Math.max(prevStep - 1, 1)); // Ensures the minimum step is 2
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
            This operation is used to concatenate two columns from different
            tables by a delimeter.
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
            This operation is used to merge two columns from different tables
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const availableDatasets1 = datasets.filter(
      (dataset) => dataset.name !== dataset2
    );

    const availableDatasets2 = datasets.filter(
      (dataset) => dataset.name !== dataset1
    );

    return (
      <div className="card">
        <div className="card-header">
          <MdKeyboardArrowLeft className="back" onClick={goBack} />
          Step 2: Configure Operation
        </div>
        <div className="card-content">
          <div className="table-inputs">
            <div className="table-1-inputs">
              <SelectDataset
                value={dataset1}
                onChange={(e) => {
                  const selectedDataset = datasets.find(
                    (dataset) => dataset.name === e.target.value
                  );
                  setDataset1(e.target.value);
                  fetchColumn(selectedDataset, setColumns1);
                }}
              >
                <option value="">Select Dataset 1</option>
                {availableDatasets1.map((dataset, index) => (
                  <option key={index} value={dataset.name}>
                    {dataset.name}
                  </option>
                ))}
              </SelectDataset>
              <Select
                value={column1}
                onChange={(e) => setColumn1(e.target.value)}
              >
                <option value="">Select Column 1</option>
                {columns1.map((column, index) => (
                  <option key={index} value={column}>
                    {column}
                  </option>
                ))}
              </Select>
            </div>

            <div className="operation-icon">
              {operation === "Concatenate" ? (
                <IoMdAddCircleOutline />
              ) : (
                <VscMerge />
              )}
            </div>

            <div className="table-2-inputs">
              <SelectDataset
                value={dataset2}
                onChange={(e) => {
                  const selectedDataset = datasets.find(
                    (dataset) => dataset.name === e.target.value
                  );
                  setDataset2(e.target.value);
                  fetchColumn(selectedDataset, setColumns2);
                }}
              >
                <option value="">Select Dataset 2</option>
                {availableDatasets2.map((dataset, index) => (
                  <option key={index} value={dataset.name}>
                    {dataset.name}
                  </option>
                ))}
              </SelectDataset>
              <Select
                value={column2}
                onChange={(e) => setColumn2(e.target.value)}
              >
                <option value="">Select Column 2</option>
                {columns2.map((column, index) => (
                  <option key={index} value={column}>
                    {column}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="button-group">
            <button
              className="button operate"
              disabled={!(dataset1 && dataset2 && column1 && column2)}
            >
              {operation === "Merge" ? "Merge" : "Concatenate"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
    </div>
  );
};

export default MultiStepForm;
