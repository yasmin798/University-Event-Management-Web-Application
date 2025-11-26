import React, { useEffect, useState } from "react";
import { getLoyaltyVendors } from "../api/loyaltyApi";
import ProfessorSidebar from "../components/ProfessorSidebar";

function ProfessorLoyaltyVendors() {
  const [vendors, setVendors] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getLoyaltyVendors("accepted");
        console.log("Loyalty API response:", data);
        setVendors(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching loyalty vendors:", e);
        setError(`Failed to load vendors: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = vendors.filter(v =>
    v.companyName?.toLowerCase().includes(query.toLowerCase())
  );

  if (loading)
    return (
      <div className="events-theme flex min-h-screen bg-[#f5efeb] ml-[260px]">
        <ProfessorSidebar />
        <div className="flex-1 p-6">Loading loyalty partners…</div>
      </div>
    );
  if (error)
    return (
      <div className="events-theme flex min-h-screen bg-[#f5efeb] ml-[260px]">
        <ProfessorSidebar />
        <div className="flex-1 p-6 text-red-600">{error}</div>
      </div>
    );

  return (
    <div className="events-theme flex min-h-screen bg-[#f5efeb] ml-[260px]">
      <ProfessorSidebar />
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">GUC Loyalty Partners</h1>
        <p className="text-gray-600 mb-6">
          Explore student discounts, promo codes, and terms.
        </p>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by company name"
          className="w-full border rounded px-3 py-2 mb-4"
        />

        {filtered.length === 0 ? (
          <div className="text-gray-500">
            No partners found.
            {vendors.length > 0 && <p className="mt-2 text-sm">({vendors.length} total, filtered to 0)</p>}
            {vendors.length === 0 && <p className="mt-2 text-sm">No approved loyalty applications in the database yet.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((v) => (
              <div
                key={v._id || v.promoCode}
                className="border rounded-lg p-4 shadow-sm bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-medium">{v.companyName}</h2>
                  <span className="text-green-700 font-semibold">
                    {v.discountRate}% off
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-gray-600">Promo Code:</span>
                  <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                    {v.promoCode}
                  </span>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {v.termsAndConditions}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfessorLoyaltyVendors;
