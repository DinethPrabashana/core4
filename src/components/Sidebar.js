import React from "react";
import corefourLogo from "../assets/corefour.jpg";

export default function Sidebar({ setActivePage }) {
  return (
    <div
      style={{
        width: "11%",
        backgroundColor: "#02090fff",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        color: "white",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <img
          src={corefourLogo}
          alt="CoreFour Logo"
          style={{ width: "100px", height: "100px", marginBottom: "5px" }}
        />
        <h2 style={{ fontSize: "30px", fontWeight: "bold" }}>CoreFour</h2>
      </div>

      <button style={{ padding: "15px", fontSize: "16px" }} onClick={() => setActivePage("page1")}>
        Transformers
      </button>
      <button style={{ padding: "15px", fontSize: "16px" }} onClick={() => setActivePage("page2")}>
        Settings
      </button>
    </div>
  );
}
