import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import footballImg from "../images/football.webp";
import basketballImg from "../images/basketball.webp";
import tennisImg from "../images/tennis.webp";

const courtsData = [
  {
    id: "football",
    name: "Football Court",
    availability: [
      { date: "2025-10-20", times: ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"] },
      { date: "2025-10-21", times: ["9:00 AM - 11:00 AM", "1:00 PM - 3:00 PM"] },
    ],
  },
  {
    id: "basketball",
    name: "Basketball Court",
    availability: [
      { date: "2025-10-20", times: ["8:00 AM - 10:00 AM", "3:00 PM - 5:00 PM"] },
      { date: "2025-10-22", times: ["10:00 AM - 12:00 PM"] },
    ],
  },
  {
    id: "tennis",
    name: "Tennis Court",
    availability: [
      { date: "2025-10-21", times: ["7:00 AM - 9:00 AM", "4:00 PM - 6:00 PM"] },
      { date: "2025-10-23", times: ["12:00 PM - 2:00 PM", "5:00 PM - 7:00 PM"] },
    ],
  },
];

const courtImages = { football: footballImg, basketball: basketballImg, tennis: tennisImg };

export default function CourtsAvailabilityWrapper() {
  const navigate = useNavigate();
  const [bookedSlots, setBookedSlots] = useState({});

  // Fetch booked reservations from backend
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/reservations");
        if (!res.ok) throw new Error("Server responded with " + res.status);
        const data = await res.json();

        const slots = {};
        data.forEach(({ courtName, date, time }) => {
          if (!slots[courtName]) slots[courtName] = {};
          if (!slots[courtName][date]) slots[courtName][date] = [];
          slots[courtName][date].push(time);
        });

        setBookedSlots(slots);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        alert("Error connecting to server. Make sure backend is running on port 3000.");
      }
    };
    fetchReservations();
  }, []);

  const handleReserve = (courtId, date, time) => {
    navigate(`/reserve/${courtId}`, { state: { date, time } });
  };

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto", fontFamily: "Poppins, Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px", fontWeight: 700 }}>Campus Courts Availability</h1>

      {courtsData.map(court => (
        <div
          key={court.id}
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <img
              src={courtImages[court.id]}
              alt={court.name}
              style={{ width: "300px", height: "200px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: "250px" }}>
              <h2 style={{ color: "#2563EB", marginBottom: "15px", fontWeight: 600 }}>{court.name}</h2>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#3B82F6", color: "white" }}>
                  <tr>
                    <th style={{ padding: "12px", border: "1px solid #DBEAFE" }}>Date</th>
                    <th style={{ padding: "12px", border: "1px solid #DBEAFE" }}>Available Times</th>
                  </tr>
                </thead>
                <tbody>
                  {court.availability.map(({ date, times }) => (
                    <tr key={date} style={{ backgroundColor: "#EFF6FF" }}>
                      <td style={{ padding: "12px", border: "1px solid #DBEAFE", textAlign: "center" }}>
                        {new Date(date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #DBEAFE", textAlign: "center" }}>
                        {times.map(time => {
                          const isBooked = bookedSlots[court.id]?.[date]?.includes(time);
                          return (
                            <button
                              key={time}
                              disabled={isBooked}
                              onClick={() => handleReserve(court.id, date, time)}
                              style={{
                                margin: "3px",
                                padding: "6px 10px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                backgroundColor: isBooked ? "#ccc" : "#2563EB",
                                color: isBooked ? "#666" : "white",
                                cursor: isBooked ? "not-allowed" : "pointer",
                              }}
                            >
                              {time} {isBooked ? "(Booked)" : ""}
                            </button>
                          );
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
