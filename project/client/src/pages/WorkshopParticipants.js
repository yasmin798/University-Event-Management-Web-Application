// src/pages/professor/WorkshopParticipants.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function WorkshopParticipants() {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [participants, setParticipants] = useState([]); // Populated registeredUsers
  const [loading, setLoading] = useState(true);

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
        console.log('Fetched workshop data:', data); // NEW: Debug log to check populated fields
        console.log('Registered users:', data.registeredUsers); // NEW: Log the users array
        setWorkshop(data);
        setParticipants(data.registeredUsers || []); // Retrieved & populated from model
      } catch (err) {
        console.error('Fetch error:', err);
        alert(`Could not load participants: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshopDetails();
  }, [workshopId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-[#567c8d]">Loading participants...</p>
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

  const registeredCount = participants.length;
  const totalCapacity = workshop.capacity || 0;
  const remainingSpots = totalCapacity - registeredCount;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-[#f5efeb] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#567c8d] hover:text-[#2f4156] mb-6 transition-colors"
        >
          ←
          <span>Back to Workshops</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#c8d9e6]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-[#567c8d] rounded-xl text-white text-3xl">
              👥
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2f4156]">
                {workshop.workshopName}
              </h1>
              <p className="text-[#567c8d] mt-1">Participants List</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-[#f0f8ff] rounded-xl p-6 text-center border border-[#c8d9e6]">
              <p className="text-sm text-[#567c8d]">Total Capacity</p>
              <p className="text-3xl font-bold text-[#2f4156] mt-2">{totalCapacity}</p>
            </div>
            <div className="bg-[#e6f7ff] rounded-xl p-6 text-center border border-[#c8d9e6]">
              <p className="text-sm text-[#567c8d]">Registered</p>
              <p className="text-3xl font-bold text-[#2f4156] mt-2">{registeredCount}</p>
            </div>
            <div className={`rounded-xl p-6 text-center border ${remainingSpots <= 5 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className="text-sm text-[#567c8d]">Remaining Spots</p>
              <p className={`text-3xl font-bold mt-2 ${remainingSpots <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                {remainingSpots}
              </p>
            </div>
          </div>

          {/* Participants Table */}
          <h2 className="text-xl font-bold text-[#2f4156] mb-4 flex items-center gap-2">
            ✓
            <span>Registered Students ({registeredCount})</span>
          </h2>

          {participants.length === 0 ? (
            <div className="text-center py-12 text-[#567c8d]">
              <div className="mx-auto mb-4 text-[#c8d9e6] text-5xl">👥</div>
              <p>No one has registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-[#c8d9e6] rounded-xl">
                <thead className="bg-[#f5efeb]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#2f4156] uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#2f4156] uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#2f4156] uppercase tracking-wider">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c8d9e6]">
                  {participants.map((student, index) => {
                    console.log('Student data:', student); // NEW: Log each student to check fields
                    return (
                      <tr key={student._id || index} className="hover:bg-[#f5efeb]">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2f4156]">
                          {student.fullName || student.name || "Unknown Student"} {/* UPDATED: Fallback to name if fullName missing */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#567c8d]">
                          {student.email || "No email"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#567c8d]">
                          {formatDate(student.createdAt || new Date())} {/* Fallback if no reg date */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}