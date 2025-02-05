import React, { useState } from "react";
import { SiGoogledataproc } from "react-icons/si";
import { Link } from "react-router-dom";
import { FaHistory } from "react-icons/fa";
import { IoMdHelpCircleOutline } from "react-icons/io";
import { MdOutlineSpaceDashboard, MdKeyboardArrowLeft } from "react-icons/md";
import { LuFiles } from "react-icons/lu";
import { RiFlowChart } from "react-icons/ri";
import styles from "./Sidebar.module.css";

const Sidebar = ({ onAddDataset, onSelectDataset, isLoading }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarLogo}>
        <Link to="/">
          <SiGoogledataproc />
          {!isCollapsed && <span>DataSync</span>}
        </Link>
      </div>

      <div className={styles.mainMenuContainer} onClick={() => setIsCollapsed(!isCollapsed)}>
        <div
          className={`${styles.collapseBtn} ${isCollapsed ? styles.rotated : ''}`}
          
        >
          <MdKeyboardArrowLeft/> 
        </div>
        {!isCollapsed && <p className={styles.mainMenuText}>Main Menu</p>}
      </div>

      <div className={styles.menuList}>
        <Link to="dashboard" className={styles.menuItem} title="Dashboard">
          <MdOutlineSpaceDashboard />
          {!isCollapsed && <span>Dashboard</span>}
        </Link>
        <Link to="datasets" className={styles.menuItem} title="Datasets">
          <LuFiles />
          {!isCollapsed && <span>Datasets</span>}
        </Link>
        <Link to="history" className={styles.menuItem} title="Results">
          <FaHistory />
          {!isCollapsed && <span>Results</span>}
        </Link>
        <Link to="flow-diagrams" className={styles.menuItem} title="Flow Diagrams">
          <RiFlowChart />
          {!isCollapsed && <span>Flow Diagrams</span>}
        </Link>
        <Link to="help" className={styles.menuItem} title="Help">
          <IoMdHelpCircleOutline />
          {!isCollapsed && <span>Help</span>}
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
