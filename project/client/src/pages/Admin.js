import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import FixedSidebarAdmin from "../components/FixedSidebarAdmin";
import NotificationsDropdown from "../components/NotificationsDropdown";

/* -------------------------------------------------------------------------- */
/* DONUT CHART (CSS) */
/* -------------------------------------------------------------------------- */
function DonutChart({ data, title }) {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        No data available
      </div>
    );
  }
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;
  const COLORS = ["#8B5CF6", "#10B981", "#EF4444", "#3B82F6", "#F59E0B"];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-56">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="18"
          />
          {/* Colored segments */}
          {data.map((item, i) => {
            const percent = (item.value / total) * 100;
            const dashArray = (percent * 2.827).toFixed(3);
            const dashOffset = (cumulativePercent * 2.827).toFixed(3);
            cumulativePercent += percent;

            return (
              <circle
                key={i}
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth="18"
                strokeDasharray={`${dashArray} 283`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt" // CHANGE FROM "round" TO "butt"
                className="transition-all duration-1000 ease-out"
              />
            );
          })}
        </svg>
        {/* Center total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-[#2f4156]">{total}</div>
          <div className="text-sm text-gray-600 mt-1">{title}</div>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-6 space-y-2 w-full">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-gray-700">{item.name}</span>
            </div>
            <span className="font-semibold text-[#2f4156]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CARD COMPONENT */
/* -------------------------------------------------------------------------- */
function DashboardCard({ title, children }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-transform duration-300 hover:scale-[1.03] hover:shadow-2xl hover:-translate-y-1"
      style={{
        animation: "fadeInUp 0.6s ease both",
      }}
    >
      <h3 className="text-xl font-bold text-[#2f4156] mb-6">{title}</h3>
      {children}
    </div>
  );
}

export default function Admin() {
  // Sidebar is provided by FixedSidebarAdmin (shared design with Events office)

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
  const [professorFilter, setProfessorFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // Debounced admin filters to avoid per-keystroke filtering
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [debouncedEventFilter, setDebouncedEventFilter] = useState(eventFilter);
  const [debouncedProfessorFilter, setDebouncedProfessorFilter] =
    useState(professorFilter);
  const [debouncedLocationFilter, setDebouncedLocationFilter] =
    useState(locationFilter);
  const [debouncedDateFilter, setDebouncedDateFilter] = useState(dateFilter);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedEventFilter(eventFilter), 300);
    return () => clearTimeout(t);
  }, [eventFilter]);
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedProfessorFilter(professorFilter),
      300
    );
    return () => clearTimeout(t);
  }, [professorFilter]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocationFilter(locationFilter), 300);
    return () => clearTimeout(t);
  }, [locationFilter]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedDateFilter(dateFilter), 300);
    return () => clearTimeout(t);
  }, [dateFilter]);

  const API_ORIGIN = "http://localhost:3001";

  // ===== Chart Data =====
  const userPie = [
    { name: "Verified", value: verifiedUsers.length },
    { name: "Pending", value: pendingUsers.length },
  ];

  const vendorPie = [
    {
      name: "Accepted",
      value:
        vendorBazaarRequests.filter((r) => r.status === "accepted").length +
        vendorBoothRequests.filter((r) => r.status === "accepted").length,
    },
    {
      name: "Pending",
      value:
        vendorBazaarRequests.filter((r) => r.status === "pending").length +
        vendorBoothRequests.filter((r) => r.status === "pending").length,
    },
    {
      name: "Rejected",
      value:
        vendorBazaarRequests.filter((r) => r.status === "rejected").length +
        vendorBoothRequests.filter((r) => r.status === "rejected").length,
    },
  ];

  const eventPie = [
    {
      name: "Workshops",
      value: events.filter(
        (e) => e.type === "WORKSHOP" || e.eventType === "workshop"
      ).length,
    },
    {
      name: "Trips",
      value: events.filter((e) => e.type === "TRIP" || e.eventType === "trip")
        .length,
    },
    {
      name: "Conferences",
      value: events.filter(
        (e) => e.type === "CONFERENCE" || e.eventType === "conference"
      ).length,
    },
    {
      name: "Bazaars",
      value: events.filter(
        (e) => e.type === "BAZAAR" || e.eventType === "bazaar"
      ).length,
    },
    {
      name: "Booths",
      value: events.filter((e) => e.type === "BOOTH" || e.eventType === "booth")
        .length,
    },
  ];

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
        const end = new Date(
          start.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000
        );

        return {
          ...booth,
          _id: booth._id,
          eventType: "booth",
          title: booth.attendees?.[0]?.name || `Booth ${booth._id}`,
          durationWeeks,
          location:
            booth.platformSlot ||
            booth.boothLocation ||
            booth.locationName ||
            "—",
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          registrations: booth.registrations || [],
        };
      });

      // Fetch events from unified endpoint with filters
      let allEvents = [];
      const errors = [];

      try {
        const params = new URLSearchParams();

        // Combine search and professor filter into search param
        const searchParts = [];
        if (debouncedSearchQuery) searchParts.push(debouncedSearchQuery);
        if (debouncedProfessorFilter)
          searchParts.push(debouncedProfessorFilter);
        if (searchParts.length > 0) {
          params.append("search", searchParts.join(" "));
        }

        if (debouncedLocationFilter)
          params.append("location", debouncedLocationFilter);
        if (debouncedEventFilter && debouncedEventFilter !== "") {
          params.append("type", debouncedEventFilter.toUpperCase());
        }
        if (debouncedDateFilter) params.append("date", debouncedDateFilter);
        params.append("sort", "startDateTime");
        // Reverse the order for server because server logic is inverted
        params.append("order", sortOrder === "asc" ? "desc" : "asc");

        const unifiedAttempt = await tryFetchJson(
          `${API_ORIGIN}/api/events/all?${params.toString()}`
        );

        if (unifiedAttempt.ok && unifiedAttempt.data) {
          const unifiedEvents = Array.isArray(unifiedAttempt.data)
            ? unifiedAttempt.data
            : unifiedAttempt.data.events || [];
          allEvents.push(...unifiedEvents);
        } else {
          errors.push(
            `Failed to fetch unified events: ${unifiedAttempt.status} ${
              unifiedAttempt.error || "No data"
            }`
          );
        }
      } catch (err) {
        console.error("Error fetching unified events:", err);
        errors.push(`Error fetching events: ${err.message}`);
      }

      // Apply client-side filtering to booth events since they're not in the unified endpoint
      let filteredBoothEvents = boothEvents;

      // Filter by type
      if (
        debouncedEventFilter &&
        debouncedEventFilter !== "" &&
        debouncedEventFilter.toLowerCase() !== "booth"
      ) {
        filteredBoothEvents = [];
      } else {
        // Filter by search/professor (title in booth events)
        if (debouncedSearchQuery || debouncedProfessorFilter) {
          const searchLower = (debouncedSearchQuery || "").toLowerCase();
          const profLower = (debouncedProfessorFilter || "").toLowerCase();
          filteredBoothEvents = filteredBoothEvents.filter((booth) => {
            const title = (booth.title || "").toLowerCase();
            const matchesSearch = !searchLower || title.includes(searchLower);
            const matchesProf = !profLower || title.includes(profLower);
            return matchesSearch && matchesProf;
          });
        }

        // Filter by location
        if (debouncedLocationFilter) {
          const locLower = debouncedLocationFilter.toLowerCase();
          filteredBoothEvents = filteredBoothEvents.filter((booth) =>
            (booth.location || "").toLowerCase().includes(locLower)
          );
        }

        // Filter by date
        if (debouncedDateFilter) {
          const filterDate = new Date(debouncedDateFilter);
          const nextDay = new Date(filterDate);
          nextDay.setDate(filterDate.getDate() + 1);
          filteredBoothEvents = filteredBoothEvents.filter((booth) => {
            if (!booth.startDateTime) return false;
            const boothDate = new Date(booth.startDateTime);
            return boothDate >= filterDate && boothDate < nextDay;
          });
        }
      }

      // Add filtered booth events to all events
      allEvents.push(...filteredBoothEvents);

      // Sort combined events by date (reverse logic to match server behavior)
      allEvents.sort((a, b) => {
        const dateA = new Date(a.startDateTime || a.startDate || a.date);
        const dateB = new Date(b.startDateTime || b.startDate || b.date);
        return sortOrder === "asc" ? dateB - dateA : dateA - dateB;
      });

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
  }, [
    debouncedSearchQuery,
    debouncedProfessorFilter,
    debouncedLocationFilter,
    debouncedEventFilter,
    debouncedDateFilter,
    sortOrder,
  ]);

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
    if (!window.confirm(`Are you sure you want to ${newStatus} this user?`))
      return;

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

  // Logout is handled inside the FixedSidebarAdmin component

  const handleCreateUser = async () => {
    if (
      !createUserForm.name ||
      !createUserForm.email ||
      !createUserForm.password
    ) {
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
        setMessage(
          `✅ ${
            createUserRole.charAt(0).toUpperCase() + createUserRole.slice(1)
          } created successfully!`
        );
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
      {/* Fixed admin sidebar (shared design with events office) */}
      <FixedSidebarAdmin />

      {/* Main Section */}
      <div className="flex-1 overflow-auto" style={{ marginLeft: "260px" }}>
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-[#2f4156]">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex gap-2 items-center">
              <NotificationsDropdown />
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
          {/* Loading */}
          {loading && (
            <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
              <div className="text-3xl font-bold text-[#8B5CF6]">
                Loading Dashboard...
              </div>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            <DashboardCard title="Users Overview">
              <DonutChart data={userPie} title="Total Users" />
            </DashboardCard>
            <DashboardCard title="Vendor Requests">
              <DonutChart data={vendorPie} title="Total Requests" />
            </DashboardCard>
            <DashboardCard title="Events Distribution">
              <DonutChart data={eventPie} title="Total Events" />
            </DashboardCard>
          </div>

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
                    onClick={() =>
                      handleBlock(user._id, user.status || "active")
                    }
                    style={{
                      backgroundColor:
                        user.status === "blocked" ? "#10B981" : "#EF4444",
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
                    onClick={() =>
                      handleBlock(user._id, user.status || "active")
                    }
                    style={{
                      backgroundColor:
                        user.status === "blocked" ? "#10B981" : "#EF4444",
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
  // Server already filtered events, so just use them directly
  const filteredEvents = events;

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
                    {(event.type || event.eventType || "event")
                      .charAt(0)
                      .toUpperCase() +
                      (event.type || event.eventType || "event").slice(1)}
                  </td>
                  <td style={tdStyle}>
                    {event.title ||
                      event.name ||
                      event.workshopName ||
                      "Untitled"}
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
                        handleDeleteEvent(
                          event._id,
                          event.type || event.eventType
                        )
                      }
                      style={{
                        ...deleteBtnStyle,
                        ...(hasRegistrations
                          ? { opacity: 0.6, cursor: "not-allowed" }
                          : {}),
                      }}
                      disabled={processingId === event._id}
                      title={`Delete this ${
                        event.type || event.eventType || "event"
                      }`}
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

function CreateUserPopup({
  role,
  formData,
  setFormData,
  onClose,
  onCreate,
  sending,
}) {
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
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
