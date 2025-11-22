// client/src/pages/polls/CreatePollFromBooths.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function CreatePollFromBooths() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]); // grouped by slot + duration
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [pollTitle, setPollTitle] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConflictingApplications();
  }, []);

  const fetchConflictingApplications = async () => {
    try {
      const res = await fetch("/api/booth-applications");
      const apps = await res.json();

      const pending = apps.filter(a => a.status === "pending");

      // Group by platformSlot + durationWeeks
      const map = {};
      pending.forEach(app => {
        const key = `${app.platformSlot}-${app.durationWeeks}`;
        if (!map[key]) map[key] = [];
        map[key].push({
          id: app._id,
          vendorName: app.attendees[0]?.name || "Unknown Vendor",
          attendees: app.attendees,
          boothSize: app.boothSize,
          durationWeeks: app.durationWeeks,
          platformSlot: app.platformSlot,
        });
      });

      const conflicts = Object.values(map).filter(group => group.length > 1);
      setGroups(conflicts);
      setLoading(false);
    } catch (err) {
      alert("Failed to load booth applications");
      setLoading(false);
    }
  };

  const handleCreatePoll = async () => {
    if (!selectedGroup || !pollTitle || !endDate) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("/api/polls/from-booths", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify({
          title: pollTitle,
          endDate,
          vendorApplications: selectedGroup.map(v => ({
            applicationId: v.id,
            vendorName: v.vendorName,
            boothSize: v.boothSize,
            durationWeeks: v.durationWeeks,
            platformSlot: v.platformSlot,
          })),
        }),
      });

      if (res.ok) {
        alert("Poll created successfully! Students can now vote.");
        navigate("/events");
      } else {
        alert("Failed to create poll");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  if (loading) return <div>Loading booth applications...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "40px", background: "#f9fafb" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
            Create Vendor Voting Poll
          </h1>
          <p style={{ color: "#666", marginBottom: "32px" }}>
            Automatically detect booths with conflicting requests and let students vote.
          </p>

          {groups.length === 0 ? (
            <p>No conflicting booth applications found. All slots are unique!</p>
          ) : (
            <>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ fontWeight: 600 }}>Select Conflict Group to Poll</label>
                <select
                  style={{ width: "100%", padding: "12px", marginTop: "8px", borderRadius: "8px" }}
                  onChange={(e) => setSelectedGroup(groups[e.target.value])}
                >
                  <option value="">-- Choose a conflict --</option>
                  {groups.map((g, i) => (
                    <option key={i} value={i}>
                      Slot {g[0].platformSlot} • {g[0].durationWeeks} weeks • {g.length} vendors
                    </option>
                  ))}
                </select>
              </div>

              {selectedGroup && (
                <div style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                  <h3>Vendors in this poll ({selectedGroup.length})</h3>
                  {selectedGroup.map(v => (
                    <div key={v.id} style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                      <strong>{v.vendorName}</strong> • {v.attendees.map(a => a.name).join(", ")} • {v.boothSize}
                    </div>
                  ))}
                </div>
              )}

              <input
                type="text"
                placeholder="Poll Title (e.g. Vote for B2 Booth - 3 Weeks)"
                value={pollTitle}
                onChange={e => setPollTitle(e.target.value)}
                style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #ccc" }}
              />

              <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ width: "100%", padding: "12px", marginBottom: "24px", borderRadius: "8px", border: "1px solid #ccc" }}
              />

              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => navigate(-1)} style={{ padding: "12px 24px", background: "#e5e7eb" }}>
                  Cancel
                </button>
                <button
                  onClick={handleCreatePoll}
                  style={{ padding: "12px 24px", background: "#8b5cf6", color: "white", borderRadius: "8px" }}
                  disabled={!selectedGroup || !pollTitle || !endDate}
                >
                  Create Poll
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}