// client/src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./components/Pages/Register/Register";
import Login from "./components/Pages/Login/Login";
import Layout from "./components/Layout/Layout";

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home/*" element={<Layout />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
