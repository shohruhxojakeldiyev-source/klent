import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Client from "./pages/client";
import "./App.css";
import CreateApp from "./pages/CreateApp";

function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{
        padding: "16px 20px",
        background: "#fff",
        borderBottom: "1px solid #ddd",
        display: "flex",
        justifyContent: "center"
      }}>
        <h2 style={{ margin: 0 }}>👥 Klient</h2>
      </div>
      <div style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/client" element={<Client />} />
          <Route path="/createApp/:id" element={<CreateApp/>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;