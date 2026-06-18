import React from "react";
import Client from "./pages/client";
import "./App.css";

function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{
        padding: "16px 20px",
        background: "#fff",
        borderBottom: "1px solid #ddd",
        display: 'flex',
        justifyContent: 'center'
      }}>
        <h2 style={{margin:0}}>👥 Klient</h2>
      </div>
      <div style={{ padding: "20px" }}>
        <Client />
      </div>
    </div>
  );
}

export default App;