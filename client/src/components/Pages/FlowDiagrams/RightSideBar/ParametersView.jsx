import React from 'react';
import styles from './ParametersView.module.css';
import { FaArrowLeft } from 'react-icons/fa';

const ParametersView = ({
  selectedAction,
  handleBackClick,
  selectedNode,
  nodes,
  setNodes,
  datasets_source,
  setDatasets_source,
}) => {
  const ActionComponent = selectedAction?.component;
  
  return (
    <div className={styles.parametersView}>
      <div className={styles.parametersHeader}>
        <button onClick={handleBackClick} className={styles.backButton}>
          <FaArrowLeft />
        </button>
        <div className={styles.parametersTitle}>
          <h2>{selectedAction.name}</h2>
        </div>
      </div>
      <div className={styles.parametersContent}>
        {ActionComponent && (
          <ActionComponent
            nodeId={selectedNode?.id}
            nodes={nodes}
            setNodes={setNodes}
            datasets_source={datasets_source}
            setDatasets_source={setDatasets_source}
          />
        )}
      </div>
    </div>
  );
};

export default ParametersView;