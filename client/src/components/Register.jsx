// Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import styles from "../styles/Register.module.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration successful");
        navigate("/login");
      } else {
        toast.error(data.message);
        console.error("Registration failed:", data.message);
      }
    } catch (error) {
      toast.error("An error occurred during registration");
      console.error("An error occurred:", error);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <form className={styles.registerForm} onSubmit={handleRegister}>
        <h2>Register</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.registerInput}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.registerInput}
        />
        <button type="submit" className={styles.registerButton}>
          Register
        </button>
        <p className={styles.registerText}>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} className={styles.loginLink}>
            Login here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
