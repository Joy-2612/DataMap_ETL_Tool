import React, { useEffect, useState, useRef } from "react";
import { AiOutlineFullscreen } from "react-icons/ai";
import { FaSearch } from "react-icons/fa"; // Import the search icon
import styles from "./Dropdown.module.css";

const Dropdown = ({
  datasets = [],
  selected,
  onSelect,
  onView,
  isOpen,
  setIsOpen,
  disabled,
}) => {
  const [activeTab, setActiveTab] = useState("Standard");
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  // Handle clicks outside to close the dropdown
  useEffect(() => {
    const handleOutsideClick = (event) => {
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
    setIsOpen(false); // Close the dropdown after selection
    setSearchQuery(""); // Reset the search query
  };

  // Filter datasets based on the active tab and search query
  const filteredDatasets =
    datasets?.filter((dataset) => {
      const matchesTab =
        (activeTab === "Standard" && dataset.result === false) ||
        (activeTab === "Result" && dataset.result === true);

      const matchesSearch = dataset.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    }) || [];

  return (
    <div ref={dropdownRef} className={`${styles.dropdown} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.dropdownHeader} onClick={() => !disabled && setIsOpen(!isOpen)}
      >
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
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.dropdownList}>
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.name}
                className={`${styles.dropdownItem} ${disabled ? styles.disabledItem : ''}`}
                onClick={() => !disabled && handleSelect(dataset)}
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
            {filteredDatasets.length === 0 && (
              <div className={styles.noResults}>No datasets found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
