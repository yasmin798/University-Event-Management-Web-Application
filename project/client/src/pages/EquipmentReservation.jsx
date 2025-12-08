import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";

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

export default function EquipmentReservation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { courtId, date, time } = location.state || {};

  const [sport, setSport] = useState(courtId || "football");
  const [items, setItems] = useState(
    (SPORT_ITEMS[courtId] || SPORT_ITEMS["football"]).map((i) => ({
      name: i.name,
      quantity: i.defaultQty,
      selected: true,
    }))
  );
  const [studentId, setStudentId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  const handleQtyChange = (index, quantity) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        quantity: Math.max(1, Number(quantity) || 1),
      };
      return next;
    });
  };

  const handleToggleItem = (index) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], selected: !next[index].selected };
      return next;
    });
  };

  // Keep items in sync with selected sport
  useEffect(() => {
    const base = SPORT_ITEMS[sport] || [];
    setItems(
      base.map((i) => ({
        name: i.name,
        quantity: i.defaultQty,
        selected: true,
      }))
    );
  }, [sport]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedItems = items
      .filter((i) => i.selected)
      .map(({ name, quantity }) => ({ name, quantity }));
    if (!studentId || !studentEmail || selectedItems.length === 0) {
      alert("Please enter student info and select at least one item.");
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:3000/api/equipment-reservations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courtName: sport,
            date,
            time,
            studentId,
            studentEmail,
            items: selectedItems,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to reserve equipment");
      alert(
        "Equipment reserved! You will receive an email 5 minutes before your booking time."
      );
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F3F4F6" }}>
      <StudentSidebar />
      <div style={{ flex: 1, marginLeft: 250 }}>
        <div
          style={{
            maxWidth: 900,
            margin: "40px auto",
            background: "white",
            borderRadius: 12,
            boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
            padding: 24,
          }}
        >
          <h2 style={{ color: "#1D4ED8", marginBottom: 16 }}>
            Reserve Equipment
          </h2>
          <p style={{ marginBottom: 16 }}>
            {date && time ? (
              <span>
                For booking on{" "}
                <strong>{new Date(date).toLocaleDateString()}</strong> at{" "}
                <strong>{time}</strong>
              </span>
            ) : (
              <span>Select your sport and items below.</span>
            )}
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{ display: "block", fontWeight: 600, marginBottom: 8 }}
              >
                Sport
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                style={{
                  padding: 10,
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                }}
              >
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="tennis">Tennis</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{ display: "block", fontWeight: 600, marginBottom: 8 }}
              >
                Items
              </label>
              <div>
                {items.map((item, idx) => (
                  <div
                    key={item.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleToggleItem(idx)}
                    />
                    <span style={{ width: 180 }}>{item.name}</span>
                    {item.name === "Manual Scoreboard" ||
                    item.name === "Ball Pump" ? null : (
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        style={{
                          width: 80,
                          padding: 6,
                          border: "1px solid #D1D5DB",
                          borderRadius: 6,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <div>
                <label
                  style={{ display: "block", fontWeight: 600, marginBottom: 8 }}
                >
                  Student ID
                </label>
                <input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g., 25-12345"
                  style={{
                    padding: 10,
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    width: 240,
                  }}
                />
              </div>
              <div>
                <label
                  style={{ display: "block", fontWeight: 600, marginBottom: 8 }}
                >
                  Student Email
                </label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="name@guc.edu.eg"
                  style={{
                    padding: 10,
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    width: 280,
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                type="submit"
                style={{
                  background: "#2563EB",
                  color: "white",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 600,
                }}
              >
                Confirm Equipment Reservation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
