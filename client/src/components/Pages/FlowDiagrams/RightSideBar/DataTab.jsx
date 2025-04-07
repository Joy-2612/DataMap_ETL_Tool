import React, { useCallback } from 'react';
import { FaFileCsv, FaFileExcel, FaEye, FaSearch } from 'react-icons/fa';
import styles from './DataTab.module.css';

// Moved DatasetGrid outside and memoized it
const DatasetGrid = React.memo(({ 
  items, 
  search, 
  setSearch, 
  handleDragStart, 
  handleDoubleClick, 
  handlePeekDataset, 
  selectedNodeId 
}) => {
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.datasetGroup}>
      <div className={styles.searchContainer}>
        <FaSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search datasets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
          autoFocus // Optional: Maintain focus on mobile
        />
      </div>
      <div className={styles.datasetGrid}>
        {filteredItems.map((item) => (
          <div
            key={item._id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDoubleClick={() => handleDoubleClick(item)}
            className={`${styles.datasetCard} ${
              selectedNodeId === item._id ? styles.highlightedCard : ''
            }`}
          >
            <div className={styles.cardHeader}>
              {item.type === 'csv' || item.type === 'text/csv' ? (
                <FaFileCsv className={styles.fileIcon} />
              ) : (
                <FaFileExcel className={styles.fileIcon} />
              )}
              <span className={styles.datasetName}>{item.name}</span>
              <button
                className={styles.peekButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePeekDataset(item);
                }}
              >
                <FaEye />
              </button>
            </div>
            <div className={styles.cardMeta}>
              <span>{(item.size / 1024).toFixed(1)}KB</span>
              <span>{item.type.split('/').pop().toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const DataTab = ({
  dataSubTab,
  setDataSubTab,
  datasets,
  results,
  searchSource,
  searchResult,
  setSearchSource,
  setSearchResult,
  handleDragStart,
  handleDoubleClick,
  handlePeekDataset,
  selectedNodeId,
}) => {
  // Memoize the handlers
  const memoizedHandleDragStart = useCallback(handleDragStart, []);
  const memoizedHandleDoubleClick = useCallback(handleDoubleClick, []);
  const memoizedHandlePeekDataset = useCallback(handlePeekDataset, []);

  return (
    <div className={styles.dataContent}>
      <div className={styles.subTabs}>
        <button
          className={`${styles.subTabButton} ${
            dataSubTab === "source" ? styles.activeSubTab : ""
          }`}
          onClick={() => setDataSubTab("source")}
        >
          Source Datasets
        </button>
        <button
          className={`${styles.subTabButton} ${
            dataSubTab === "results" ? styles.activeSubTab : ""
          }`}
          onClick={() => setDataSubTab("results")}
        >
          Result Datasets
        </button>
      </div>
      <div className={styles.datasetsScrollContainer}>
        {dataSubTab === "source" ? (
          <DatasetGrid
            items={datasets}
            search={searchSource}
            setSearch={setSearchSource}
            handleDragStart={memoizedHandleDragStart}
            handleDoubleClick={memoizedHandleDoubleClick}
            handlePeekDataset={memoizedHandlePeekDataset}
            selectedNodeId={selectedNodeId}
          />
        ) : (
          <DatasetGrid
            items={results}
            search={searchResult}
            setSearch={setSearchResult}
            handleDragStart={memoizedHandleDragStart}
            handleDoubleClick={memoizedHandleDoubleClick}
            handlePeekDataset={memoizedHandlePeekDataset}
            selectedNodeId={selectedNodeId}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(DataTab);