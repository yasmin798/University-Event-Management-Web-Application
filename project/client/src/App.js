import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ Import all your pages
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentSignup from "./pages/StudentSignup";
import StaffSignup from "./pages/StaffSignup";
import VendorSignup from "./pages/VendorSignup";
import Admin from "./pages/Admin"; // ✅ Added admin page

function App() {
  return (
    <Router>
      <Routes>
        {/* 🏠 Main routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* 👩‍🎓 Student / Staff / Vendor signup */}
        <Route path="/signup/student" element={<StudentSignup />} />
        <Route path="/signup/staff" element={<StaffSignup />} />
        <Route path="/signup/vendor" element={<VendorSignup />} />

        {/* 🧑‍💼 Admin page */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
