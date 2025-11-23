// client/src/pages/ConferenceForm.js
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import Sidebar from "../components/Sidebar";
import { validateConference, isEditable, newId } from "../utils/validation";
import "../events.theme.css";

export default function ConferenceForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const editing = Boolean(id);
  const [filter, setFilter] = useState("All");

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
    allowedRoles: [], // Default to empty (open to all)
  });

  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(editing);

  // Load existing conference
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
          allowedRoles: c.allowedRoles || [],
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

  // Handle changes
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
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

  // Save conference
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
          allowedRoles: data.allowedRoles,
        }),
      });

      if (!res.ok) throw new Error("Failed to save conference");
      navigate("/events", { replace: true });
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="events-theme" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar filter={filter} setFilter={setFilter} />

      <main style={{ flex: 1, marginLeft: "260px", padding: "24px" }}>
        <h1 style={{ marginTop: 0, color: "var(--navy)", marginBottom: "18px" }}>
          {editing ? "Edit Conference" : "Create Conference"}
        </h1>

        {!canEdit && editing && (
          <div className="lock">This conference has started; editing is disabled.</div>
        )}

        <form onSubmit={handleSubmit} className="form form-pro" noValidate>
          {/* Basic info */}
          <fieldset className="form-sec">
            <legend>Basic details</legend>
            <div className="form-grid">
              <FormField label="Name" error={errors.name} required>
                <input
                  name="name"
                  placeholder="e.g., Annual Tech Summit"
                  value={data.name}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
                <div className="help">Use a clear, descriptive title.</div>
              </FormField>

              <FormField label="Short Description" error={errors.shortDescription}>
                <textarea
                  name="shortDescription"
                  rows={3}
                  placeholder="Brief overview of the conference..."
                  value={data.shortDescription}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>

              <FormField label="Full Agenda" error={errors.fullAgenda}>
                <textarea
                  name="fullAgenda"
                  rows={5}
                  placeholder="Detailed agenda..."
                  value={data.fullAgenda}
                  onChange={handleChange}
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
                  disabled={editing && !canEdit}
                />
              </FormField>

              <FormField label="End" error={errors.endDateTime} required>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={data.endDateTime}
                  onChange={handleChange}
                  disabled={editing && !canEdit}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Website */}
          <fieldset className="form-sec">
            <legend>Website</legend>
            <FormField label="Conference Website" error={errors.website} required>
              <input
                name="website"
                placeholder="https://conference.example.com"
                value={data.website}
                onChange={handleChange}
                disabled={!canEdit && editing}
              />
            </FormField>
          </fieldset>

          {/* Budget */}
          <fieldset className="form-sec">
            <legend>Budget</legend>
            <div className="form-grid form-grid-2">
              <FormField label="Required Budget" error={errors.requiredBudget} required>
                <input
                  type="number"
                  name="requiredBudget"
                  placeholder="e.g., 5000"
                  value={data.requiredBudget}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>

              <FormField label="Funding Source" error={errors.fundingSource} required>
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
            <FormField label="Extra Required Resources" error={errors.extraResources}>
              <textarea
                name="extraResources"
                rows={4}
                value={data.extraResources}
                onChange={handleChange}
                disabled={!canEdit && editing}
              />
            </FormField>
          </fieldset>

          {/* FIXED: Role Restrictions */}
          <fieldset className="form-sec">
            <legend>Role Restrictions</legend>
            <p className="help">
              Select which roles may register. Leave all unchecked = open to everyone.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "12px" }}>
              {["student", "professor", "ta", "staff"].map((role) => (
                <label
                  key={role}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "15px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    value={role}
                    checked={data.allowedRoles.includes(role)}
                    onChange={handleChange}
                    disabled={!canEdit && editing}
                    style={{ width: "18px", height: "18px", marginRight: "8px" }}
                  />
                  <span style={{ textTransform: "capitalize" }}>{role}s only</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Submit */}
          <div className="form-actions">
            <button className="btn" type="submit" disabled={editing && !canEdit}>
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
                <button className="btn btn-outline" onClick={() => setConfirmOpen(false)}>
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