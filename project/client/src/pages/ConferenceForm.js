import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import FormField from "../components/FormField";
import { validateConference, isEditable, newId } from "../utils/validation";
import "../events.theme.css";

export default function ConferenceForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const editing = Boolean(id);
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
  });
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(editing);

  // Fetch existing conference if editing
  useEffect(() => {
    if (editing) {
      setLoading(true);
      fetch(`/api/conferences/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Conference not found");
          return res.json();
        })
        .then((conference) => {
          setData({
            ...conference,
            id: conference._id || conference.id,
            name: conference.name || conference.title,
            startDateTime: conference.startDateTime
              ? new Date(conference.startDateTime).toISOString().slice(0, 16)
              : "",
            endDateTime: conference.endDateTime
              ? new Date(conference.endDateTime).toISOString().slice(0, 16)
              : "",
          });
        })
        .catch((e) => {
          console.error("Fetch conference error:", e);
          alert("Failed to load conference");
          navigate("/events");
        })
        .finally(() => setLoading(false));
    }
  }, [id, editing, navigate]);

  const canEdit = isEditable(data.startDateTime);

  function handleChange(e) {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
  }

  async function saveConference() {
    const errs = validateConference(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Conferences can’t be edited after the start time.");
      return;
    }

    try {
      const url = editing ? `/api/conferences/${id}` : "/api/conferences";
      const method = editing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          title: data.name,
        }),
      });

      if (!response.ok) throw new Error("Failed to save conference");
      navigate("/events", { replace: true });
    } catch (e) {
      console.error("Save conference error:", e);
      alert("Failed to save conference");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validateConference(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Conferences can’t be edited after the start time.");
      return;
    }

    setConfirmOpen(true);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="events-theme">
      <div className="container">
        <NavBar bleed />

        <div className="eo-head-row">
          <h1>{editing ? "Edit Conference" : "Create Conference"}</h1>
          <button
            type="button"
            className="btn btn-outline eo-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            Back
          </button>
        </div>

        {!canEdit && editing && (
          <div className="lock">
            This conference has started; editing is disabled.
          </div>
        )}

        <form onSubmit={handleSubmit} className="form form-pro" noValidate>
          <fieldset className="form-sec">
            <legend>Basic details</legend>
            <div className="form-grid">
              <FormField label="Name" error={errors.name} required>
                <input
                  name="name"
                  placeholder="e.g., Annual Tech Conference 2025"
                  value={data.name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.name)}
                  disabled={!canEdit && editing}
                  autoComplete="off"
                />
                <div className="help">Use a clear, searchable title.</div>
              </FormField>

              <FormField label="Website" error={errors.website} required>
                {" "}
                {/* Added required prop */}
                <input
                  type="url"
                  name="website"
                  placeholder="https://example.com/conference"
                  value={data.website}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.website)}
                  disabled={!canEdit && editing}
                  required // Added HTML required attribute
                />
                <div className="help">Link to the conference website.</div>
              </FormField>

              <FormField
                label="Short Description"
                error={errors.shortDescription}
                required
              >
                <textarea
                  name="shortDescription"
                  placeholder="One or two sentences about the conference."
                  value={data.shortDescription}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.shortDescription)}
                  rows={3}
                  disabled={!canEdit && editing}
                />
                <div className="help">This appears in the events list.</div>
              </FormField>
            </div>
          </fieldset>

          <fieldset className="form-sec">
            <legend>Schedule</legend>
            <div className="form-grid form-grid-2">
              <FormField label="Start" error={errors.startDateTime} required>
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={data.startDateTime}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.startDateTime)}
                  disabled={editing && !canEdit}
                />
              </FormField>

              <FormField label="End" error={errors.endDateTime} required>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={data.endDateTime}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.endDateTime)}
                  disabled={editing && !canEdit}
                />
              </FormField>
            </div>
          </fieldset>

          <fieldset className="form-sec">
            <legend>Agenda</legend>
            <FormField label="Full Agenda" error={errors.fullAgenda} required>
              <textarea
                name="fullAgenda"
                placeholder="Detailed schedule of sessions, speakers, and timings."
                value={data.fullAgenda}
                onChange={handleChange}
                aria-invalid={Boolean(errors.fullAgenda)}
                rows={6}
                disabled={!canEdit && editing}
              />
              <div className="help">
                Provide a comprehensive outline of the conference program.
              </div>
            </FormField>
          </fieldset>

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
                  placeholder="e.g., 5000"
                  value={data.requiredBudget}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.requiredBudget)}
                  disabled={!canEdit && editing}
                  min="0"
                  step="0.01"
                />
                <div className="help">Estimated total budget in EGP.</div>
              </FormField>

              <FormField
                label="Source of Funding"
                error={errors.fundingSource}
                required
              >
                <select
                  className="eo-select eo-select-lg"
                  name="fundingSource"
                  value={data.fundingSource}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.fundingSource)}
                  disabled={!canEdit && editing}
                  required
                >
                  <option value="" disabled hidden>
                    Select source
                  </option>
                  <option value="GUC">GUC</option>
                  <option value="external">External</option>
                </select>
                <div className="help">Indicate primary funding source.</div>
              </FormField>
            </div>
          </fieldset>

          <fieldset className="form-sec">
            <legend>Resources</legend>
            <FormField
              label="Extra Required Resources"
              error={errors.extraResources}
            >
              <textarea
                name="extraResources"
                placeholder="e.g., Projector, microphones, venue setup, etc"
                value={data.extraResources}
                onChange={handleChange}
                aria-invalid={Boolean(errors.extraResources)}
                rows={4}
                disabled={!canEdit && editing}
              />
              <div className="help">
                List any additional materials or facilities needed.
              </div>
            </FormField>
          </fieldset>

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

        {confirmOpen && (
          <div className="confirm-overlay" role="dialog" aria-modal="true">
            <div className="confirm">
              <h2>{editing ? "Save changes?" : "Create this conference?"}</h2>
              <p>
                {editing ? (
                  <>
                    Are you sure you want to save these edits to{" "}
                    <strong>{data.name || "this conference"}</strong>?
                  </>
                ) : (
                  <>
                    Are you sure you want to create{" "}
                    <strong>{data.name || "this conference"}</strong>?
                  </>
                )}
              </p>

              {/* ✨ Same structure & classes as Bazaar */}
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
      </div>
    </div>
  );
}
