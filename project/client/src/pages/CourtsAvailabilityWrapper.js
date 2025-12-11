import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import footballImg from "../images/football.webp";
import basketballImg from "../images/basketball.webp";
import tennisImg from "../images/tennis.webp";

const courtsData = [
  {
    id: "football",
    name: "Football Court",
    availability: [
      {
        date: "2025-12-12",
        times: [
          "3:00 PM - 5:00 PM",
          "3:05 PM - 5:05 PM",
          "3:10 PM - 5:10 PM",
          "3:15 PM - 5:15 PM",
          "3:22 PM - 5:22 PM",
        ],
      },
      {
        date: "2025-12-13",
        times: ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"],
      },
      {
        date: "2025-12-14",
        times: ["9:00 AM - 11:00 AM", "1:00 PM - 3:00 PM"],
      },
    ],
  },
  {
    id: "basketball",
    name: "Basketball Court",
    availability: [
      {
        date: "2025-12-08",
        times: [
          "3:00 PM - 5:00 PM",
          "3:05 PM - 5:05 PM",
          "3:10 PM - 5:10 PM",
          "3:15 PM - 5:15 PM",
          "3:22 PM - 5:22 PM",
        ],
      },
      {
        date: "2025-12-09",
        times: ["8:00 AM - 10:00 AM", "3:00 PM - 5:00 PM"],
      },
      {
        date: "2025-12-11",
        times: ["10:00 AM - 12:00 PM", "11:15 PM - 12:14 AM"],
      },
    ],
  },
  {
    id: "tennis",
    name: "Tennis Court",
    availability: [
      {
        date: "2025-12-08",
        times: [
          "3:00 PM - 5:00 PM",
          "3:05 PM - 5:05 PM",
          "3:10 PM - 5:10 PM",
          "3:15 PM - 5:15 PM",
          "3:22 PM - 5:22 PM",
        ],
      },
      { date: "2025-12-11", times: ["11:25 PM - 12:25 AM"] },
      { date: "2025-12-10", times: ["7:00 AM - 9:00 AM", "4:00 PM - 6:00 PM"] },
      {
        date: "2025-12-12",
        times: ["12:00 PM - 2:00 PM", "5:00 PM - 7:00 PM"],
      },
    ],
  },
];

const courtImages = {
  football: footballImg,
  basketball: basketballImg,
  tennis: tennisImg,
};

export default function CourtsAvailabilityWrapper() {
  const navigate = useNavigate();
  const [bookedSlots, setBookedSlots] = useState({});
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Do not hide courts when they have no future slots.
  // Instead, show the court card with a friendly message.
  // Helper to format time range strings like "HH:MM AM - HH:MM AM"
  const formatTimeRange = (startDate, endDate) => {
    const fmt = (d) =>
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${fmt(startDate)} - ${fmt(endDate)}`;
  };

  // Remove past times for today; keep future dates intact.
  // Also, add two dynamic slots near the present for each court.
  const now = new Date();
  const addDynamicSlots = (dateStr, times) => {
    if (dateStr !== todayStr) return times;
    const slot1Start = new Date(now.getTime() + 10 * 60 * 1000);
    const slot1End = new Date(slot1Start.getTime() + 60 * 60 * 1000);
    const slot2Start = new Date(now.getTime() + 30 * 60 * 1000);
    const slot2End = new Date(slot2Start.getTime() + 60 * 60 * 1000);
    const dynamic = [
      formatTimeRange(slot1Start, slot1End),
      formatTimeRange(slot2Start, slot2End),
    ];
    return [...times, ...dynamic];
  };

  const isTimeInPast = (dateStr, timeRange) => {
    try {
      const [startStr] = timeRange.split(" - ");
      const start = new Date(`${dateStr} ${startStr}`);
      return start < now;
    } catch (e) {
      return false;
    }
  };

  const courtsWithUpcoming = courtsData.map((court) => {
    let upcomingByDate = court.availability
      .filter((slot) => slot.date >= todayStr)
      .map(({ date, times }) => {
        const filtered =
          date === todayStr
            ? times.filter((t) => {
                const isBooked = bookedSlots[court.id]?.[date]?.includes(t);
                // Keep booked slots even if past; otherwise remove past times
                return !isTimeInPast(date, t) || isBooked;
              })
            : times;
        const withDynamic = addDynamicSlots(date, filtered);
        return { date, times: withDynamic };
      });

    // Ensure at least one upcoming date exists for every court
    if (upcomingByDate.length === 0) {
      const dynTimes = addDynamicSlots(todayStr, []);
      upcomingByDate = [{ date: todayStr, times: dynTimes }];
    }

    return { ...court, upcoming: upcomingByDate };
  });

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
        alert(
          "Error connecting to server. Make sure backend is running on port 3000."
        );
      }
    };
    fetchReservations();
  }, []);

  const handleReserve = (courtId, date, time) => {
    navigate(`/reserve/${courtId}`, { state: { date, time } });
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F3F4F6",
      }}
    >
      <StudentSidebar />
      <div style={{ flex: 1, marginLeft: "250px" }}>
        <div
          style={{
            padding: "40px",
            maxWidth: "1100px",
            margin: "0 auto",
            fontFamily: "Poppins, Arial, sans-serif",
            backgroundColor: "#F3F4F6",
            minHeight: "100vh",
            borderRadius: "12px",
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

          {courtsWithUpcoming.map((court) => (
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
                      {court.upcoming.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              padding: "16px",
                              backgroundColor: "#F9FAFB",
                              border: "1px solid #D1D5DB",
                              borderRadius: "8px",
                              textAlign: "center",
                              color: "#6B7280",
                              fontWeight: 500,
                            }}
                          >
                            No upcoming times. Please check back later.
                          </td>
                        </tr>
                      ) : (
                        court.upcoming.map(({ date, times }) => (
                          <tr key={date}>
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
                                const isBooked =
                                  bookedSlots[court.id]?.[date]?.includes(time);
                                return (
                                  <button
                                    key={time}
                                    disabled={isBooked}
                                    onClick={() =>
                                      handleReserve(court.id, date, time)
                                    }
                                    style={{
                                      margin: "5px",
                                      padding: "8px 14px",
                                      borderRadius: "6px",
                                      border: "none",
                                      fontWeight: 600,
                                      backgroundColor: isBooked
                                        ? "#9CA3AF"
                                        : "#2563EB",
                                      color: "white",
                                      cursor: isBooked
                                        ? "not-allowed"
                                        : "pointer",
                                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                      transition: "0.2s",
                                    }}
                                  >
                                    {time} {isBooked ? "(booked)" : ""}
                                  </button>
                                );
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
