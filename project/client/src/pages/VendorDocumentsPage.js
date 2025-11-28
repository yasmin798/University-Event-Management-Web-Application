import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001";
const API_BASE2 = "http://localhost:3000";

const VendorDocumentsPage = () => {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [taxCardFile, setTaxCardFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // TODO: replace with however you store JWT
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/vendors/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load vendor profile");
        const data = await res.json();
        setVendor(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchVendor();
    } else {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!taxCardFile && !logoFile) {
      setError("Please select at least one file to upload.");
      return;
    }

    const formData = new FormData();
    if (taxCardFile) formData.append("taxCard", taxCardFile);
    if (logoFile) formData.append("logo", logoFile);

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/vendors/me/documents`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Note: DO NOT set Content-Type manually with FormData
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload documents");
      }

      setSuccessMsg("Documents uploaded successfully. Status set to pending.");
      setVendor((prev) =>
        prev
          ? {
              ...prev,
              taxCardUrl: data.taxCardUrl || prev.taxCardUrl,
              logoUrl: data.logoUrl || prev.logoUrl,
              vendorVerificationStatus: data.vendorVerificationStatus,
            }
          : prev
      );
      setTaxCardFile(null);
      setLogoFile(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex flex-col">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#2f4156]">
          Company Documents
        </h1>
        <button
          onClick={() => navigate("/vendors")}
          className="text-sm text-[#2f4156] hover:underline"
        >
          ← Back to Vendor Hub
        </button>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : error ? (
          <p className="text-red-600 mb-4">{error}</p>
        ) : (
          <>
            {vendor && (
              <div className="mb-6 bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-[#2f4156] mb-2">
                  {vendor.companyName || "Your Company"}
                </h2>
                <p className="text-sm text-gray-600 mb-2">{vendor.email}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Verification status:
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${statusColor(
                      vendor.vendorVerificationStatus
                    )}`}
                  >
                    {vendor.vendorVerificationStatus || "not_submitted"}
                  </span>
                </div>
              </div>
            )}

            {successMsg && (
              <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                {successMsg}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-[#2f4156] mb-1">
                  Tax Card (image or PDF)
                </label>
                {vendor?.taxCardUrl && (
                  <div className="mb-2">
                    <a
                      href={`${API_BASE2}${vendor.taxCardUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline"
                    >
                      View current tax card
                    </a>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setTaxCardFile(e.target.files[0] || null)}
                  className="block w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2f4156] mb-1">
                  Company Logo (image)
                </label>
                {vendor?.logoUrl && (
                  <div className="mb-2 flex items-center gap-3">
                    <img
                      src={`${API_BASE}${vendor.logoUrl}`}
                      alt="Current logo"
                      className="w-16 h-16 object-cover rounded-full border"
                    />
                    <span className="text-xs text-gray-600">
                      Current logo
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files[0] || null)}
                  className="block w-full text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#10b981] text-white rounded-lg text-sm hover:bg-[#0f916a] disabled:opacity-60"
              >
                {saving ? "Uploading..." : "Save Documents"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default VendorDocumentsPage;
