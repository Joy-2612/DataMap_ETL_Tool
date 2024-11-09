import React, { useEffect, useState, useRef } from "react";
import { AiOutlineFullscreen } from "react-icons/ai";
import styles from "./Dropdown.module.css";

const Dropdown = ({
  datasets = [],
  selected,
  onSelect,
  onView,
  isOpen,
  setIsOpen,
}) => {
  const [activeTab, setActiveTab] = useState("Standard");
  const dropdownRef = useRef(null);

  // Handle clicks outside to close the dropdown
  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Check if setIsOpen is a valid function before calling
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        typeof setIsOpen === "function"
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [setIsOpen]);

  const handleSelect = (dataset) => {
    onSelect(dataset);
  };

  // Filter datasets based on the active tab
  const filteredDatasets =
    datasets?.filter((dataset) => {
      if (activeTab === "Standard") return dataset.result === false;
      if (activeTab === "Result") return dataset.result === true;
      return true;
    }) || [];

  return (
    <div ref={dropdownRef} className={styles.dropdown}>
      <div className={styles.dropdownHeader} onClick={() => setIsOpen(!isOpen)}>
        {selected ? selected.name : "Select Dataset"}
      </div>
      {isOpen && (
        <div className={styles.dropdownContent}>
          <div className={styles.tabContainer}>
            <span
              className={`${styles.tab} ${
                activeTab === "Standard" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("Standard")}
            >
              Standard
            </span>
            <span
              className={`${styles.tab} ${
                activeTab === "Result" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("Result")}
            >
              Result
            </span>
          </div>
          <div className={styles.dropdownList}>
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.name}
                className={styles.dropdownItem}
                onClick={() => handleSelect(dataset)}
              >
                <div className={styles.datasetInfo}>
                  <span>{dataset.name}</span>
                  <p className={styles.datasetDescription}>
                    {dataset.description}
                  </p>
                </div>
                <AiOutlineFullscreen
                  className={styles.viewIcon}
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(dataset);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
