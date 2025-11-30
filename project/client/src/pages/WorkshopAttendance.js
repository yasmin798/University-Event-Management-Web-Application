// src/pages/professor/WorkshopAttendance.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Mail, UserCheck } from "lucide-react";

export default function WorkshopAttendance() {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [participants, setParticipants] = useState([]); // All registered users
  const [attendedParticipants, setAttendedParticipants] = useState(new Set()); // Checked IDs
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    const fetchWorkshopDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/workshops/${workshopId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Failed to fetch: ${res.status} - ${errText}`);
        }

        const data = await res.json();
        setWorkshop(data);
        setParticipants(data.registeredUsers || []); // Assume populated with name, email, _id

        // 🔥 NEW: Pre-load attended from backend if tracked (e.g., if certificateSent exists)
        // For now, assume fresh list; extend if needed
      } catch (err) {
        console.error('Fetch error:', err);
        alert(`Could not load attendance: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshopDetails();
  }, [workshopId]);

  // 🔥 NEW: Toggle attended checkbox
  const toggleAttended = (participantId) => {
    setAttendedParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  // 🔥 NEW: Batch send certificates for checked participants
  const submitAttendance = async () => {
    if (attendedParticipants.size === 0) {
      alert("Please select at least one attendee.");
      return;
    }

    if (!window.confirm(`Send certificates to ${attendedParticipants.size} selected attendee(s)?`)) {
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      // 🔥 BATCH POST: Send array of participantIds
      const res = await fetch(`/api/workshops/${workshopId}/certificates/batch`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          participantIds: Array.from(attendedParticipants),
          note: "" // Optional; add input if needed
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to send certificates: ${res.status} - ${errText}`);
      }

      const result = await res.json();
      setSentCount(result.sentCount || attendedParticipants.size);
      alert(`${result.sentCount || attendedParticipants.size} certificates sent successfully!`);

      // 🔥 NEW: Remove sent from list (filter out attended)
      setParticipants(prev => prev.filter(p => !attendedParticipants.has(p._id)));
      setAttendedParticipants(new Set()); // Clear checks

      // Optional: Refetch full list if backend updates workshop
      // setTimeout(() => fetchWorkshopDetails(), 1000);
    } catch (err) {
      console.error('Batch send error:', err);
      alert(`Error sending certificates: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-[#567c8d]">Loading attendance...</p>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-red-600">Workshop not found</p>
      </div>
    );
  }

  const totalParticipants = participants.length;
  const checkedCount = attendedParticipants.size;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-[#f5efeb] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#567c8d] hover:text-[#2f4156] mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Workshops</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#c8d9e6]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-500 rounded-xl text-white text-3xl">
              📝
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2f4156]">
                Attendance for {workshop.workshopName}
              </h1>
              <p className="text-[#567c8d] mt-1">Mark attendees and send certificates</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#f0f8ff] rounded-xl p-6 text-center border border-[#c8d9e6]">
              <p className="text-sm text-[#567c8d]">Total Registered</p>
              <p className="text-2xl font-bold text-[#2f4156] mt-2">{totalParticipants}</p>
            </div>
            <div className="bg-[#e6f7ff] rounded-xl p-6 text-center border border-[#c8d9e6]">
              <p className="text-sm text-[#567c8d]">Marked Attended</p>
              <p className="text-2xl font-bold text-[#2f4156] mt-2">{checkedCount}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-6 text-center border border-yellow-200">
              <p className="text-sm text-[#567c8d]">Pending Attendance</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{totalParticipants - checkedCount}</p>
            </div>
            {sentCount > 0 && (
              <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
                <p className="text-sm text-[#567c8d]">Certificates Sent</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{sentCount}</p>
              </div>
            )}
          </div>

          {/* Attendance List */}
          <h2 className="text-xl font-bold text-[#2f4156] mb-4 flex items-center gap-2">
            <UserCheck size={20} />
            <span>Participants ({totalParticipants})</span>
          </h2>

          {participants.length === 0 ? (
            <div className="text-center py-12 text-[#567c8d]">
              <div className="mx-auto mb-4 text-[#c8d9e6] text-5xl">👥</div>
              <p>No participants registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full bg-white border border-[#c8d9e6] rounded-xl">
                <thead className="bg-[#f5efeb]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#2f4156] uppercase tracking-wider">
                      <input type="checkbox" className="rounded" onChange={() => {}} /> {/* Header select all - implement if needed */}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#2f4156] uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#2f4156] uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#2f4156] uppercase tracking-wider">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c8d9e6]">
                  {participants.map((student) => {
                    const participantId = student._id; // Assume _id on subdoc
                    const isChecked = attendedParticipants.has(participantId);
                    return (
                      <tr key={participantId} className="hover:bg-[#f5efeb]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAttended(participantId)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2f4156]">
                          {(student.firstName + " " + student.lastName) || "Unkown Student"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#567c8d]">
                          {student.email || "No email"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#567c8d]">
                          {formatDate(student.createdAt || new Date())}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={submitAttendance}
              disabled={attendedParticipants.size === 0 || sending}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail size={18} />
              <span>{sending ? "Sending..." : `Send Certificates (${checkedCount})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}