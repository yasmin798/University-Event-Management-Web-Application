import React, { useEffect, useState } from "react";
import { getLoyaltyVendors } from "../api/loyaltyApi";
import Sidebar from "../components/Sidebar";
import StudentSidebar from "../components/StudentSidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";
import TaSidebar from "../components/TaSidebar";
import StaffSidebar from "../components/StaffSidebar";

const LoyaltyVendors = () => {
  const [partners, setPartners] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole((payload.role || "student").toLowerCase());
      } catch (e) {
        setUserRole("student");
      }
    }
  }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getLoyaltyVendors("accepted");
        console.log("Loyalty vendors:", data);
        setPartners(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Unable to load loyalty partners at this time.");
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  const filtered = partners.filter((v) =>
    v.companyName?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {!userRole ? null : userRole === "student" ? (
        <StudentSidebar />
      ) : userRole === "professor" ? (
        <ProfessorSidebar />
      ) : userRole === "ta" ? (
        <TaSidebar />
      ) : userRole === "staff" ? (
        <StaffSidebar />
      ) : (
        <Sidebar />
      )}

      <main style={{ flex: 1, marginLeft: "260px", padding: "24px" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#2f4156" }}>
            GUC Loyalty Partners
          </h1>
          <p className="mb-6 text-gray-600">
            Find vendors offering GUC student discounts and promo codes.
          </p>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company name"
            className="w-full border rounded-lg px-4 py-2 mb-6"
            style={{ maxWidth: "400px" }}
          />

          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <p className="text-gray-500">
              {partners.length === 0
                ? "No loyalty partners available yet."
                : "No partners found matching your search."}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((p) => (
              <div
                key={p._id || p.promoCode}
                className="border rounded-lg p-5 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: "#2f4156" }}
                  >
                    {p.companyName}
                  </h2>
                  <div className="text-lg font-bold text-green-600">
                    {p.discountRate}% OFF
                  </div>
                </div>

                <div className="mb-3">
                  <span className="text-sm text-gray-600">Promo Code:</span>
                  <span
                    className="ml-2 font-mono bg-gray-100 px-3 py-1 rounded text-sm font-semibold"
                    style={{ color: "#2f4156" }}
                  >
                    {p.promoCode}
                  </span>
                </div>

                <div className="text-sm text-gray-700 whitespace-pre-line">
                  <strong>Terms & Conditions:</strong>
                  <div className="mt-1">{p.termsAndConditions}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoyaltyVendors;
