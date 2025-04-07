import React from 'react';
import ActionCard from './ActionCard';
import styles from './ActionsTab.module.css';

const ActionsTab = ({ actionOptions, handleActionSelect }) => {
  return (
    <div className={styles.actionPanel}>
      <h4 className={styles.sectionTitle}>Data Transformations</h4>
      <div className={styles.actionsGrid}>
        {actionOptions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onClick={() => handleActionSelect(action)}
          />
        ))}
      </div>
    </div>
  );
};

export default ActionsTab;