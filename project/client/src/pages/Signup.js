// Signup.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Briefcase, ShoppingBag } from "lucide-react"; // install lucide-react if needed, or use text
import StudentSignup from "./StudentSignup";
import StaffSignup from "./StaffSignup";
import VendorSignup from "./VendorSignup";

export default function Signup() {
  const navigate = useNavigate();
  // RECOMMENDATION: Default to 'student' so the page isn't empty on load
  const [activeTab, setActiveTab] = useState("student");

  const renderForm = () => {
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
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* LEFT SIDE: Brand & Visuals */}
      <div
        style={{
          flex: "1",
          background: "linear-gradient(135deg, #2f4156 0%, #1a2530 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          position: "relative",
          overflow: "hidden",
        }}
        className="hidden-mobile"
      >
        {" "}
        {/* Add a media query in CSS to hide this on mobile */}
        {/* Decorative Circle Backgrounds */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "-5%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(86, 124, 141, 0.2)",
          }}
        ></div>
        {/* Logo Area */}
        <div style={{ zIndex: 2 }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              background: "white",
              borderRadius: "12px",
              color: "#2f4156",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "24px",
            }}
          >
            E
          </div>
        </div>
        {/* Big Text */}
        <div style={{ zIndex: 2, maxWidth: "450px" }}>
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: "700",
              lineHeight: "1.1",
              marginBottom: "20px",
            }}
          >
            Join the <span style={{ color: "#8caabb" }}>Community.</span>
          </h1>
          <p style={{ fontSize: "1.1rem", opacity: 0.8, lineHeight: "1.6" }}>
            Discover campus events, manage your activities, and connect with the
            best vendors in one place.
          </p>
        </div>
        {/* Footer info */}
        <div style={{ zIndex: 2, opacity: 0.6, fontSize: "0.9rem" }}>
          © 2025 Eventity. All Rights Reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Form Area */}
      <div
        style={{
          flex: "1", // On Mobile make this 100% width
          backgroundColor: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "480px" }}>
          {/* Mobile Logo (Only show if left side is hidden) */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "700",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              Get Started
            </h2>
            <p style={{ color: "#64748b" }}>Create your account to continue</p>
          </div>

          {/* NEW: Segmented Control (Pill Switcher) */}
          <div
            style={{
              background: "#e2e8f0",
              padding: "4px",
              borderRadius: "12px",
              display: "flex",
              marginBottom: "32px",
            }}
          >
            {[
              { id: "student", label: "Student", icon: User },
              { id: "staff", label: "Staff", icon: Briefcase },
              { id: "vendor", label: "Vendor", icon: ShoppingBag },
            ].map((role) => {
              const isActive = activeTab === role.id;
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveTab(role.id)}
                  style={{
                    flex: 1,
                    border: "none",
                    background: isActive ? "white" : "transparent",
                    color: isActive ? "#2f4156" : "#64748b",
                    padding: "10px",
                    borderRadius: "10px",
                    fontWeight: isActive ? "600" : "500",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: isActive ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Icon size={16} /> {/* Optional Icon */}
                  {role.label}
                </button>
              );
            })}
          </div>

          {/* The Actual Form */}
          <div
            style={{
              animation: "fadeIn 0.4s ease-in-out",
            }}
          >
            {renderForm()}
          </div>

          {/* Footer Link */}
          <p
            style={{
              textAlign: "center",
              marginTop: "32px",
              color: "#64748b",
              fontSize: "0.95rem",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#2f4156",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
