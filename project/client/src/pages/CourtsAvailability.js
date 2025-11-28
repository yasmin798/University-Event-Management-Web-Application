import React from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";

// Image imports (make sure these files exist in the correct path)
import footballImg from "../images/football.webp";
import basketballImg from "../images/basketball.webp";
import tennisImg from "../images/tennis.webp";

// Courts data
const courtsData = [
  {
    id: "football",
    name: "Football Court",
    availability: [
      {
        date: "2025-10-20",
        times: ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"],
      },
      {
        date: "2025-10-21",
        times: ["9:00 AM - 11:00 AM", "1:00 PM - 3:00 PM"],
      },
    ],
  },
  {
    id: "basketball",
    name: "Basketball Court",
    availability: [
      {
        date: "2025-10-20",
        times: ["8:00 AM - 10:00 AM", "3:00 PM - 5:00 PM"],
      },
      {
        date: "2025-10-22",
        times: ["10:00 AM - 12:00 PM"],
      },
    ],
  },
  {
    id: "tennis",
    name: "Tennis Court",
    availability: [
      {
        date: "2025-10-21",
        times: ["7:00 AM - 9:00 AM", "4:00 PM - 6:00 PM"],
      },
      {
        date: "2025-10-23",
        times: ["12:00 PM - 2:00 PM", "5:00 PM - 7:00 PM"],
      },
    ],
  },
];

// Image mapping
const courtImages = {
  football: footballImg,
  basketball: basketballImg,
  tennis: tennisImg,
};

// Component
export default function CourtsAvailability() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/student/dashboard");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <StudentSidebar />
      <div style={{ ...containerStyle, marginLeft: "260px", flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={handleBack}
            style={{
              padding: "10px 20px",
              backgroundColor: "#567c8d",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#45687a")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#567c8d")}
          >
            Back to Dashboard
          </button>
        </div>
        <h1 style={headingStyle}>Campus Courts Availability</h1>

        {courtsData.map((court) => (
          <div key={court.id} style={courtCardStyle}>
            <div style={cardFlexStyle}>
              <img
                src={courtImages[court.id]}
                alt={court.name}
                style={courtImageStyle}
              />

              <div style={cardContentStyle}>
                <h2 style={courtNameStyle}>{court.name}</h2>

                {court.availability.length > 0 ? (
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeaderStyle}>
                        <th style={thTdStyle}>Date</th>
                        <th style={thTdStyle}>Available Times</th>
                      </tr>
                    </thead>
                    <tbody>
                      {court.availability.map(({ date, times }) => (
                        <tr key={date} style={tableRowStyle}>
                          <td style={thTdStyle}>
                            {new Date(date).toLocaleDateString()}
                          </td>
                          <td style={thTdStyle}>{times.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: "#6B7280" }}>No availability data.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =================== Styles ===================

const containerStyle = {
  padding: "30px",
  fontFamily: "Poppins, Arial, sans-serif",
  color: "#111827",
  maxWidth: "900px",
  margin: "0 auto",
};

const headingStyle = {
  textAlign: "center",
  marginBottom: "40px",
  fontWeight: "700",
  fontSize: "2rem",
};

const courtCardStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "30px",
  backgroundColor: "white",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const cardFlexStyle = {
  display: "flex",
  flexDirection: "row",
  gap: "20px",
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const courtImageStyle = {
  width: "300px",
  height: "200px",
  borderRadius: "8px",
  objectFit: "cover",
  flexShrink: 0,
};

const cardContentStyle = {
  flex: 1,
  minWidth: "250px",
};

const courtNameStyle = {
  color: "#2563EB",
  marginBottom: "15px",
  fontWeight: "600",
  fontSize: "1.25rem",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeaderStyle = {
  backgroundColor: "#3B82F6",
  color: "white",
};

const thTdStyle = {
  padding: "12px",
  border: "1px solid #DBEAFE",
  textAlign: "center",
};

const tableRowStyle = {
  backgroundColor: "#EFF6FF",
};
