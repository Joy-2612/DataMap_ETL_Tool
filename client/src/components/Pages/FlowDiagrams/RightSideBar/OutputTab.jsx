import React from 'react';
import { FaChartBar } from 'react-icons/fa';
import styles from './OutputTab.module.css';

const OutputTab = ({
  newNodeName,
  newNodeDesc,
  setNewNodeName,
  setNewNodeDesc,
  onAddNodeOutput
}) => {
  return (
    <div className={styles.outputCreator}>
      <h4 className={styles.creatorTitle}>
        <FaChartBar /> Create Output Node
      </h4>
      <input
        type="text"
        placeholder="Output name"
        value={newNodeName}
        onChange={(e) => setNewNodeName(e.target.value)}
        className={styles.creatorInput}
      />
      <textarea
        placeholder="Description..."
        value={newNodeDesc}
        onChange={(e) => setNewNodeDesc(e.target.value)}
        className={styles.creatorTextarea}
      />
      <button
        className={styles.creatorButton}
        disabled={!newNodeName || !newNodeDesc}
        onClick={() => {
          if (onAddNodeOutput) {
            onAddNodeOutput({
              id: Date.now().toString(),
              name: newNodeName,
              desc: newNodeDesc,
            });
            setNewNodeName("");
            setNewNodeDesc("");
          }
        }}
      >
        Create Node
      </button>
    </div>
  );
};

export default OutputTab;