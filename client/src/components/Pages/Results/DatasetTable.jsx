// /src/components/Datasets/DatasetTable.js
import React, { useMemo } from "react";
import styles from "./DatasetTable.module.css";
import { FaEye, FaSort, FaSortUp, FaSortDown, FaPen } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

// The table component filters and sorts datasets before rendering.
const DatasetTable = ({
  datasets,
  isLoading,
  searchTerm,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onDelete,
  onRename,
}) => {
  const [editingId, setEditingId] = React.useState(null);
  const [draftName, setDraftName] = React.useState("");

  const filteredDatasets = useMemo(() => {
    let filtered = datasets.filter(
      (dataset) =>
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dataset.description &&
          dataset.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (sortBy) {
      filtered.sort((a, b) => {
        let valueA, valueB;
        switch (sortBy) {
          case "date":
            valueA = new Date(a.createdAt);
            valueB = new Date(b.createdAt);
            break;
          case "size":
            valueA = a.size;
            valueB = b.size;
            break;
          default:
            valueA = a[sortBy]?.toLowerCase();
            valueB = b[sortBy]?.toLowerCase();
        }
        if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
        if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [datasets, searchTerm, sortBy, sortOrder]);

  const getSortIcon = (column) => {
    if (sortBy !== column) return <FaSort />;
    return sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading datasets...</div>;
  }

  const startRename = (ds) => {
    setEditingId(ds._id);
    setDraftName(ds.name);
  };

  const cancelRename = () => {
    setEditingId(null);
    setDraftName("");
  };

  const commitRename = async () => {
    if (
      draftName.trim() &&
      draftName.trim() !== datasets.find((d) => d._id === editingId)?.name
    ) {
      await onRename(editingId, draftName.trim());
    }
    cancelRename();
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th
              className={styles.sortableHeader}
              onClick={() => onSort("name")}
            >
              Name {getSortIcon("name")}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => onSort("size")}
            >
              Size (bytes) {getSortIcon("size")}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => onSort("type")}
            >
              Type {getSortIcon("type")}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => onSort("date")}
            >
              Date Created {getSortIcon("date")}
            </th>
            <th className={styles.tableHeader}>Actions</th>
            <th className={styles.tableHeader}>Export</th>
          </tr>
        </thead>
        <tbody>
          {filteredDatasets.length > 0 ? (
            filteredDatasets.map((dataset, index) => (
              <tr key={index} className={styles.tableRow}>
                <td className={styles.tableData}>
                  {editingId === dataset._id ? (
                    <input
                      autoFocus
                      className={styles.renameInput}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                    />
                  ) : (
                    <div className={styles.datasetName}>{dataset.name}</div>
                  )}
                  {dataset.description && (
                    <div className={styles.datasetDescription}>
                      {dataset.description}
                    </div>
                  )}
                </td>
                <td className={styles.tableData}>{dataset.size}</td>
                <td className={styles.tableData}>{dataset.type}</td>
                <td className={styles.tableData}>
                  {new Date(dataset.createdAt).toLocaleString()}
                </td>
                <td className={styles.tableData}>
                  <FaEye
                    className={`${styles.iconButton} ${styles.viewButton}`}
                    onClick={() => onView(dataset)}
                  />
                  <FaPen
                    className={`${styles.iconButton} ${styles.editButton}`}
                    onClick={() => startRename(dataset)}
                  />
                  <MdDelete
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    onClick={() => onDelete(dataset._id)}
                  />
                </td>
                <td className={styles.tableData}>
                  <button
                    className={`${styles.exportButton} ${styles.exportCsv}`}
                    onClick={() => exportAsCsv(dataset)}
                  >
                    CSV
                  </button>
                  <button
                    className={`${styles.exportButton} ${styles.exportPdf}`}
                    onClick={() => exportAsPdf(dataset)}
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className={styles.tableData}>
                No datasets available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Helper functions for exporting CSV and PDF.
const exportAsCsv = async (dataset) => {
  const Papa = await import("papaparse");
  const uint8Array = new Uint8Array(dataset.file.data);
  const text = new TextDecoder("utf-8").decode(uint8Array);
  Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    complete: (result) => {
      const csvData = Papa.unparse(result.data);
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${dataset.name}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    error: (error) => {
      console.error("Error parsing CSV: ", error);
    },
  });
};

const exportAsPdf = async (dataset) => {
  const jsPDFModule = await import("jspdf");
  const { jsPDF } = jsPDFModule;
  const Papa = await import("papaparse");
  const uint8Array = new Uint8Array(dataset.file.data);
  const text = new TextDecoder("utf-8").decode(uint8Array);
  Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    complete: (result) => {
      const doc = new jsPDF();
      doc.text(dataset.name, 10, 10);
      doc.autoTable({
        head: [Object.keys(result.data[0] || {})],
        body: result.data.map((row) => Object.values(row)),
      });
      doc.save(`${dataset.name}.pdf`);
    },
    error: (error) => {
      console.error("Error parsing CSV: ", error);
    },
  });
};

export default DatasetTable;
