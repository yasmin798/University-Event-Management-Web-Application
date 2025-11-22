import React, { useEffect, useState } from 'react';

const LoyaltyVendors = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:3001/api/vendors/loyalty');
        if (!res.ok) throw new Error('Failed to fetch loyalty partners');
        const data = await res.json();
        setPartners(data.partners || []);
      } catch (err) {
        console.error(err);
        setError('Unable to load loyalty partners at this time.');
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">GUC Loyalty Partners</h1>
      <p className="mb-4 text-gray-600">Find vendors offering GUC student discounts and promo codes.</p>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && partners.length === 0 && (
        <p>No loyalty partners available right now.</p>
      )}

      <div className="grid gap-4">
        {partners.map((p) => (
          <div key={p.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{p.companyName}</h2>
              <div className="text-sm text-gray-600">{p.discountRate}% off</div>
            </div>

            {p.promoCode && (
              <p className="mt-2"><strong>Promo code:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{p.promoCode}</span></p>
            )}

            {p.terms && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-700">Terms &amp; conditions</summary>
                <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{p.terms}</div>
              </details>
            )}

            {(p.validFrom || p.validTo) && (
              <p className="mt-2 text-sm text-gray-500">Valid: {p.validFrom ? new Date(p.validFrom).toLocaleDateString() : '—'} — {p.validTo ? new Date(p.validTo).toLocaleDateString() : '—'}</p>
            )}

            <p className="mt-3 text-sm text-gray-500">Contact: {p.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoyaltyVendors;
