import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Login Page</h2>

      {/* Your login form can stay here */}

      <Link
        to="/events"
        className="eo-btn"
        style={{ display: "inline-block", marginTop: 12 }}
      >
        Go to Events Office
      </Link>
    </div>
  );
}
