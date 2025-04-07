import React from 'react';
import PropTypes from 'prop-types';
import styles from './ActionsTab.module.css';
import { FaChevronRight } from "react-icons/fa";

const ActionCard = ({ action, onClick }) => {
  return (
    <button
      className={styles.actionCard}
      onClick={onClick}
      style={{ borderColor: action.color }}
    >
      <div
        className={styles.actionIconContainer}
        style={{ backgroundColor: `${action.color}20` }}
      >
        {React.cloneElement(action.icon, {
          style: { color: action.color, fontSize: '1.4rem' }
        })}
      </div>
      
      <div className={styles.actionTextContainer}>
        <span className={styles.actionName}>{action.name}</span>
        <span className={styles.actionDescription}>{action.description}</span>
      </div>
      
      <div className={styles.actionHoverIndicator} style={{ color: action.color }}>
        <FaChevronRight className={styles.chevronIcon} />
      </div>
    </button>
  );
};

ActionCard.propTypes = {
  action: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    icon: PropTypes.element.isRequired,
    description: PropTypes.string.isRequired
  }).isRequired,
  onClick: PropTypes.func.isRequired
};

export default ActionCard;