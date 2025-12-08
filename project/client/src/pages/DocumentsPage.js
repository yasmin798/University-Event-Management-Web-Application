import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NotificationsDropdown from "../components/NotificationsDropdown";
import { Search, Mic, Download, Eye, X } from "lucide-react";
import "../events.theme.css";

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [docsList, setDocsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");

      // Fetch attendee docs
      const [bRes, boRes, vRes] = await Promise.all([
        fetch("/api/bazaar-applications", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/booth-applications", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/vendors", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const bJson = bRes.ok ? await bRes.json() : [];
      const boJson = boRes.ok ? await boRes.json() : [];
      const vJson = vRes.ok ? await vRes.json() : { vendors: [] };

      // Extract attendee docs
      const gatherAttendeeDocs = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr.flatMap((r) =>
          (r.attendees || [])
            .filter((a) => a?.idDocument)
            .map((a) => ({
              name: a.name || "No Name",
              email: a.email || "",
              url: a.idDocument.startsWith("/")
                ? `${window.location.origin}${a.idDocument}`
                : a.idDocument,
              type: "Attendee",
            }))
        );
      };

      // Extract vendor docs
      const gatherVendorDocs = (vendors) => {
        if (!Array.isArray(vendors)) return [];

        return vendors.flatMap((v) => {
          const docs = [];

          if (v.taxCardUrl) {
            docs.push({
              name: v.companyName || v.email,
              label: "Tax Card",
              url: `${window.location.origin}${v.taxCardUrl}`,
              type: "Vendor",
            });
          }

          if (v.logoUrl) {
            docs.push({
              name: v.companyName || v.email,
              label: "Company Logo",
              url: `${window.location.origin}${v.logoUrl}`,
              type: "Vendor",
            });
          }

          return docs;
        });
      };

      const attendeeDocs = [
        ...gatherAttendeeDocs(bJson),
        ...gatherAttendeeDocs(boJson),
      ];

      const vendorDocs = gatherVendorDocs(vJson.vendors);

      setDocsList([...vendorDocs, ...attendeeDocs]);
    } catch (err) {
      console.error("Error fetching docs:", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = docsList.filter(
    (doc) =>
      (doc.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (doc.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (doc.label?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const openViewer = (url) => {
    setViewerUrl(url);
    setViewerOpen(true);
  };

  const downloadDoc = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <Sidebar />
      <main style={{ flex: 1, marginLeft: "260px", padding: "0 24px 24px" }}>
        {/* ==================== TOP HEADER PANEL ==================== */}
        <header
          style={{
            marginLeft: "-24px",
            marginRight: "-24px",
            width: "calc(100% + 48px)",
            background: "var(--card)",
            borderRadius: "0 0 16px 16px",
            boxShadow: "var(--shadow)",
            padding: "20px 24px",
            marginBottom: "20px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Top Row: Search and Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              gap: "16px",
            }}
          >
            {/* LEFT: Search Bar - Stretched */}
            <div
              style={{
                position: "relative",
                flex: "1 1 auto",
                minWidth: "400px",
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "14px",
                  transform: "translateY(-50%)",
                  color: "var(--teal)",
                }}
              />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 44px",
                  borderRadius: "10px",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  background: "#f9fafb",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#567c8d";
                  e.target.style.background = "white";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.background = "#f9fafb";
                }}
              />
            </div>

            {/* RIGHT: Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flex: "0 0 auto",
              }}
            >
              <NotificationsDropdown />

              <button
                onClick={() => {
                  // Voice command can be implemented later
                  console.log("Voice command clicked");
                }}
                style={{
                  background: "#567c8d",
                  color: "white",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#45687a")}
                onMouseLeave={(e) => (e.target.style.background = "#567c8d")}
              >
                <Mic size={18} />
                Voice Command
              </button>

              <button
                onClick={fetchDocuments}
                style={{
                  padding: "10px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  background: "#567c8d",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#45687a")}
                onMouseLeave={(e) => (e.target.style.background = "#567c8d")}
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Title */}
        <h1 style={{ marginTop: 0, color: "var(--navy)" }}>Documents</h1>

        {/* Content */}
        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading documents...</p>
        ) : error ? (
          <div
            style={{
              color: "#b91c1c",
              background: "#fee2e2",
              borderRadius: "8px",
              padding: "12px 16px",
            }}
          >
            {error}
          </div>
        ) : filteredDocs.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No documents found.
            {docsList.length > 0 && " Try adjusting your search."}
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            {filteredDocs.map((doc, idx) => (
              <div
                key={idx}
                style={{
                  background: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ margin: "0 0 4px 0", fontWeight: "600", fontSize: "14px" }}>
                    {doc.name}
                  </p>
                  {doc.email && (
                    <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#666" }}>
                      {doc.email}
                    </p>
                  )}
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                      background:
                        doc.type === "Vendor" ? "#dbeafe" : "#f3e8ff",
                      color: doc.type === "Vendor" ? "#1e40af" : "#6b21a8",
                      marginTop: "4px",
                    }}
                  >
                    {doc.type}
                    {doc.label && ` - ${doc.label}`}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => openViewer(doc.url)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "#567c8d",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.background = "#45687a")}
                    onMouseLeave={(e) => (e.target.style.background = "#567c8d")}
                  >
                    <Eye size={14} />
                    View
                  </button>
                  <button
                    onClick={() => downloadDoc(doc.url, doc.name)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "#f5f5f5",
                      color: "#333",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#e0e0e0";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "#f5f5f5";
                    }}
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document Viewer Modal */}
        {viewerOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
            onClick={() => setViewerOpen(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "900px",
                height: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: "14px 20px",
                  background: "#f5f7fa",
                  borderBottom: "1px solid #e2e2e2",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontWeight: 600,
                  color: "#222",
                }}
              >
                <span>Document Viewer</span>
                <button
                  onClick={() => setViewerOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "22px",
                    cursor: "pointer",
                    color: "#444",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Content Area */}
              <div
                style={{
                  flex: 1,
                  background: "#fafafa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "auto",
                  padding: "20px",
                }}
              >
                {/* Detect image vs PDF */}
                {viewerUrl.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                  <img
                    src={viewerUrl}
                    alt="Document"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: "8px",
                      boxShadow: "0 0 10px rgba(0,0,0,0.15)",
                    }}
                  />
                ) : (
                  <iframe
                    src={viewerUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                    title="Document Viewer"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
