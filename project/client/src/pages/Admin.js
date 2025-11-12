import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();

  // ===== Sidebar UI state =====
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  // ===== State =====
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [vendorBazaarRequests, setVendorBazaarRequests] = useState([]);
  const [vendorBoothRequests, setVendorBoothRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [assignedRoles, setAssignedRoles] = useState({});
  const [showMailPopup, setShowMailPopup] = useState(false);
  const [mailTarget, setMailTarget] = useState(null);
  const [sending, setSending] = useState(false);
  const [previewLink, setPreviewLink] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [eventFetchErrors, setEventFetchErrors] = useState([]);
  const [showCreateUserPopup, setShowCreateUserPopup] = useState(false);
  const [createUserRole, setCreateUserRole] = useState(null);
  const [createUserForm, setCreateUserForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("");

  const API_ORIGIN = "http://localhost:3001";

  // ===== Helper functions =====
  const tryFetchJson = async (url) => {
    try {
      const r = await fetch(url);
      const txt = await r.text();
      try {
        const data = txt ? JSON.parse(txt) : null;
        console.log(`Fetch ${url}:`, { ok: r.ok, status: r.status, data });
        return { ok: r.ok, data, status: r.status, url };
      } catch (err) {
        console.error(`Parse error for ${url}:`, txt, err);
        return {
          ok: r.ok,
          data: txt,
          status: r.status,
          url,
          error: `Parse error: ${err.message}`,
        };
      }
    } catch (err) {
      console.error(`Network error for ${url}:`, err);
      return { ok: false, error: `Network error: ${err.message}`, url };
    }
  };

  async function enrichBazaarRequestsWithBazaarInfo(requestsArr) {
    if (!Array.isArray(requestsArr) || requestsArr.length === 0) return [];

    const uniqueIds = Array.from(
      new Set(
        requestsArr
          .map((r) => {
            if (!r) return null;
            if (r.bazaar) {
              if (typeof r.bazaar === "string") return r.bazaar;
              if (r.bazaar._id) return r.bazaar._id;
            }
            if (r.bazaarId) return r.bazaarId;
            return null;
          })
          .filter(Boolean)
      )
    );

    const fetches = uniqueIds.map((id) =>
      fetch(`${API_ORIGIN}/api/bazaars/${id}`)
        .then(async (res) => {
          if (!res.ok) {
            const txt = await res.text().catch(() => null);
            console.warn(`Failed to fetch bazaar ${id}:`, res.status, txt);
            return { id, data: null };
          }
          const json = await res.json();
          return { id, data: json };
        })
        .catch((err) => {
          console.error(`Error fetching bazaar ${id}:`, err);
          return { id, data: null };
        })
    );

    const results = await Promise.all(fetches);
    const bazaarMap = {};
    results.forEach((r) => {
      bazaarMap[r.id] = r.data || null;
    });

    return requestsArr.map((req) => {
      const firstAtt = Array.isArray(req.attendees) ? req.attendees[0] : null;
      const vendorName = req.vendorName || firstAtt?.name || "";
      const vendorEmail = req.vendorEmail || firstAtt?.email || "";
      const attendeesList = Array.isArray(req.attendees)
        ? req.attendees.map((a) => `${a.name} <${a.email}>`).join(", ")
        : "";
      const description =
        req.description ||
        `Booth: ${req.boothSize || "N/A"}. Attendees: ${attendeesList}`;

      const bazId =
        req.bazaar && typeof req.bazaar === "string"
          ? req.bazaar
          : req.bazaar && req.bazaar._id
          ? req.bazaar._id
          : req.bazaarId
          ? req.bazaarId
          : null;

      const baz = bazId ? bazaarMap[String(bazId)] : null;
      const bazaarInfo = baz
        ? {
            bazaarTitle: baz.title || baz.name || "",
            bazaarLocation: baz.location || baz.venue || "",
            bazaarStart: baz.startDateTime || baz.start || null,
            bazaarEnd: baz.endDateTime || baz.end || null,
            bazaarRaw: baz,
          }
        : null;

      return {
        ...req,
        vendorName,
        vendorEmail,
        description,
        bazaarInfo,
      };
    });
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setMessage("");
      setEventFetchErrors([]);

      const usersAttempt = await tryFetchJson(`${API_ORIGIN}/api/debug/users`);
      let usersData = null;
      if (usersAttempt.ok && usersAttempt.data) {
        usersData = usersAttempt.data;
      } else {
        console.warn("Users endpoint returned no data:", usersAttempt);
      }

      if (usersData?.users) {
        setVerifiedUsers(usersData.users.filter((u) => u.isVerified));
        setPendingUsers(usersData.users.filter((u) => !u.isVerified));
      } else {
        setVerifiedUsers([]);
        setPendingUsers([]);
      }

      const appsAttempt = await tryFetchJson(
        `${API_ORIGIN}/api/bazaar-applications`
      );
      let appsArr = [];
      if (appsAttempt.ok && appsAttempt.data) {
        if (Array.isArray(appsAttempt.data)) appsArr = appsAttempt.data;
        else if (appsAttempt.data.requests) appsArr = appsAttempt.data.requests;
        else if (appsAttempt.data.items) appsArr = appsArr.data.items;
        else appsArr = appsAttempt.data;
      } else {
        const adminApps = await tryFetchJson(
          `${API_ORIGIN}/api/admin/bazaar-vendor-requests`
        );
        console.log("Bazaar vendor requests response:", adminApps);
        if (adminApps.ok && adminApps.data) {
          appsArr = Array.isArray(adminApps.data)
            ? adminApps.data
            : adminApps.data.requests || [];
        }
      }

      const enrichedApps = await enrichBazaarRequestsWithBazaarInfo(
        appsArr || []
      );
      setVendorBazaarRequests(enrichedApps);

      const boothAdminAttempt = await tryFetchJson(
        `${API_ORIGIN}/api/booth-applications`
      );
      let boothArr = [];
      if (boothAdminAttempt.ok && boothAdminAttempt.data) {
        boothArr = Array.isArray(boothAdminAttempt.data)
          ? boothAdminAttempt.data
          : boothAdminAttempt.data.requests || [];
      }
      setVendorBoothRequests(boothArr || []);
      const start = new Date();
      
        const boothEvents = (boothArr || []).map((booth) => {
  const durationWeeks = booth.duration || 1; 
  const end = new Date(start.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);

  return {
    ...booth,
    _id:booth._id,
    eventType: "booth",
    title: booth.attendees?.[0]?.name || `Booth ${booth._id}`,
    durationWeeks,
    location: booth.platformSlot || booth.boothLocation || booth.locationName || "—",
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    registrations: booth.registrations || [],
  };
});

      const eventEndpoints = [
        { path: "/api/trips", type: "trip", key: "items" },
        { path: "/api/conferences", type: "conference", key: "items" },
        { path: "/api/bazaars", type: "bazaar", key: "items" },
        { path: "/api/workshops", type: "workshop", key: "items" },
         
      ];
       

      const allEvents = [];
      const errors = [];
      allEvents.push(...boothEvents);
      for (const endpoint of eventEndpoints) {
        const attempt = await tryFetchJson(`${API_ORIGIN}${endpoint.path}`);
        if (attempt.ok && attempt.data) {
          const data = Array.isArray(attempt.data)
            ? attempt.data
            : attempt.data[endpoint.key] || [];
          allEvents.push(
            ...data.map((event) => ({ ...event, eventType: endpoint.type }))
          );
         
        } else {
          errors.push(
            `Failed to fetch ${endpoint.path}: ${attempt.status} ${
              attempt.error || attempt.data || "No data"
            }`
          );
        }
      }

      console.log("Combined events:", allEvents);
      setEvents(allEvents);
      setEventFetchErrors(errors);

      if (allEvents.length === 0) {
        setMessage(
          "⚠️ No events found. Database collections (trips, conferences, bazaars) may be empty."
        );
      }

      setLoading(false);
    } catch (err) {
      console.error("fetchUsers error:", err);
      setMessage("❌ Could not load data. Check console for details.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to DELETE this user?")) return;

    try {
      const res = await fetch(`${API_ORIGIN}/api/admin/delete/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("🗑️ User deleted successfully!");
        fetchUsers();
      } else {
        setMessage(`❌ ${data.error || "Delete failed"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error during delete");
    }
  };

  const handleBlock = async (userId, currentStatus) => {
    const newStatus = currentStatus === "blocked" ? "active" : "blocked";
    if (!window.confirm(`Are you sure you want to ${newStatus} this user?`)) return;

    try {
      const res = await fetch(`${API_ORIGIN}/api/admin/block/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchUsers();
      } else {
        setMessage(`❌ ${data.error || "Block/Unblock failed"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error during block/unblock");
    }
  };

  const handleSendMail = async () => {
    if (!mailTarget) return;
    setSending(true);
    try {
      let assignedRole = assignedRoles[mailTarget._id];
      if (mailTarget.role === "student") {
        assignedRole = "student"; // Pre-assign for students
      }
      const res = await fetch(`${API_ORIGIN}/api/admin/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mailTarget.email,
          userId: mailTarget._id,
          role: assignedRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`📧 ${data.message}`);
        setShowMailPopup(false);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Could not send email.");
    }
    setSending(false);
  };

  const handleVendorRequestStatus = async (requestId, type, newStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to ${newStatus.toUpperCase()} this ${type} vendor request?`
      )
    )
      return;
    setProcessingId(requestId);
    try {
      let url;
      if (type === "bazaar") {
        url = `${API_ORIGIN}/api/bazaar-applications/${requestId}`;
      } else if (type === "booth") {
        url = `${API_ORIGIN}/api/booth-applications/${requestId}`;
      }

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Vendor request ${newStatus} successfully!`);
        await fetchUsers();
      } else {
        setMessage(`❌ ${data.error || "Update failed"}`);
        console.warn("Update failed response:", data);
      }
    } catch (err) {
      console.error("Error updating vendor request status:", err);
      setMessage("❌ Server error during request update");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteEvent = async (eventId, eventType) => {
    const event = events.find((e) => e._id === eventId);
    if (!event) {
      setMessage(`❌ Event not found for ID ${eventId}`);
      return;
    }
  

    const hasRegistrations =
      Array.isArray(event.registrations) && event.registrations.length > 0;
    if (hasRegistrations) {
      const eventTitle = event.title || event.name || "Untitled";
      const registrationCount = event.registrations.length;
      setMessage(
        `❌ Cannot delete ${
          eventType.charAt(0).toUpperCase() + eventType.slice(1)
        } '${eventTitle}' because ${registrationCount} user${
          registrationCount === 1 ? "" : "s"
        } ha${registrationCount === 1 ? "s" : "ve"} registered.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to DELETE this ${eventType}?`))
      return;

    setProcessingId(eventId);
    try {
      const endpoint = `${API_ORIGIN}/api/${eventType}s/${eventId}`;
      const res = await fetch(endpoint, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(
          `🗑️ ${
            eventType.charAt(0).toUpperCase() + eventType.slice(1)
          } deleted successfully!`
        );
        await fetchUsers();
      } else {
        setMessage(`❌ ${data.error || "Delete failed"}`);
      }
    } catch (err) {
      console.error(`Error deleting ${eventType}:`, err);
      setMessage(`❌ Server error during ${eventType} deletion`);
    } finally {
      setProcessingId(null);
    }
  };

  const generatePreviewLink = (userId) => {
    const token = Math.random().toString(36).substring(2, 15);
    setPreviewLink(`${API_ORIGIN}/api/verify/${token}-for-${userId}`);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      navigate("/");
    }
  };

  const handleCreateUser = async () => {
    if (!createUserForm.name || !createUserForm.email || !createUserForm.password) {
      setMessage("❌ Please fill in all fields.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_ORIGIN}/api/admin/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: createUserForm.name,
          email: createUserForm.email,
          password: createUserForm.password,
          role: createUserRole,
          isVerified: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${createUserRole.charAt(0).toUpperCase() + createUserRole.slice(1)} created successfully!`);
        setShowCreateUserPopup(false);
        setCreateUserForm({ name: "", email: "", password: "" });
        await fetchUsers();
      } else {
        setMessage(`❌ ${data.error || "User creation failed"}`);
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setMessage("❌ Server error during user creation");
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <p style={{ textAlign: "center" }}>
        Loading users, requests, and events...
      </p>
    );

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Overlay for Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full" />
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-[#567c8d] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        <nav className="flex-1 px-4"></nav>
      </div>

      {/* Main Section */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
              >
                <Menu size={24} className="text-[#2f4156]" />
              </button>
              <h1 className="text-xl font-bold text-[#2f4156]">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCreateUserRole("admin");
                  setShowCreateUserPopup(true);
                }}
                style={createBtnStyle}
              >
                Create Admin
              </button>
              <button
                onClick={() => {
                  setCreateUserRole("events_office");
                  setShowCreateUserPopup(true);
                }}
                style={createBtnStyle}
              >
                Create Events Officer
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <div
            style={{
              padding: "30px 0",
              fontFamily: "Poppins, Arial, sans-serif",
            }}
          >
            {message && (
              <p
                style={{
                  textAlign: "center",
                  color:
                    message.startsWith("✅") || message.startsWith("📧")
                      ? "green"
                      : "red",
                  fontWeight: 500,
                }}
              >
                {message}
              </p>
            )}

            {eventFetchErrors.length > 0 && (
              <p style={{ color: "red", textAlign: "center", fontWeight: 500 }}>
                Errors fetching events: {eventFetchErrors.join("; ")}
              </p>
            )}

            <SectionVerified
              verifiedUsers={verifiedUsers}
              handleDelete={handleDelete}
              handleBlock={handleBlock}
            />

            <SectionPending
              pendingUsers={pendingUsers}
              assignedRoles={assignedRoles}
              setAssignedRoles={setAssignedRoles}
              setMailTarget={setMailTarget}
              generatePreviewLink={generatePreviewLink}
              setShowMailPopup={setShowMailPopup}
              handleDelete={handleDelete}
              handleBlock={handleBlock}
              handleSendMail={handleSendMail}
            />

            <SectionBazaarRequests
              requests={vendorBazaarRequests}
              processingId={processingId}
              handleVendorRequestStatus={handleVendorRequestStatus}
            />

            <SectionBoothRequests
              requests={vendorBoothRequests}
              processingId={processingId}
              handleVendorRequestStatus={handleVendorRequestStatus}
            />

            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <input
                type="text"
                placeholder="Search by title, company, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border rounded-md w-full md:w-1/3"
              />
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-3 py-2 border rounded-md w-full md:w-1/4"
              >
                <option value="">All Types</option>
                <option value="trip">Trip</option>
                <option value="conference">Conference</option>
                <option value="bazaar">Bazaar</option>
                <option value="workshop">Workshop</option>
                <option value="booth">Booth</option>
              </select>
            </div>

            <SectionEvents
              events={events}
              searchQuery={searchQuery}
              eventFilter={eventFilter}
              eventFetchErrors={eventFetchErrors}
              processingId={processingId}
              handleDeleteEvent={handleDeleteEvent}
            />

            {showMailPopup && mailTarget && (
              <MailPopup
                onClose={() => setShowMailPopup(false)}
                onSend={handleSendMail}
                sending={sending}
                mailTarget={mailTarget}
                previewLink={previewLink}
              />
            )}

            {showCreateUserPopup && (
              <CreateUserPopup
                role={createUserRole}
                formData={createUserForm}
                setFormData={setCreateUserForm}
                onClose={() => {
                  setShowCreateUserPopup(false);
                  setCreateUserForm({ name: "", email: "", password: "" });
                }}
                onCreate={handleCreateUser}
                sending={sending}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ===== Presentational Sub-Components ===== */

function SectionVerified({ verifiedUsers, handleDelete, handleBlock }) {
  return (
    <>
      <h2 style={{ color: "#10B981", marginTop: 10 }}>✅ Verified Users</h2>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#10B981", color: "white" }}>
            <th style={thStyle}>Name / Company</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {verifiedUsers.length ? (
            verifiedUsers.map((user) => (
              <tr key={user._id} style={trStyle}>
                <td style={tdStyle}>
                  {user.firstName || user.companyName || "User"}
                </td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.role}</td>
                <td style={tdStyle}>
                  {user.roleSpecificId || (
                    <span style={{ color: "#6B7280", fontStyle: "italic" }}>
                      N/A
                    </span>
                  )}
                </td>
                 <td style={tdStyle}>
                  <span
                    style={{
                      color: user.status === "blocked" ? "red" : "green",
                      fontWeight: "bold",
                    }}
                  >
                    {user.status || "active"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleBlock(user._id, user.status || "active")}
                    style={{
                      backgroundColor: user.status === "blocked" ? "#10B981" : "#EF4444",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 10px",
                      cursor: "pointer",
                      marginRight: 5,
                    }}
                  >
                    {user.status === "blocked" ? "Unblock" : "Block"}
                  </button>
                  <button
                    onClick={() => handleDelete(user._id)}
                    style={deleteBtnStyle}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={tdEmptyStyle}>
                No verified users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function SectionPending({
  pendingUsers,
  assignedRoles,
  setAssignedRoles,
  setMailTarget,
  generatePreviewLink,
  setShowMailPopup,
  handleDelete,
  handleBlock,
  handleSendMail,
}) {
  return (
    <>
      <h2 style={{ color: "#F59E0B", marginTop: 50 }}>
        🕓 Pending Verification
      </h2>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#F59E0B", color: "white" }}>
            <th style={thStyle}>Name / Company</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Current Role</th>
             <th style={thStyle}>ID</th>
            <th style={thStyle}>Assigned Role</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingUsers.length ? (
            pendingUsers.map((user) => (
              <tr key={user._id} style={trStyle}>
                <td style={tdStyle}>
                  {user.firstName || user.companyName || "User"}
                </td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.role}</td>
                   <td style={tdStyle}>
                  {user.roleSpecificId || (
                    <span style={{ color: "#6B7280", fontStyle: "italic" }}>
                      N/A
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  {user.role === "student" ? (
                    <span style={{ fontWeight: "bold" }}>Student</span>
                  ) : (
                    <select
                      style={dropdownStyle}
                      value={assignedRoles[user._id] || ""}
                      onChange={(e) =>
                        setAssignedRoles({
                          ...assignedRoles,
                          [user._id]: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Role</option>
                      <option value="staff">Staff</option>
                      <option value="ta">TA</option>
                      <option value="professor">Professor</option>
                    </select>
                  )}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      color: user.status === "blocked" ? "red" : "green",
                      fontWeight: "bold",
                    }}
                  >
                    {user.status || "active"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleBlock(user._id, user.status || "active")}
                    style={{
                      backgroundColor: user.status === "blocked" ? "#10B981" : "#EF4444",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 10px",
                      cursor: "pointer",
                      marginRight: 5,
                    }}
                  >
                    {user.status === "blocked" ? "Unblock" : "Block"}
                  </button>
                  <button
                    onClick={() => {
                      setMailTarget(user);
                      generatePreviewLink(user._id);
                      setShowMailPopup(true);
                    }}
                    style={mailBtnStyle}
                  >
                    Send Mail
                  </button>
                  <button
                    onClick={() => handleDelete(user._id)}
                    style={deleteBtnStyle}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={tdEmptyStyle}>
                No pending users.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function SectionBazaarRequests({
  requests,
  processingId,
  handleVendorRequestStatus,
}) {
  return (
    <>
      <h2 style={{ color: "#3B82F6", marginTop: 50 }}>
        Vendor Requests - Bazaars
      </h2>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#3B82F6", color: "white" }}>
            <th style={thStyle}>Bazaar</th>
            <th style={thStyle}>Vendor</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.length ? (
            requests.map((req) => (
              <tr key={req._id} style={trStyle}>
                <td style={tdStyle}>
                  {req.bazaarInfo ? (
                    <>
                      <div style={{ fontWeight: 700 }}>
                        {req.bazaarInfo.bazaarTitle}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>
                        {req.bazaarInfo.bazaarLocation}
                      </div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                        {req.bazaarInfo.bazaarStart
                          ? new Date(
                              req.bazaarInfo.bazaarStart
                            ).toLocaleString()
                          : ""}{" "}
                        -{" "}
                        {req.bazaarInfo.bazaarEnd
                          ? new Date(req.bazaarInfo.bazaarEnd).toLocaleString()
                          : ""}
                      </div>
                    </>
                  ) : (
                    <div>{String(req.bazaar || req.bazaarId || "—")}</div>
                  )}
                </td>
                <td style={tdStyle}>
                  {req.vendorName ||
                    (req.attendees &&
                      req.attendees[0] &&
                      req.attendees[0].name) ||
                    "—"}
                </td>
                <td style={tdStyle}>
                  {req.description || `Booth: ${req.boothSize || "N/A"}`}
                </td>
                <td style={tdStyle}>
                  {(req.status || "pending").toLowerCase()}
                </td>
                <td style={tdStyle}>
                  {req.status === "pending" ? (
                    <>
                      <button
                        onClick={() =>
                          handleVendorRequestStatus(
                            req._id,
                            "bazaar",
                            "accepted"
                          )
                        }
                        style={verifyBtnStyle}
                        disabled={processingId === req._id}
                      >
                        {processingId === req._id ? "Processing..." : "Accept"}
                      </button>
                      <button
                        onClick={() =>
                          handleVendorRequestStatus(
                            req._id,
                            "bazaar",
                            "rejected"
                          )
                        }
                        style={deleteBtnStyle}
                        disabled={processingId === req._id}
                      >
                        {processingId === req._id ? "Processing..." : "Reject"}
                      </button>
                    </>
                  ) : (
                    <span
                      style={{
                        color: req.status === "accepted" ? "green" : "red",
                        fontWeight: 600,
                      }}
                    >
                      {req.status}
                    </span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={tdEmptyStyle}>
                No bazaar requests.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function SectionBoothRequests({
  requests,
  processingId,
  handleVendorRequestStatus,
}) {
  return (
    <>
      <h2 style={{ color: "#6366F1", marginTop: 50 }}>
        Vendor Requests - Booths
      </h2>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#6366F1", color: "white" }}>
            <th style={thStyle}>Booth ID</th>
            <th style={thStyle}>Vendor</th>
            <th style={thStyle}>Description (location & duration)</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.length ? (
            requests.map((req) => {
              const boothId =
                req.boothId || req.booth || req.id || req._id || "—";
              const vendorName =
                req.vendorName ||
                (Array.isArray(req.attendees) &&
                  req.attendees[0] &&
                  req.attendees[0].name) ||
                "—";
              const locationVal =
                req.platformSlot ||
                req.boothLocation ||
                req.platformLocation ||
                req.selectedLocation ||
                req.locationSelected ||
                req.locationName ||
                req.slotLocation ||
                (req.meta && (req.meta.location || req.meta.locationName)) ||
                (req.details && req.details.location) ||
                "";
              let rawDuration =
                req.duration ||
                req.durationWeeks ||
                req.setupDuration ||
                req.weeks ||
                (req.meta && req.meta.duration) ||
                (req.details && req.details.duration) ||
                "";
              let durationVal = "";
              if (typeof rawDuration === "number") {
                durationVal = `${rawDuration} weeks`;
              } else if (
                typeof rawDuration === "string" &&
                rawDuration.trim() !== ""
              ) {
                const s = rawDuration.trim();
                if (/\bweek(s)?\b/i.test(s)) {
                  durationVal = s;
                } else if (/^\d+(\.\d+)?$/.test(s)) {
                  durationVal = `${s} weeks`;
                } else {
                  durationVal = s;
                }
              }
              let description = "";
              if (req.description && String(req.description).trim() !== "") {
                description = String(req.description);
              } else {
                const parts = [];
                if (locationVal) parts.push(`Location: ${locationVal}`);
                if (durationVal) parts.push(`Duration: ${durationVal}`);
                if (parts.length === 0 && (req.details || req.info)) {
                  description = String(req.details || req.info);
                } else {
                  description = parts.join(" • ");
                }
                if (!description) description = "No details provided.";
              }
              const status = (req.status || "pending").toLowerCase();

              return (
                <tr key={req._id || req.id || boothId} style={trStyle}>
                  <td style={tdStyle}>{boothId}</td>
                  <td style={tdStyle}>{vendorName}</td>
                  <td style={tdStyle}>{description}</td>
                  <td style={tdStyle}>{status}</td>
                  <td style={tdStyle}>
                    {status === "pending" ? (
                      <>
                        <button
                          onClick={() =>
                            handleVendorRequestStatus(
                              req._id || req.id || boothId,
                              "booth",
                              "accepted"
                            )
                          }
                          style={verifyBtnStyle}
                          disabled={
                            processingId === (req._id || req.id || boothId)
                          }
                        >
                          {processingId === (req._id || req.id || boothId)
                            ? "Processing..."
                            : "Accept"}
                        </button>
                        <button
                          onClick={() =>
                            handleVendorRequestStatus(
                              req._id || req.id || boothId,
                              "booth",
                              "rejected"
                            )
                          }
                          style={deleteBtnStyle}
                          disabled={
                            processingId === (req._id || req.id || boothId)
                          }
                        >
                          {processingId === (req._id || req.id || boothId)
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </>
                    ) : (
                      <span
                        style={{
                          color: status === "accepted" ? "green" : "red",
                          fontWeight: 600,
                        }}
                      >
                        {status}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" style={tdEmptyStyle}>
                No booth requests.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function SectionEvents({
  events,
  searchQuery,
  eventFilter,
  eventFetchErrors,
  processingId,
  handleDeleteEvent,
}) {
  const navigate = useNavigate();
  const filteredEvents = events
    .filter((event) => (eventFilter ? event.eventType === eventFilter : true))
    .filter((event) => {
      const title = event.title || event.name || "";
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });

  return (
    <>
      <h2 style={{ color: "#8B5CF6", marginTop: 50 }}>📅 All Events</h2>
      {eventFetchErrors.length > 0 && (
        <p style={{ color: "red", textAlign: "center", fontWeight: 500 }}>
          Errors fetching events: {eventFetchErrors.join("; ")}
        </p>
      )}
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#8B5CF6", color: "white" }}>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Title</th>
            <th style={thStyle}>Location</th>
            <th style={thStyle}>Start Date</th>
            <th style={thStyle}>End Date</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEvents.length ? (
            filteredEvents.map((event) => {
              const hasRegistrations =
                Array.isArray(event.registrations) &&
                event.registrations.length > 0;
              return (
                <tr key={event._id} style={trStyle}>
                  <td style={tdStyle}>
                    {event.eventType.charAt(0).toUpperCase() +
                      event.eventType.slice(1)}
                  </td>
                  <td style={tdStyle}>
                    {event.title || event.name || event.workshopName||"Untitled"}
                  </td>
                  <td style={tdStyle}>
                    {event.location || event.venue || "—"}
                  </td>
                  <td style={tdStyle}>
                    {event.startDateTime
                      ? new Date(event.startDateTime).toLocaleString()
                      : "—"}
                  </td>
                  <td style={tdStyle}>
                    {event.endDateTime
                      ? new Date(event.endDateTime).toLocaleString()
                      : "—"}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() =>
                        navigate(`/events/${event._id}`, {
                          state: { fromAdmin: true },
                        })
                      }
                      style={{
                        ...verifyBtnStyle,
                        backgroundColor: "#3B82F6",
                        marginRight: 5,
                      }}
                    >
                      Details
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteEvent(event._id, event.eventType)
                      }
                      style={{
                        ...deleteBtnStyle,
                        ...(hasRegistrations
                          ? { opacity: 0.6, cursor: "not-allowed" }
                          : {}),
                      }}
                      disabled={processingId === event._id}
                      title={`Delete this ${event.eventType}`}
                    >
                      {processingId === event._id ? "Processing..." : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6" style={tdEmptyStyle}>
                No events match your search/filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function MailPopup({ onClose, onSend, sending, mailTarget, previewLink }) {
  return (
    <div style={popupOverlayStyle}>
      <div style={popupHeaderStyle}>
        <div>
          <h3 style={{ margin: 0 }}>New Message</h3>
          <p style={{ color: "#E5E7EB", fontSize: 14 }}>Admin Compose</p>
        </div>
        <button onClick={onClose} style={closeBtnStyle}>
          ✕
        </button>
      </div>
      <div style={popupContentStyle}>
        <div style={mailRowStyle}>
          <b>To:</b> {mailTarget.email}
        </div>
        <div style={mailRowStyle}>
          <b>Subject:</b> Account Verification - Admin Approval
        </div>
        <div style={mailBodyStyle}>
          <p>Dear {mailTarget.firstName || "User"},</p>
          <p>Please click the link below to verify your account:</p>
          <a href={previewLink} target="_blank" rel="noreferrer">
            {previewLink}
          </a>
          <p>This link will expire once used.</p>
          <p>— Admin Team</p>
        </div>
      </div>
      <div style={popupFooterStyle}>
        <button onClick={onSend} style={sendBtnStyle} disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
        <button onClick={onClose} style={cancelBtnStyle}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function CreateUserPopup({ role, formData, setFormData, onClose, onCreate, sending }) {
  return (
    <div style={popupOverlayStyle}>
      <div style={popupHeaderStyle}>
        <div>
          <h3 style={{ margin: 0 }}>
            Create {role === "admin" ? "Admin" : "Events Officer"}
          </h3>
          <p style={{ color: "#E5E7EB", fontSize: 14 }}>Admin User Creation</p>
        </div>
        <button onClick={onClose} style={closeBtnStyle}>
          ✕
        </button>
      </div>
      <div style={popupContentStyle}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 5 }}>
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            style={inputStyle}
            placeholder="Enter full name"
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 5 }}>
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            style={inputStyle}
            placeholder="Enter email address"
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 5 }}>
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            style={inputStyle}
            placeholder="Enter password"
          />
        </div>
      </div>
      <div style={popupFooterStyle}>
        <button onClick={onCreate} style={sendBtnStyle} disabled={sending}>
          {sending ? "Creating..." : "Create"}
        </button>
        <button onClick={onClose} style={cancelBtnStyle}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ===== Styles ===== */
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 10,
  backgroundColor: "white",
  borderRadius: 10,
  overflow: "hidden",
};
const thStyle = { padding: 10, fontWeight: 600, textAlign: "center" };
const tdStyle = {
  padding: 10,
  textAlign: "center",
  borderBottom: "1px solid #E5E7EB",
};
const trStyle = { background: "#fff" };
const tdEmptyStyle = { padding: 20, textAlign: "center", color: "#6B7280" };
const verifyBtnStyle = {
  backgroundColor: "#10B981",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
  marginRight: 5,
};
const deleteBtnStyle = {
  backgroundColor: "#EF4444",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
};
const mailBtnStyle = {
  backgroundColor: "#3B82F6",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
  marginRight: 5,
};
const createBtnStyle = {
  backgroundColor: "#8B5CF6",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  cursor: "pointer",
  fontWeight: 500,
};
const dropdownStyle = {
  padding: 5,
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  backgroundColor: "#F9FAFB",
};
const inputStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  backgroundColor: "#F9FAFB",
};
const popupOverlayStyle = {
  position: "fixed",
  bottom: 0,
  right: 20,
  width: 400,
  backgroundColor: "white",
  borderRadius: "10px 10px 0 0",
  boxShadow: "0 -4px 15px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
  zIndex: 999,
};
const popupHeaderStyle = {
  background: "#3B82F6",
  color: "white",
  padding: "10px 15px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const closeBtnStyle = {
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: 18,
  cursor: "pointer",
};
const popupContentStyle = {
  padding: "10px 15px",
  flexGrow: 1,
  overflowY: "auto",
};
const mailRowStyle = {
  padding: "5px 0",
  borderBottom: "1px solid #E5E7EB",
  fontSize: 14,
};
const mailBodyStyle = { padding: "10px 0", fontSize: 14, color: "#111827" };
const popupFooterStyle = {
  padding: "10px 15px",
  borderTop: "1px solid #E5E7EB",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};
const sendBtnStyle = {
  backgroundColor: "#10B981",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  cursor: "pointer",
  fontWeight: 500,
};
const cancelBtnStyle = {
  backgroundColor: "#9CA3AF",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  cursor: "pointer",
};