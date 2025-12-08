import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Bell, User, ArrowLeft } from "lucide-react";
import StudentSidebar from "../components/StudentSidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";
import TaSidebar from "../components/TaSidebar";
import StaffSidebar from "../components/StaffSidebar";

export default function ReserveCourt() {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { date, time } = location.state || {};

  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userRole, setUserRole] = useState("");

  const SPORT_ITEMS = {
    football: [
      { name: "Ball Pump", defaultQty: 1 },
      { name: "Training Cones", defaultQty: 6 },
      { name: "Jerseys", defaultQty: 10 },
      { name: "Manual Scoreboard", defaultQty: 1 },
    ],
    basketball: [
      { name: "Ball Pump", defaultQty: 1 },
      { name: "Jerseys", defaultQty: 10 },
      { name: "Manual Scoreboard", defaultQty: 1 },
    ],
    tennis: [
      { name: "Tennis Racket", defaultQty: 2 },
      { name: "Tennis Balls (can)", defaultQty: 1 },
      { name: "Manual Scoreboard", defaultQty: 1 },
    ],
  };
  const [equipmentItems, setEquipmentItems] = useState(
    (SPORT_ITEMS[courtId] || SPORT_ITEMS["football"]).map((i) => ({
      name: i.name,
      quantity: i.defaultQty,
      selected: false,
    }))
  );
  const toggleItem = (idx) => {
    setEquipmentItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], selected: !next[idx].selected };
      return next;
    });
  };
  const changeQty = (idx, qty) => {
    setEquipmentItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: Math.max(1, Number(qty) || 1) };
      return next;
    });
  };

  React.useEffect(() => {
    const getUserRole = () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return (payload.role || "student").toLowerCase();
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
      return "student";
    };
    setUserRole(getUserRole());

    // Prefill student info from stored user profile
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
        if (name) setStudentName(name);
        if (u.email) setStudentEmail(u.email);
        if (u.roleSpecificId) setStudentId(u.roleSpecificId);
      }
    } catch (e) {
      console.warn("Failed to parse stored user", e);
    }

    // Fallback: decode token payload for fields if not set
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const name = [payload.firstName, payload.lastName]
          .filter(Boolean)
          .join(" ");
        if (!studentName && name) setStudentName(name);
        if (!studentEmail && payload.email) setStudentEmail(payload.email);
        if (!studentId && payload.roleSpecificId)
          setStudentId(payload.roleSpecificId);
      }
    } catch (e) {
      // ignore
    }

    // Final fallback: derive ID from email prefix if matches pattern like 22-1234@guc.edu.eg
    setStudentId((prev) => {
      if (prev && prev.trim().length > 0) return prev;
      const email =
        studentEmail ||
        JSON.parse(localStorage.getItem("user") || "{}").email ||
        "";
      const match = email.match(/^(\d{2}-\d{4})/);
      return match ? match[1] : prev;
    });

    // Definitive source: fetch from server profile
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/api/users/me", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (res.ok) {
          const me = await res.json();
          const name = [me.firstName, me.lastName].filter(Boolean).join(" ");
          if (name) setStudentName(name);
          if (me.email) setStudentEmail(me.email);
          if (me.roleSpecificId) setStudentId(me.roleSpecificId);
        }
      } catch (err) {
        // ignore network errors
      }
    })();
  }, []);

  if (!date || !time) {
    return (
      <div className="flex h-screen bg-[#f5efeb]">
        {!userRole ? null : userRole === "professor" ? (
          <ProfessorSidebar />
        ) : userRole === "staff" ? (
          <StaffSidebar />
        ) : userRole === "ta" ? (
          <TaSidebar />
        ) : (
          <StudentSidebar />
        )}

        <div className="flex-1 overflow-auto ml-[260px] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#2f4156] mb-4">
              Invalid Reservation Data
            </h2>
            <p className="text-[#567c8d] mb-6">
              Please go back and select a valid date and time.
            </p>
            <button
              onClick={() => navigate("/courts-availability")}
              className="bg-[#2f4156] text-white px-6 py-3 rounded-lg hover:bg-[#3a5169] transition-colors"
            >
              Back to Courts
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!studentName || !studentId || !studentEmail) {
      setError("Please enter your name, GUC ID, and email.");
      setIsLoading(false);
      return;
    }

    const gucIdPattern = /^\d{2}-\d{4}$/;
    if (!gucIdPattern.test(studentId)) {
      setError("GUC ID must be in the format XX-XXXX.");
      setIsLoading(false);
      return;
    }

    const reservation = {
      courtName: courtId,
      date,
      time,
      studentName,
      studentId,
    };

    try {
      // 1) Create court reservation
      const res = await fetch("http://localhost:3000/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservation),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Reservation failed.");
        return;
      }

      // 2) If equipment chosen, create equipment reservation (triggers 5-min email reminder)
      const selectedItems = equipmentItems
        .filter((i) => i.selected)
        .map(({ name, quantity }) => ({ name, quantity }));
      if (selectedItems.length > 0) {
        const eqRes = await fetch(
          "http://localhost:3000/api/equipment-reservations",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courtName: courtId,
              date,
              time,
              studentId,
              studentEmail,
              items: selectedItems,
            }),
          }
        );
        const eqData = await eqRes.json();
        if (!eqRes.ok) {
          setError(eqData.message || "Equipment reservation failed.");
          return;
        }
      }

      setSuccess("Reservation confirmed! Redirecting...");
      setTimeout(() => {
        navigate("/student/dashboard");
      }, 2000);
    } catch (error) {
      console.error(error);
      setError("Error connecting to server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Fixed Sidebar based on role */}
      {!userRole ? null : userRole === "professor" ? (
        <ProfessorSidebar />
      ) : userRole === "staff" ? (
        <StaffSidebar />
      ) : userRole === "ta" ? (
        <TaSidebar />
      ) : (
        <StudentSidebar />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto ml-[260px]">
        {/* Header */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-end">
          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
              <Bell size={20} className="text-[#567c8d]" />
            </button>
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        {/* Reservation Form Content */}
        <div className="p-6 max-w-2xl mx-auto">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#2f4156] to-[#3a5169] text-white p-8">
              <h1 className="text-2xl font-bold mb-2">Court Reservation</h1>
              <p className="text-[#c8d9e6]">
                Confirm your court booking details
              </p>
            </div>

            {/* Content Section */}
            <div className="p-8">
              {/* Booking Summary */}
              <div className="bg-[#f8f9fa] rounded-xl p-6 mb-8 border border-[#e8e8e8]">
                <h3 className="text-lg font-semibold text-[#2f4156] mb-4">
                  Booking Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#567c8d] font-medium">Court:</span>
                    <span className="text-[#2f4156] font-semibold">
                      {courtId.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#567c8d] font-medium">Date:</span>
                    <span className="text-[#2f4156] font-semibold">{date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#567c8d] font-medium">Time:</span>
                    <span className="bg-[#2f4156] text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#2f4156] mb-2">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e8e8e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f4156] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2f4156] mb-2">
                      GUC ID *
                    </label>
                    <input
                      type="text"
                      placeholder="XX-XXXX"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e8e8e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f4156] focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-[#567c8d] mt-2">
                      Format: XX-XXXX (e.g., 22-1234)
                    </p>
                  </div>
                </div>

                {/* Equipment Reservation Inline */}
                <div className="bg-[#f8f9fa] rounded-xl p-6 border border-[#e8e8e8]">
                  <h3 className="text-lg font-semibold text-[#2f4156] mb-4">
                    Reserve Equipment (optional)
                  </h3>
                  <p className="text-sm text-[#567c8d] mb-4">
                    Select items you need for your session. We'll email you a
                    pickup reminder 5 minutes before.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {equipmentItems.map((item, idx) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-3 bg-white border border-[#e8e8e8] rounded-lg px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleItem(idx)}
                        />
                        <span className="flex-1 text-[#2f4156]">
                          {item.name}
                        </span>
                        {item.name === "Manual Scoreboard" ||
                        item.name === "Ball Pump" ? null : (
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => changeQty(idx, e.target.value)}
                            className="w-20 px-2 py-1 border border-[#e8e8e8] rounded-lg"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-[#2f4156] mb-2">
                      Student Email (for reminder)
                    </label>
                    <input
                      type="email"
                      placeholder="name@guc.edu.eg"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e8e8e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f4156] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 bg-white text-[#2f4156] border border-[#e8e8e8] py-3 px-6 rounded-lg hover:bg-[#f5efeb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="flex-1 bg-[#2f4156] text-white py-3 px-6 rounded-lg hover:bg-[#3a5169] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      "Confirm Reservation"
                    )}
                  </button>
                </div>
              </form>

              {/* Success Message */}
              {success && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">{success}</p>
                    <p className="text-sm text-green-600">
                      You will be redirected shortly...
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    !
                  </div>
                  <p className="font-semibold text-red-800">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
