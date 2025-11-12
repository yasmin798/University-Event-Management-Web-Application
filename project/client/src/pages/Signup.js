// Updated Signup.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSignup from "./StudentSignup";
import StaffSignup from "./StaffSignup";
import VendorSignup from "./VendorSignup";

export default function Signup() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null); // Initially null, no form shown

  const tabs = [
    { id: "student", title: "Student", color: "#2f4156" },
    { id: "staff", title: "Staff", color: "#567c8d" },
    { id: "vendor", title: "Vendor", color: "#c8d9e6" },
  ];

  const renderForm = () => {
    if (!activeTab) {
      return (
        <p
          style={{
            color: "#6B7280",
            fontSize: "1.1rem",
            fontWeight: "500",
            textAlign: "center",
            margin: "0",
          }}
        >
          Select a role above to get started.
        </p>
      );
    }

    switch (activeTab) {
      case "student":
        return <StudentSignup />;
      case "staff":
        return <StaffSignup />;
      case "vendor":
        return <VendorSignup />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#c8d9e6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Poppins, Arial, sans-serif",
        textAlign: "center",
        padding: "20px",
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "700",
          color: "#111827",
          marginBottom: "30px",
        }}
      >
        Sign Up
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "40px",
          backgroundColor: "#f5efeb",
          borderRadius: "10px",
          padding: "5px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: activeTab === tab.id ? "#fff" : "transparent",
              color: activeTab === tab.id ? "#111827" : "#6B7280",
              fontWeight: activeTab === tab.id ? "600" : "500",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: activeTab === tab.id
                ? "0 2px 4px rgba(0, 0, 0, 0.1)"
                : "none",
            }}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Form Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "500px", // Wider: 500px
          backgroundColor: "#f5efeb",
          borderRadius: "20px", // Nicer: larger radius
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)", // Nicer: deeper shadow
          border: "1px solid rgba(255, 255, 255, 0.2)", // Subtle border
          padding: "40px",
          minHeight: "550px", // Slightly taller for better proportions
        }}
      >
        {renderForm()}
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "30px",
          backgroundColor: "#E5E7EB",
          color: "#111827",
          border: "none",
          borderRadius: "10px",
          padding: "12px 28px",
          fontSize: "1rem",
          fontWeight: "500",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#D1D5DB";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#E5E7EB";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        ← Back to Home
      </button>
    </div>
  );
}