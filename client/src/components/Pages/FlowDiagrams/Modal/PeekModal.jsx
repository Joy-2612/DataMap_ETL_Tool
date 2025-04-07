import React from "react";
import ReactDOM from "react-dom";
import { IoMdClose } from "react-icons/io";
import DataTable from "../../../UI/DataTable/DataTable"
import styles from "./PeekModal.module.css";

const PeekModal = ({ isOpen, onClose, data, selectedCsvData }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className={`${styles.modalOverlay} ${styles.modalOverlayVisible}`}
      onClick={onClose}
    >
      <div
        className={`${styles.modalContent} ${styles.modalContentVisible}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalTitle}>
          {data.name}
          <IoMdClose
            className={styles.closeButton}
            onClick={onClose}
          />
        </div>
        {selectedCsvData.length > 0 ? (
          <DataTable
            title="CSV Data"
            columns={Object.keys(selectedCsvData[0] || {}).map((key) => ({
              label: key,
              key: key,
            }))}
            data={selectedCsvData}
            getRowId={(row, index) => index} // Use index if _id is not present
          />
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PeekModal;