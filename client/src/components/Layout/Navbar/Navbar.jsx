import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check if the user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token); // Set to true if token exists, false otherwise
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token from local storage
    setIsAuthenticated(false); // Update the authentication state
    navigate("/login"); // Redirect to login page
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.buttons}>
        {isAuthenticated ? (
          <button onClick={handleLogout} className={styles.signOutButton}>
            Logout
          </button>
        ) : (
          <Link to="/login" className={styles.signInButton}>
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
