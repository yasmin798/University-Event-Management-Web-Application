import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ApprovedLoyaltyVendors() {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const fetchVendors = async () => {
      const res = await axios.get("http://localhost:3000/api/loyalty/approved");
      setVendors(res.data);
    };
    fetchVendors();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">GUC Loyalty Program Vendors</h2>
      <ul>
        {vendors.map(v => (
          <li key={v._id}>
  {v.companyName} — Promo: {v.promoCode} — Discount: {v.discountRate}%
</li>

        ))}
      </ul>
    </div>
  );
}
