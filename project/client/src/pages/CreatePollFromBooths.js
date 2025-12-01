// client/src/pages/polls/CreatePollFromBooths.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  Calendar,
  Users,
  AlertCircle,
  ArrowLeft,
  PlusCircle,
} from "lucide-react";

export default function CreatePollFromBooths() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
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

    const pending = apps.filter((a) => a.status === "pending");

    // Group by slot only
    const slotGroups = {};
    pending.forEach((app) => {
      const slot = app.platformSlot;
      if (!slotGroups[slot]) slotGroups[slot] = [];
      slotGroups[slot].push(app);
    });

    const conflicts = [];

    // Check conflicts inside each slot
    Object.values(slotGroups).forEach((appsInSlot) => {
      // If only 1 app in slot → no conflict possible
      if (appsInSlot.length < 2) return;

      const conflictGroup = [];

      for (let i = 0; i < appsInSlot.length; i++) {
        const a = appsInSlot[i];
        const aStart = new Date(a.startDateTime);
        const aEnd = new Date(a.endDateTime);

        for (let j = i + 1; j < appsInSlot.length; j++) {
          const b = appsInSlot[j];
          const bStart = new Date(b.startDateTime);
          const bEnd = new Date(b.endDateTime);

          // ✔ DATE RANGE OVERLAP CHECK
          const datesOverlap =
            aStart < bEnd && aEnd > bStart;

          if (datesOverlap) {
            if (!conflictGroup.includes(a)) conflictGroup.push(a);
            if (!conflictGroup.includes(b)) conflictGroup.push(b);
          }
        }
      }

      if (conflictGroup.length > 1) {
        // Convert to your frontend format
        conflicts.push(
          conflictGroup.map((app) => ({
            id: app._id,
            vendorName: app.attendees[0]?.name || "Unknown Vendor",
            attendees: app.attendees,
            boothSize: app.boothSize,
            durationWeeks: app.durationWeeks,
            platformSlot: app.platformSlot,
            startDateTime: app.startDateTime,
            endDateTime: app.endDateTime,
          }))
        );
      }
    });

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pollTitle,
          endDate,
          vendorApplications: selectedGroup.map((v) => ({
            applicationId: v.id,
            vendorName: v.vendorName,
            boothSize: v.boothSize,
            durationWeeks: v.durationWeeks,
            platformSlot: v.platformSlot,
          })),
        }),
      });

      if (res.ok) {
        alert("Poll created successfully!");
        navigate("/events");
      } else {
        alert("Failed to create poll");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <main className="flex-1 ml-[260px] h-screen overflow-y-auto flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2f4156]"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[260px] h-screen overflow-y-auto">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2f4156]">
                Create Vendor Voting Poll
              </h1>
              <p className="text-gray-600 mt-1">
                Resolve conflicting booth requests through student voting
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 max-w-4xl mx-auto">
          {/* INTRODUCTION CARD */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle
                size={24}
                className="text-blue-600 mt-1 flex-shrink-0"
              />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  How it works
                </h3>
                <p className="text-blue-800">
                  Automatically detect booth applications requesting the same platform slot during overlapping date ranges. Create a poll to let students vote on which vendor should receive the booth space.
                </p>
              </div>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Conflicts Found
              </h3>
              <p className="text-gray-600 mb-4">
                All booth slots currently have unique requests. No voting polls
                are needed.
              </p>
              <button
                onClick={() => navigate("/events")}
                className="bg-[#2f4156] text-white px-6 py-2 rounded-lg hover:bg-[#1f2d3d] transition-colors"
              >
                Return to Events
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CONFLICT SELECTION CARD */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Conflict Group
                </h2>
                <div className="space-y-4">
                  <select
                    onChange={(e) => setSelectedGroup(groups[e.target.value])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f4156] focus:border-transparent"
                  >
                    <option value="">Choose a conflict group...</option>
                    {groups.map((g, i) => (
                      <option key={i} value={i}>
                        Slot {g[0].platformSlot} •{" "}
                        {g.length} vendors competing
                      </option>
                    ))}
                  </select>

                  {selectedGroup && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-3">
                        <strong>{selectedGroup.length}</strong> vendors
                        competing for this slot
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* VENDORS LIST */}
              {selectedGroup && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Vendors in This Poll
                  </h2>
                  <div className="space-y-3">
                    {selectedGroup.map((v, index) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {v.vendorName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {v.attendees.map((a) => a.name).join(", ")}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>Booth: {v.boothSize}</span>
                            <span>Duration: {v.durationWeeks} weeks</span>
                            <span>Slot: {v.platformSlot}</span>
                            <span>Start Date: {v.startDateTime ? new Date(v.startDateTime).toLocaleDateString() : "N/A"}</span>

                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* POLL SETTINGS */}
              {selectedGroup && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Poll Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Poll Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Vote for Slot B2 — 3 Weeks"
                        value={pollTitle}
                        onChange={(e) => setPollTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f4156] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voting End Date & Time
                      </label>
                      <div className="relative">
                        <Calendar
                          size={20}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="datetime-local"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f4156] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              {selectedGroup && (
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <ArrowLeft size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePoll}
                    disabled={!selectedGroup || !pollTitle || !endDate}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#2f4156] text-white rounded-lg hover:bg-[#1f2d3d] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusCircle size={16} />
                    Create Voting Poll
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
