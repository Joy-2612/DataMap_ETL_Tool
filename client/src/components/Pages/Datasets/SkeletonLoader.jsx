// /src/components/Datasets/SkeletonLoader.js
import React from "react";
import styles from "./SkeletonLoader.module.css";

const SkeletonLoader = () => (
  <div className={styles.skeletonItem}>
    <div className={styles.skeletonLine} style={{ width: "80%" }} />
    <div className={styles.skeletonLine} style={{ width: "60%" }} />
    <div className={styles.skeletonLine} style={{ width: "40%" }} />
  </div>
);

export default SkeletonLoader;
