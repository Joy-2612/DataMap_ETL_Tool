// Sidebar.js
import React from "react";
import "../styles/Sidebar.css";
import { SiGoogledataproc } from "react-icons/si";
import { Link } from "react-router-dom";
import { FaHistory } from "react-icons/fa";
import { IoMdHelpCircleOutline } from "react-icons/io";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { LuFiles } from "react-icons/lu";

const Sidebar = ({ onAddDataset, datasets, onSelectDataset, isLoading }) => {
  console.log("Rendering Sidebar with datasets:", datasets);
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Link to="/">
          <SiGoogledataproc />
          DataSync
        </Link>
      </div>

      <p>Main Menu</p>
      <div className="menu-list">
        {/* Update the menu items below with actual paths and icons */}
        <Link to="dashboard" className="menu-item">
          <MdOutlineSpaceDashboard /> Dashboard
        </Link>
        <Link to="datasets" className="menu-item">
          <LuFiles /> Datasets
        </Link>
        <Link to="history" className="menu-item">
          <FaHistory /> History
        </Link>
        <Link to="help" className="menu-item">
          <IoMdHelpCircleOutline /> Help
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
