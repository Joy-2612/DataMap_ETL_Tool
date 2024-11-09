// Sidebar.js
import React from "react";
import { SiGoogledataproc } from "react-icons/si";
import { Link } from "react-router-dom";
import { FaHistory } from "react-icons/fa";
import { IoMdHelpCircleOutline } from "react-icons/io";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { LuFiles } from "react-icons/lu";
import styles from "../styles/Sidebar.module.css";

const Sidebar = ({ onAddDataset, onSelectDataset, isLoading }) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <Link to="/">
          <SiGoogledataproc />
          DataSync
        </Link>
      </div>

      <p className={styles.mainMenuText}>Main Menu</p>
      <div className={styles.menuList}>
        <Link to="dashboard" className={styles.menuItem}>
          <MdOutlineSpaceDashboard /> Dashboard
        </Link>
        <Link to="datasets" className={styles.menuItem}>
          <LuFiles /> Datasets
        </Link>
        <Link to="history" className={styles.menuItem}>
          <FaHistory /> History
        </Link>
        <Link to="help" className={styles.menuItem}>
          <IoMdHelpCircleOutline /> Help
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
