import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { toast } from "sonner";
import { UserContext } from "../context/UserContext"; // Import the UserContext

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUserId } = useContext(UserContext); // Get setUserId from context

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Login Successful");
        // Save the token and userId to local storage and context
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id); // Save userId in local storage
        setUserId(data.user.id); // Set userId in context
        navigate("/home"); // Redirect to dashboard
      } else {
        // Handle errors (e.g., show error message)
        toast.error(data.message);
        console.error("Login failed:", data.message);
      }
    } catch (error) {
      toast.error("An error occurred during login");
      console.error("An error occurred:", error);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p>
          Don't have an account?{" "}
          <span onClick={() => navigate("/")}>Register here</span>
        </p>
      </form>
    </div>
  );
};

export default Login;