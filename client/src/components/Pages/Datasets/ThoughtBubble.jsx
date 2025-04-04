// /src/components/Datasets/ThoughtBubble.js
import React from "react";
import styles from "./ThoughtBubble.module.css";

const ThoughtBubble = ({ thought, index }) => (
  <div className={styles.thoughtItem}>
    <div className={styles.thoughtIndicator}>
      <div className={styles.thoughtLine} />
    </div>
    <div className={styles.thoughtContent}>{thought}</div>
  </div>
);

export default ThoughtBubble;
