// client/src/pages/ConferenceForm.js (updated)
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import Sidebar from "../components/Sidebar"; // ✅ added
import { validateConference, isEditable, newId } from "../utils/validation";
import "../events.theme.css";

export default function ConferenceForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const editing = Boolean(id);
  const [filter, setFilter] = useState("All"); // sidebar requirement

  const [data, setData] = useState({
    id: newId(),
    type: "CONFERENCE",
    name: "",
    shortDescription: "",
    startDateTime: "",
    endDateTime: "",
    fullAgenda: "",
    website: "",
    requiredBudget: "",
    fundingSource: "",
    extraResources: "",
    allowedRoles: [], // ADD THIS: Default to empty (open to all)
  });

  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(editing);

  // ===================== LOAD EXISTING ======================
  useEffect(() => {
    if (!editing) return;

    setLoading(true);
    fetch(`/api/conferences/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Conference not found");
        return res.json();
      })
      .then((c) => {
        setData({
          ...c,
          id: c._id || c.id,
          name: c.name || c.title,
          startDateTime: c.startDateTime ? c.startDateTime.slice(0, 16) : "",
          endDateTime: c.endDateTime ? c.endDateTime.slice(0, 16) : "",
          allowedRoles: c.allowedRoles || [], // ADD THIS: Load from backend
        });
      })
      .catch((e) => {
        console.error(e);
        alert("Failed to load conference");
        navigate("/events");
      })
      .finally(() => setLoading(false));
  }, [editing, id, navigate]);

  const canEdit = isEditable(data.startDateTime);

  // ===================== CHANGE HANDLER ======================
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") { // ADD THIS: Handle checkbox for roles
      setData((d) => ({
        ...d,
        allowedRoles: checked
          ? [...d.allowedRoles, value]
          : d.allowedRoles.filter((r) => r !== value),
      }));
    } else {
      setData((d) => ({ ...d, [name]: value }));
    }
  }

  // ===================== SAVE ======================
  async function saveConference() {
    const errs = validateConference(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) return alert("Cannot edit after start time.");

    try {
      const url = editing ? `/api/conferences/${id}` : "/api/conferences";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...data, 
          title: data.name,
          allowedRoles: data.allowedRoles, // ADD THIS: Include in payload
        }),
      });

      if (!res.ok) throw new Error("Failed to save conference");
      navigate("/events", { replace: true });
    } catch (e) {
      console.error(e);
      alert("Failed to save conference");
    }
  }

  // ===================== SUBMIT ======================
  function handleSubmit(e) {
    e.preventDefault();
    const errs = validateConference(data);
    setErrors(errs);
    if (!Object.keys(errs).length) setConfirmOpen(true);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* ---------- LEFT SIDEBAR ---------- */}
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* ---------- RIGHT CONTENT ---------- */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "24px" }}>
        <h1 style={{ marginTop: 0, color: "var(--navy)" }}>
          {editing ? "Edit Conference" : "Create Conference"}
        </h1>

        {!canEdit && editing && (
          <div className="lock">
            This conference has started; editing is disabled.
          </div>
        )}

        <form onSubmit={handleSubmit} className="form form-pro" noValidate>
          {/* Basic Details */}
          <fieldset className="form-sec">
            <legend>Basic details</legend>
            <div className="form-grid">
              <FormField label="Name" error={errors.name} required>
                <input
                  name="name"
                  placeholder="Annual Tech Conference 2025"
                  value={data.name}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>

              <FormField label="Website" error={errors.website} required>
                <input
                  type="url"
                  name="website"
                  placeholder="https://example.com"
                  value={data.website}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>

              <FormField
                label="Short Description"
                error={errors.shortDescription}
                required
              >
                <textarea
                  name="shortDescription"
                  value={data.shortDescription}
                  onChange={handleChange}
                  rows={3}
                  disabled={!canEdit && editing}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Schedule */}
          <fieldset className="form-sec">
            <legend>Schedule</legend>
            <div className="form-grid form-grid-2">
              <FormField label="Start" error={errors.startDateTime} required>
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={data.startDateTime}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>

              <FormField label="End" error={errors.endDateTime} required>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={data.endDateTime}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Agenda */}
          <fieldset className="form-sec">
            <legend>Agenda</legend>
            <FormField label="Full Agenda" error={errors.fullAgenda} required>
              <textarea
                name="fullAgenda"
                rows={6}
                placeholder="Detailed program, speakers, schedule…"
                value={data.fullAgenda}
                onChange={handleChange}
                disabled={!canEdit && editing}
              />
            </FormField>
          </fieldset>

          {/* Budget */}
          <fieldset className="form-sec">
            <legend>Budget & Funding</legend>
            <div className="form-grid">
              <FormField
                label="Required Budget"
                error={errors.requiredBudget}
                required
              >
                <input
                  type="number"
                  name="requiredBudget"
                  value={data.requiredBudget}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>

              <FormField
                label="Funding Source"
                error={errors.fundingSource}
                required
              >
                <select
                  name="fundingSource"
                  value={data.fundingSource}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                >
                  <option value="">Select source</option>
                  <option value="GUC">GUC</option>
                  <option value="external">External</option>
                </select>
              </FormField>
            </div>
          </fieldset>

          {/* Resources */}
          <fieldset className="form-sec">
            <legend>Resources</legend>
            <FormField
              label="Extra Required Resources"
              error={errors.extraResources}
            >
              <textarea
                name="extraResources"
                rows={4}
                value={data.extraResources}
                onChange={handleChange}
                disabled={!canEdit && editing}
              />
            </FormField>
          </fieldset>

          {/* ADD THIS: Role Restrictions */}
          <fieldset className="form-sec">
            <legend>Role Restrictions</legend>
            <p className="help">Select roles allowed to register. Leave unchecked for open to all.</p>
            <div className="form-grid form-grid-2" style={{ display: "flex", flexWrap: "wrap" }}>
              {["student", "professor", "ta", "staff"].map((role) => (
                <label key={role} style={{ display: "flex", alignItems: "center", marginRight: "20px" }}>
                  <input
                    type="checkbox"
                    name="allowedRoles"
                    value={role}
                    checked={data.allowedRoles.includes(role)}
                    onChange={handleChange}
                    disabled={!canEdit && editing}
                  />
                  {role.charAt(0).toUpperCase() + role.slice(1)}s
                </label>
              ))}
            </div>
          </fieldset>

          {/* Submit */}
          <div className="form-actions">
            <button
              className="btn"
              type="submit"
              disabled={editing && !canEdit}
            >
              {editing ? "Save Changes" : "Create Conference"}
            </button>
          </div>
        </form>

        {/* Confirm Modal */}
        {confirmOpen && (
          <div className="confirm-overlay" role="dialog">
            <div className="confirm">
              <h2>{editing ? "Save changes?" : "Create this conference?"}</h2>

              <div className="confirm-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn"
                  onClick={() => {
                    setConfirmOpen(false);
                    saveConference();
                  }}
                >
                  {editing ? "Save changes" : "Create conference"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}