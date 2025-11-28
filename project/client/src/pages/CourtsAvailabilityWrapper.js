import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import footballImg from "../images/football.webp";
import basketballImg from "../images/basketball.webp";
import tennisImg from "../images/tennis.webp";
import StudentSidebar from "../components/StudentSidebar";

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
    <div style={{ display: "flex", minHeight: "100vh" }}>
          <StudentSidebar />
    <div
  style={{
    padding: "40px",
    maxWidth: "1100px",
    margin: "0 auto",
    fontFamily: "Poppins, Arial, sans-serif",
    backgroundColor: "#F3F4F6",     // ✅ MATCHES STUDENT DASHBOARD
    minHeight: "100vh",
    borderRadius: "12px"
  }}
>

      <h1
        style={{
          textAlign: "center",
          marginBottom: "50px",
          fontWeight: 700,
          fontSize: "34px",
          color: "#1E3A8A",
        }}
      >
        Campus Courts Availability
      </h1>

      {courtsData.map((court) => (
        <div
          key={court.id}
          style={{
            borderRadius: "16px",
            padding: "25px",
            marginBottom: "35px",
            backgroundColor: "white",
            boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
            border: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "25px",
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <img
              src={courtImages[court.id]}
              alt={court.name}
              style={{
                width: "340px",
                height: "230px",
                borderRadius: "12px",
                objectFit: "cover",
                flexShrink: 0,
                boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
              }}
            />

            <div style={{ flex: 1, minWidth: "280px" }}>
              <h2
                style={{
                  color: "#1D4ED8",
                  marginBottom: "18px",
                  fontWeight: 700,
                  fontSize: "22px",
                  borderBottom: "2px solid #93C5FD",
                  paddingBottom: "5px",
                  width: "fit-content",
                }}
              >
                {court.name}
              </h2>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "0 8px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "14px",
                        backgroundColor: "#1E40AF",
                        color: "white",
                        fontWeight: 600,
                        borderTopLeftRadius: "8px",
                        borderBottomLeftRadius: "8px",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        padding: "14px",
                        backgroundColor: "#1E40AF",
                        color: "white",
                        fontWeight: 600,
                        borderTopRightRadius: "8px",
                        borderBottomRightRadius: "8px",
                      }}
                    >
                      Available Times
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {court.availability.map(({ date, times }) => (
                    <tr key={date} style={{}}>
                      <td
                        style={{
                          padding: "14px",
                          backgroundColor: "white",
                          border: "1px solid #D1D5DB",
                          borderRight: "none",
                          textAlign: "center",
                          fontWeight: 500,
                          borderRadius: "8px 0 0 8px",
                        }}
                      >
                        {new Date(date).toLocaleDateString()}
                      </td>

                      <td
                        style={{
                          padding: "14px",
                          backgroundColor: "white",
                          border: "1px solid #D1D5DB",
                          borderLeft: "none",
                          borderRadius: "0 8px 8px 0",
                          textAlign: "center",
                        }}
                      >
                        {times.map((time) => {
                          const isBooked = bookedSlots[court.id]?.[date]?.includes(time);

                          return (
                            <button
                              key={time}
                              disabled={isBooked}
                              onClick={() => handleReserve(court.id, date, time)}
                              style={{
                                margin: "5px",
                                padding: "8px 14px",
                                borderRadius: "6px",
                                border: "none",
                                fontWeight: 600,
                                backgroundColor: isBooked ? "#9CA3AF" : "#2563EB",
                                color: "white",
                                cursor: isBooked ? "not-allowed" : "pointer",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                transition: "0.2s",
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
     </div>
  );
}
